import React,{useEffect,useState,useRef} from "react";
import {useParams,useNavigate} from "react-router-dom";
import {
  getServiceEstimate,
  convertServiceEstimate,
  updateEstimateItem
} from "../../api/serviceApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Shows a value, or "N/A" when it's missing (e.g. no vehicle linked to
// the job, or the customer has no KRA pin on file yet).
const field = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

// Formats a number as KES money with thousands separators, e.g. 3500 -> "3,500.00"
const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Formats a plain integer-ish number (qty, mileage) with thousands separators,
// e.g. 12000 -> "12,000". No forced decimals.
const formatNumber = (value) => Number(value || 0).toLocaleString("en-KE");

// Discount amount for a single line item — the difference between what it
// would have cost and what it actually costs. Works the same whether the
// underlying adjustment was a flat KES reduction or a percentage discount,
// so the table only ever has to display one clean number. Customer-supplied
// parts are always zero-priced, so their discount is zero too - they never
// contribute here.
const lineDiscount = (item) =>
  Number(item.original_price || 0) - Number(item.total_price || 0);

const ServiceEstimateDetails =()=>{

  const {id}=useParams();
  const navigate = useNavigate();
  const [estimate,setEstimate]=useState(null);
  const [adjustments,setAdjustments]=useState({});
  const printRef = useRef();

  // Same pattern used in InvoiceDetails.jsx for "Served By"
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(()=>{
    const load=async()=>{
      try{
        const res = await getServiceEstimate(id);
        setEstimate(res.data);
      }catch(err){
        console.log(err);
      }
    }
    load();
  },[id]);

  if(!estimate)
    return (<div className="p-6">Loading estimate...</div>)

  const handleConvertInvoice = async()=>{
    try{
      const res = await convertServiceEstimate(id);
      alert("Estimate converted to invoice");
      navigate(`/admin/services/invoices/${res.data.invoice.id}`);
    }catch(err){
      alert(err.response?.data?.error || "Failed converting invoice");
    }
  }

  // Renders the printable area into a (possibly multi-page) PDF and
  // returns it as a Blob.
  //
  // `onclone` runs against a temporary clone of the DOM that html2canvas
  // is about to rasterize. We use it for two things:
  //   1. Strip everything marked `.capture-hide` — the live discount
  //      editing controls, the action buttons, and (conditionally, via
  //      the `hasDiscount` flag below) the whole Discount column when
  //      it's unused. This is separate from `print:hidden`, which only
  //      affects the browser's native window.print() and has no effect
  //      on html2canvas.
  //   2. Record the top/bottom of every table row, in the SAME layout
  //      that will actually be rasterized (i.e. after the capture-hide
  //      elements above are removed). We use these boundaries below so a
  //      page break never lands in the middle of a row.
  const generatePdfBlob = async () => {
    const rowBoundaries = [];

    // Pin the capture to the top of the container regardless of scroll
    // position, and lock the render viewport to the container's real
    // size so a narrow window doesn't reflow the layout before capture.
    const canvas = await html2canvas(printRef.current, {
      scale: 3,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: printRef.current.scrollWidth,
      windowHeight: printRef.current.scrollHeight,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll(".capture-hide").forEach((el) => {
          el.style.display = "none";
        });

        // The on-screen rows use very tight line-height (leading-tight,
        // 9-10px text) against 1px borders. html2canvas rounds text
        // baselines slightly differently than the browser does, so at
        // that tightness the border ends up sitting on top of the
        // descenders of the text — it looks like the border line is
        // slicing through the letters. Loosening line-height and adding
        // a touch of vertical padding, only in this capture clone, gives
        // the text breathing room without changing how the page looks
        // on screen or under window.print().
        clonedDoc.querySelectorAll("table td, table th").forEach((el) => {
          el.style.lineHeight = "1.5";
          el.style.paddingTop = "3px";
          el.style.paddingBottom = "3px";
        });

        // After hiding capture-hide elements, layout has settled to
        // match what will actually be drawn into the canvas. Record
        // every row's top/bottom relative to the print container.
        const container = clonedDoc.querySelector(".print-document");
        if (container) {
          const containerTop = container.getBoundingClientRect().top;
          container.querySelectorAll("tr").forEach((tr) => {
            const r = tr.getBoundingClientRect();
            rowBoundaries.push({
              top: r.top - containerTop,
              bottom: r.bottom - containerTop,
            });
          });
        }
      },
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidthMM = pdf.internal.pageSize.getWidth();
    const pageHeightMM = pdf.internal.pageSize.getHeight();

    const SCALE = 3; // must match the `scale` option passed to html2canvas above
    const pxPerMM = canvas.width / pageWidthMM;
    const pageHeightPx = pageHeightMM * pxPerMM;

    const rowBottoms = rowBoundaries
      .map((r) => r.bottom * SCALE)
      .sort((a, b) => a - b);

    let currentY = 0;
    let pageIndex = 0;

    while (currentY < canvas.height - 1) {
      const idealEnd = Math.min(currentY + pageHeightPx, canvas.height);
      let sliceEnd = idealEnd;

      if (idealEnd < canvas.height) {
        // Snap the break to the bottom of the last row that fully fits,
        // so we never cut a row in half across a page boundary.
        const safeBreak = rowBottoms
          .filter((b) => b > currentY && b <= idealEnd)
          .pop();
        if (safeBreak) sliceEnd = safeBreak;
      }

      const sliceHeight = Math.round(sliceEnd - currentY);
      if (sliceHeight <= 0) break;

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;
      sliceCanvas
        .getContext("2d")
        .drawImage(
          canvas,
          0, currentY, canvas.width, sliceHeight,
          0, 0, canvas.width, sliceHeight
        );

      const imgData = sliceCanvas.toDataURL("image/png");
      const imgHeightMM = sliceHeight / pxPerMM;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pageWidthMM, imgHeightMM);

      currentY = sliceEnd;
      pageIndex += 1;
    }

    return pdf.output("blob");
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ServiceEstimate-${estimate.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not generate PDF");
    }
  };

  // Native share sheet where available (most mobile browsers share the
  // real PDF file). Desktop browsers can't push a file into WhatsApp Web
  // or a mail client this way, so we fall back to downloading the PDF and
  // opening WhatsApp Web with just a text note.
  const handleShare = async () => {
    try {
      const blob = await generatePdfBlob();
      const file = new File([blob], `ServiceEstimate-${estimate.id}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Service Estimate EST-${estimate.id}`,
          text: `Service Estimate EST-${estimate.id} from Rift Motors`,
        });
      } else {
        const text = encodeURIComponent(
          `Service Estimate EST-${estimate.id} from Rift Motors - total KES ${formatMoney(estimate.total)}. PDF attached separately.`
        );
        if (window.confirm("Your browser can't attach the PDF directly. Download it now, then open WhatsApp to send it manually?")) {
          await handleDownloadPdf();
          window.open(`https://wa.me/?text=${text}`, "_blank");
        }
      }
    } catch (err) {
      alert("Sharing failed");
    }
  };

  const handleAdjustmentUpdate = async(itemId)=>{
    await updateEstimateItem(itemId, adjustments[itemId]);
    const res = await getServiceEstimate(id);
    setEstimate(res.data);
  }

  // Sum of every line's discount — feeds the Discount row in the totals box.
  const totalDiscount = (estimate.items || []).reduce(
    (sum, item) => sum + lineDiscount(item),
    0
  );

  // Whether any discount has actually been applied. Drives whether the
  // Discount column shows up at all in print/PDF/Share output — the
  // column (and its editing controls) always stays visible on screen so
  // a discount can be entered in the first place.
  const hasDiscount = totalDiscount > 0;

  // Sum of every line's quantity — feeds the Qty column in the items-table
  // totals row so the estimate is self-explanatory without cross-checking
  // the summary box further down the page.
  const totalQty = (estimate.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <div className="print-container p-6 bg-gray-100 min-h-screen">
      <div ref={printRef} className="max-w-5xl mx-auto bg-white print-document border border-black p-3 text-[10px] leading-[13px]">

        {/* OUTER FRAME — wraps everything except the brand logos */}
        <div className="border-2 border-black p-3">

          {/* HEADER */}
          <div className="doc-header flex justify-center items-center gap-4 pb-2">

            {/* LOGO */}
            <div className="flex items-center justify-end">
              <img
                src="/rmotologo.jpg"
                className="h-16 w-auto object-contain"
                alt="Rift Motors Limited"
              />
            </div>

            {/* VERTICAL DIVIDER */}
            <div className="border-l-2 border-black self-stretch"></div>

            {/* CONTACT INFO */}
            <div className="flex flex-col justify-center text-left text-[9px] leading-[14px] text-gray-700 space-y-0.5">
              <p>P.O. Box 18952 - 20100</p>
              <p>KFA - Show Ground Road, Nakuru</p>
              <p className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-1.71.855a11.042 11.042 0 005.516 5.516l.854-1.71a1 1 0 011.211-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +254 790 406 996
              </p>
              <p className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@riftmotors.com
              </p>
              <p className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                riftmotorsltd@gmail.com
              </p>
              {/* PIN bumped up from the surrounding 9px block to 12px for visibility */}
              <p className="font-bold text-black text-[12px]">PIN: PO51561799Q</p>
            </div>

          </div>

          <hr className="border-black border-t-2" />

          {/* TITLE */}
          <div className="doc-title text-center py-1">
            <h2 className="text-sm font-extrabold tracking-[4px] uppercase text-gray-900">
              SERVICE ESTIMATE
            </h2>
          </div>

          {/* REF / CUSTOMER / VEHICLE GRID — bordered form fields like the paper estimate */}
          <table className="w-full border border-black text-[10px] leading-[13px]">
            <tbody>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold w-[10%]">REF:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>
                  {estimate.estimate_number || `EST-${estimate.id}`}
                </td>
                <td className="border border-black px-1 py-0.5 font-bold w-[10%]">Date:</td>
                <td className="border border-black px-1 py-0.5">{new Date(estimate.created_at).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Bill To:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{field(estimate.customer_name)}</td>
                <td className="border border-black px-1 py-0.5 font-bold">KRA Pin:</td>
                <td className="border border-black px-1 py-0.5">{field(estimate.customer_kra_pin)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Address:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{field(estimate.customer_address)}</td>
                <td className="border border-black px-1 py-0.5 font-bold">Reg No:</td>
                <td className="border border-black px-1 py-0.5">{field(estimate.registration_number)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Mobile:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{field(estimate.customer_phone)}</td>
                <td className="border border-black px-1 py-0.5 font-bold">Model:</td>
                <td className="border border-black px-1 py-0.5">{field(estimate.vehicle_make)} {field(estimate.vehicle_model)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Status:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{estimate.status}</td>
                <td className="border border-black px-1 py-0.5 font-bold">Vin No:</td>
                <td className="border border-black px-1 py-0.5">{field(estimate.vin_no)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5" colSpan={3}></td>
                <td className="border border-black px-1 py-0.5 font-bold">Engine:</td>
                <td className="border border-black px-1 py-0.5">{field(estimate.engine_number)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5" colSpan={3}></td>
                <td className="border border-black px-1 py-0.5 font-bold">Mileage:</td>
                <td className="border border-black px-1 py-0.5">
                  {estimate.mileage === null || estimate.mileage === undefined || estimate.mileage === ""
                    ? "N/A"
                    : formatNumber(estimate.mileage)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ACTIONS — only ever meant for on-screen use. print:hidden keeps
              it out of the native browser Print, and capture-hide (stripped
              in the html2canvas onclone above) keeps it out of the
              Download PDF / Share captures too. */}
          <div className="flex justify-end gap-3 my-3 print:hidden capture-hide">
            <button
              onClick={handleConvertInvoice}
              disabled={estimate.status !== "pending"}
              className="bg-green-600 text-white px-5 py-2 rounded disabled:bg-gray-400"
            >Convert To Invoice</button>
            <button
              onClick={()=>window.print()}
              className="bg-gray-800 text-white px-5 py-2 rounded"
            >Print</button>
            <button
              onClick={handleDownloadPdf}
              className="bg-blue-800 text-white px-5 py-2 rounded"
            >Download PDF</button>
            <button
              onClick={handleShare}
              className="bg-emerald-700 text-white px-5 py-2 rounded"
            >Share</button>
          </div>

          {estimate.status==="invoiced" && (
            <div className="bg-blue-100 text-blue-700 p-2 rounded mb-2 text-[10px] print:hidden">
              This estimate has been converted to invoice and can no longer be edited.
            </div>
          )}

          {/* ITEMS — Discount has its own column so the Total column stays
              a single clean number. Editing controls only render on screen
              for pending estimates, and are stripped out of the PDF/Share
              capture via the capture-hide + onclone combo above, on top of
              print:hidden for the native browser Print button. The whole
              Discount column (header, col width, and each cell) is also
              conditionally hidden — via the same print:hidden + capture-hide
              pairing, driven by `hasDiscount` — in print/PDF/Share when no
              discount has been applied to anything on the estimate; on
              screen it always stays visible so a discount can be entered.
              Customer-supplied parts show "-" for price/total instead of
              0.00, and never get a discount editor since there's nothing
              to discount. */}
          <table className="w-full border border-black text-[9px] leading-tight mt-2">
            <colgroup>
              <col className="w-[34%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
              <col className="w-[15%]" />
              <col className={`w-[15%] ${hasDiscount ? "" : "print:hidden capture-hide"}`} />
              <col className="w-[16%]" />
            </colgroup>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-0.5 text-left border border-black">Description</th>
                <th className="p-0.5 text-left border border-black">Type</th>
                <th className="p-0.5 border border-black">Qty</th>
                <th className="p-0.5 border border-black">Price (KES)</th>
                <th className={`p-0.5 border border-black ${hasDiscount ? "" : "print:hidden capture-hide"}`}>
                  Discount (KES)
                </th>
                <th className="p-0.5 border border-black">Total (KES)</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items?.map(item=>{
                const discount = lineDiscount(item);
                const canEdit = estimate.status === "pending";
                return (
                <tr key={item.id}>
                  <td className="p-0.5 border border-black align-top">
                    {item.description}
                    {item.customer_supplied &&
                      <span className="italic text-gray-500 ml-1">(customer supplied)</span>
                    }
                  </td>
                  <td className="p-0.5 border border-black align-top">{item.item_type}</td>
                  <td className="p-0.5 border border-black text-center align-top">{item.quantity}</td>
                  <td className="p-0.5 border border-black text-right align-top">
                    {item.customer_supplied ? "-" : formatMoney(item.unit_price)}
                  </td>

                  <td className={`p-0.5 border border-black align-top ${hasDiscount ? "" : "print:hidden capture-hide"}`}>
                    {/* Printed/shared/downloaded view: just the amount */}
                    <div className="text-right">
                      {item.customer_supplied ? "-" : (discount > 0 ? formatMoney(discount) : "-")}
                    </div>

                    {/* On-screen only editing controls, stripped from exports.
                        Never shown for customer-supplied parts - price is
                        always zero, so there's nothing to discount. */}
                    {canEdit && item.item_type==="service" && (
                      <div className="mt-1 print:hidden capture-hide">
                        <div className="flex gap-1 mt-0.5">
                          <input
                            type="number"
                            value={adjustments[item.id]?.adjustment ?? item.adjustment ?? ""}
                            onChange={(e)=>
                              setAdjustments({
                                ...adjustments,
                                [item.id]:{
                                  ...adjustments[item.id],
                                  adjustment:Number(e.target.value)
                                }
                              })
                            }
                            className="border border-black rounded px-1 py-0.5 w-14 text-[9px]"
                          />
                          <button
                            onClick={()=>handleAdjustmentUpdate(item.id)}
                            className="bg-blue-600 text-white rounded px-2 text-[9px]"
                          >Apply</button>
                        </div>
                      </div>
                    )}

                    {canEdit && item.item_type==="sparepart" && !item.customer_supplied && (
                      <div className="mt-1 print:hidden capture-hide">
                        <div className="flex gap-1 mt-0.5 items-center">
                          <select
                            onChange={(e)=>
                              setAdjustments({
                                ...adjustments,
                                [item.id]:{
                                  ...adjustments[item.id],
                                  discount_type:e.target.value
                                }
                              })
                            }
                            className="border border-black rounded text-[9px]"
                          >
                            <option value="amount">KES</option>
                            <option value="percentage">%</option>
                          </select>
                          <input
                            type="number"
                            value={adjustments[item.id]?.discount_value ?? ""}
                            onChange={(e)=>
                              setAdjustments({
                                ...adjustments,
                                [item.id]:{
                                  ...adjustments[item.id],
                                  discount_value:Number(e.target.value)
                                }
                              })
                            }
                            className="border border-black rounded px-1 py-0.5 w-12 text-[9px]"
                          />
                          <button
                            onClick={()=>handleAdjustmentUpdate(item.id)}
                            className="bg-blue-600 text-white rounded px-2 text-[9px]"
                          >Apply</button>
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="p-0.5 border border-black align-top text-right font-bold">
                    {item.customer_supplied ? "-" : formatMoney(item.total_price)}
                  </td>
                </tr>
              )})}

              {/* TOTALS ROW — always shown, lands in the same Qty / Price /
                  Discount / Total columns as the line items above, so the
                  estimate is self-explanatory on its own: Qty column sums
                  every line's quantity, Price column shows the pre-discount
                  items total, Discount column shows what was taken off
                  (hidden entirely in print/PDF/Share when nothing was
                  discounted), and Total lands in the same column as
                  estimate.subtotal further down. */}
              <tr className="bg-gray-100 font-bold">
                <td colSpan={2} className="p-0.5 border border-black text-right">Totals</td>
                <td className="p-0.5 border border-black text-center">{formatNumber(totalQty)}</td>
                <td className="p-0.5 border border-black text-right">{formatMoney(Number(estimate.subtotal) + totalDiscount)}</td>
                <td className={`p-0.5 border border-black text-right ${hasDiscount ? "" : "print:hidden capture-hide"}`}>
                  {formatMoney(totalDiscount)}
                </td>
                <td className="p-0.5 border border-black text-right">{formatMoney(estimate.subtotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* PAYMENT DETAILS + TOTALS — both boxed tables, sitting side by
              side like the "Payment To" / "Sub Total, Vat, Total" pair on
              the paper estimate. */}
          <div className="flex justify-between mt-2 gap-4 text-[10px] leading-[13px]">

            <table className="border border-black w-[55%]">
              <tbody>
                <tr>
                  <td className="border border-black px-1 py-0.5 font-bold" colSpan={2}>Payment To:</td>
                </tr>
                <tr><td className="border border-black px-1 py-0.5" colSpan={2}>NCBA Bank, Nakuru Branch</td></tr>
                <tr><td className="border border-black px-1 py-0.5" colSpan={2}>A/C Name: Rift Motors Ltd</td></tr>
                <tr><td className="border border-black px-1 py-0.5" colSpan={2}>A/C No: 3364820034, or through</td></tr>
                <tr><td className="border border-black px-1 py-0.5" colSpan={2}>Mpesa Paybill No: 532602</td></tr>
                <tr><td className="border border-black px-1 py-0.5" colSpan={2}>A/C No: RIFT MOTORS</td></tr>
              </tbody>
            </table>

            <table className="border border-black w-[40%] h-fit">
              <tbody>
                {totalDiscount > 0 && (
                  <>
                    <tr>
                      <td className="border border-black px-1 py-0.5">Total</td>
                      <td className="border border-black px-1 py-0.5 text-right">{formatMoney(Number(estimate.subtotal) + totalDiscount)}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-1 py-0.5">Discount</td>
                      <td className="border border-black px-1 py-0.5 text-right">-{formatMoney(totalDiscount)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td className="border border-black px-1 py-0.5">Sub Total</td>
                  <td className="border border-black px-1 py-0.5 text-right">{formatMoney(estimate.subtotal)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5">Vat ({estimate.tax_rate}%)</td>
                  <td className="border border-black px-1 py-0.5 text-right">{formatMoney(estimate.tax_amount)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5 font-bold">Total Amount</td>
                  <td className="border border-black px-1 py-0.5 text-right font-bold">{formatMoney(estimate.total)}</td>
                </tr>
              </tbody>
            </table>

          </div>

          {/* FOOTER */}
          <div className="doc-footer mt-3 text-center border-t pt-2 text-[9px] text-gray-600">
        <p className="font-semibold">THANK YOU FOR YOUR BUSINESS!</p>
        <p className="mt-0.5">Goods remain property of the company unless fully paid for.</p>
        <p>Estimate applies one month from the date issued.</p>
        </div>

          {/* PRINTED BY / PRINTED ON */}
            <div className="mt-1 flex justify-between text-[9px] text-gray-500">
            <p>Printed By: {user?.username || "N/A"}</p>
            <p>Printed On: {new Date().toLocaleString()}</p>
          </div>
        </div>
        {/* END OUTER FRAME */}

        {/* BRAND LOGOS — outside the frame */}
        <div className="doc-logos flex justify-between items-center px-2 mt-3">
          <img src="/brands/nissan.png" alt="Nissan" className="h-16 object-contain" />
          <img src="/brands/ford.jpg" alt="Ford" className="h-16 object-contain" />
          <img src="/brands/subaru.jpg" alt="Subaru" className="h-16 object-contain" />
        </div>

      </div>
    </div>
  )
}

export default ServiceEstimateDetails;