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
  const [showBillToModal, setShowBillToModal] = useState(false);
  const [billToName, setBillToName] = useState("");
  const [billToKraPin, setBillToKraPin] = useState("");
  const [converting, setConverting] = useState(false);
  const printRef = useRef();

  // Same pattern used in InvoiceDetails.jsx for "Served By"
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(()=>{
    const load=async()=>{
      try{
        const res = await getServiceEstimate(id);
        setEstimate(res.data);
        setBillToName(res.data.bill_to_name || res.data.customer_name || "");
        setBillToKraPin(res.data.bill_to_kra_pin || "");
      }catch(err){
        console.log(err);
      }
    }
    load();
  },[id]);

  if(!estimate)
    return (<div className="p-6">Loading estimate...</div>)

    const handleOpenConvertModal = () => {
    setShowBillToModal(true);
  };

  const handleConfirmConvert = async()=>{
    setConverting(true);
    try{
      const res = await convertServiceEstimate(id, {
        bill_to_name: billToName.trim(),
        bill_to_kra_pin: billToKraPin.trim()
      });
      alert("Estimate converted to invoice");
      navigate(`/admin/services/invoices/${res.data.invoice.id}`);
    }catch(err){
      alert(err.response?.data?.error || "Failed converting invoice");
    }finally{
      setConverting(false);
    }
  }

  // Renders the printable area into a (possibly multi-page) PDF and
  // returns it as a Blob.
  //
  // `onclone` runs against a temporary clone of the DOM that html2canvas
  // is about to rasterize. We use it for three things:
  //   1. Strip everything marked `.capture-hide` — the live discount
  //      editing controls, the action buttons, and (conditionally, via
  //      the `hasDiscount` flag below) the whole Discount column when
  //      it's unused. This is separate from `print:hidden`, which only
  //      affects the browser's native window.print() and has no effect
  //      on html2canvas.
  //   2. Force clean, vertically-centered text in every cell. On screen,
  //      `align-top` looks fine because the browser keeps short-line text
  //      high in the cell naturally, but once html2canvas rasterizes the
  //      DOM into a fixed-height row, the very tight `leading-tight`
  //      line-height combined with 1px borders can leave glyphs hugging
  //      the bottom border. Setting `verticalAlign` inline (it overrides
  //      any class) plus a looser line-height and a touch more padding
  //      fixes this only for the exported clone — it never touches how
  //      the page looks on screen or under window.print().
  //   3. Record the top/bottom of every table row, in the SAME layout
  //      that will actually be rasterized (i.e. after 1 and 2 above have
  //      been applied). We use these boundaries below so a page break
  //      never lands in the middle of a row.
  // Fixed pixel width used for every PDF capture, regardless of the
  // actual browser window size or zoom level on the machine doing the
  // download. The print container is responsive (`max-w-5xl mx-auto`),
  // so without this, `scrollWidth` reflects whatever width it happened
  // to render at on that specific screen — a narrower window/zoom wraps
  // text onto more lines, making the content taller and pushing it onto
  // a second PDF page, while a wider window fits it on one. Pinning the
  // capture to one fixed width makes the layout — and therefore the
  // page count — identical on every machine. 1024px matches Tailwind's
  // max-w-5xl (64rem @ 16px root).
  const PDF_CAPTURE_WIDTH_PX = 1100;

  const generatePdfBlob = async () => {
    const rowBoundaries = [];

    // Fonts loading late (webfont swap) shift text metrics slightly
    // between machines depending on network/cache state, which can also
    // nudge content across a page boundary. Waiting for them to be fully
    // loaded before measuring/capturing keeps that deterministic too.
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Pin the capture to the top of the container regardless of scroll
    // position, and lock the render viewport to a fixed width (see
    // PDF_CAPTURE_WIDTH_PX above) so the layout never depends on the
    // host browser's actual window size.
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: PDF_CAPTURE_WIDTH_PX,
      windowHeight: printRef.current.scrollHeight,
      onclone: (clonedDoc) => {
        // Force the print container itself to the same fixed width,
        // overriding its responsive max-w-5xl/mx-auto behavior so it
        // can't shrink to fit a narrower virtual viewport.
        const clonedContainer = clonedDoc.querySelector(".print-document");
        if (clonedContainer) {
          clonedContainer.style.width = `${PDF_CAPTURE_WIDTH_PX}px`;
          clonedContainer.style.maxWidth = `${PDF_CAPTURE_WIDTH_PX}px`;
          clonedContainer.style.margin = "0";
        }

        clonedDoc.querySelectorAll(".capture-hide").forEach((el) => {
          el.style.display = "none";
        });

        // Force vertical centering, during capture only. Inline styles
        // win over any class, so this is immune to how the browser
        // happened to lay out the live page and to any Tailwind class
        // differences.
        clonedDoc.querySelectorAll("table td, table th").forEach((el) => {
          el.style.verticalAlign = "middle";
          el.style.lineHeight = "1.6";
        });

        // Match font sizes to the exact @media print rules in index.css,
        // since html2canvas screenshots the live on-screen DOM and has
        // no awareness of @media print at all — without this override,
        // the PDF always renders at the smaller on-screen Tailwind sizes
        // (e.g. text-[9px]/text-[10px]) instead of the larger sizes
        // reserved for print output, which is why the PDF font looked
        // small compared to the native browser Print button.
        //
        // Bumped a notch further (and table cells given real font-weight)
        // so the downloaded PDF reads bolder/bigger than plain print output.
        if (clonedContainer) {
          clonedContainer.style.fontSize = "14px";
        }

        clonedDoc.querySelectorAll("table th").forEach((el) => {
          el.style.fontSize = "16px";
          el.style.fontWeight = "800";
          el.style.padding = "6px 7px";
        });

        clonedDoc.querySelectorAll("table td").forEach((el) => {
          el.style.fontSize = "15px";
          el.style.fontWeight = "700";
          el.style.padding = "5px 7px";
        });
        clonedDoc.querySelectorAll(".doc-title").forEach((el) => {
          // The h2 below jumps from 14px to 28px, so the container needs
          // real padding (not the on-screen py-1 = 4px) to fit the taller
          // line without spilling into the hr above or the table below.
          el.style.paddingTop = "10px";
          el.style.paddingBottom = "10px";
        });
        clonedDoc.querySelectorAll(".doc-title h2").forEach((el) => {
          el.style.fontSize = "28px"; // was 18px
          el.style.fontWeight = "800";
          el.style.letterSpacing = "4px";
          el.style.color = "#000";
          el.style.lineHeight = "1.4"; // was inheriting the tight on-screen line-height
          el.style.margin = "0";
        });

        // Lighten table borders for capture only. At `scale: 3`,
        // html2canvas rasterizes a 1px `border-black` (#000) with enough
        // anti-aliasing that it reads as noticeably bolder/heavier in the
        // exported PNG than the same border does on screen or under
        // native window.print(). Swapping to a mid-gray and collapsing
        // borders (so adjacent cells don't double up their edges into an
        // even thicker line) fixes this without touching how the page
        // looks on screen or in the native Print flow.
        clonedDoc.querySelectorAll("table").forEach((el) => {
          el.style.borderCollapse = "collapse";
        });
        clonedDoc
          .querySelectorAll("table, table td, table th, table tr")
          .forEach((el) => {
            el.style.borderColor = "#555555";
          });

        // After hiding capture-hide elements and normalizing cell
        // alignment, layout has settled to match what will actually be
        // drawn into the canvas. Record every row's top/bottom relative
        // to the print container.
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

    // Declared up front (before the pagination loop) since both the
    // slice-height math and the addImage call below depend on them.
    // Previously `usableWidth` was declared with `const` further down,
    // inside the loop, but was referenced above that declaration on the
    // first iteration — a temporal-dead-zone ReferenceError that made
    // generatePdfBlob() throw and download/share fail silently behind
    // the "Could not generate PDF" / "Sharing failed" alerts.
    const margin = 6;
    const usableWidth = pageWidthMM - margin * 2;

    const SCALE = 2; // must match the `scale` option passed to html2canvas above
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
      const imgHeightMM = (sliceHeight * usableWidth) / canvas.width;

      if (pageIndex > 0) pdf.addPage();

      pdf.addImage(
          imgData,
          "PNG",
          margin,
          margin,
          usableWidth,
          imgHeightMM
      );

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
      <div ref={printRef} className="max-w-5xl mx-auto bg-white print-document border border-black p-2 text-[10px] leading-[13px]">

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
                <td className="border border-black px-1 py-0.5 font-bold w-[10%] align-middle">REF:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>
                  {estimate.estimate_number || `EST-${estimate.id}`}
                </td>
                <td className="border border-black px-1 py-0.5 font-bold w-[10%] align-middle">Date:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{new Date(estimate.created_at).toLocaleDateString()}</td>
              </tr>
            
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Bill To:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>
                  {field(estimate.bill_to_name || estimate.customer_name)}
                </td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">KRA Pin:</td>
                <td className="border border-black px-1 py-0.5 align-middle">
                  {field(estimate.bill_to_kra_pin || estimate.customer_kra_pin)}
                </td>
              </tr>

              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Customer:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={4}>
                  {field(estimate.customer_name)}
                </td>
              </tr>
              {estimate.driver_name && (
                <tr>
                  <td className="border border-black px-1 py-0.5 font-bold align-middle">Contact Person:</td>
                  <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{estimate.driver_name}</td>
                  <td className="border border-black px-1 py-0.5 font-bold align-middle">Phone:</td>
                  <td className="border border-black px-1 py-0.5 align-middle">{field(estimate.driver_phone)}</td>
                </tr>
              )}
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Address:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{field(estimate.customer_address)}</td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Reg No:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(estimate.registration_number)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Mobile:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{field(estimate.customer_phone)}</td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Model:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(estimate.vehicle_make)} {field(estimate.vehicle_model)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Status:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{estimate.status}</td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Vin No:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(estimate.vin_no)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5" colSpan={3}></td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Engine:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(estimate.engine_number)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5" colSpan={3}></td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Mileage:</td>
                <td className="border border-black px-1 py-0.5 align-middle">
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
              onClick={handleOpenConvertModal}
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
              to discount.

              Font bumped from 9px to 10px and cells switched from
              align-top to align-middle (both on screen and, redundantly
              but safely, forced again in the html2canvas onclone above)
              so the exported PDF is legible and text sits centered in
              each row rather than crowding the bottom border. */}
          <table className="w-full border border-black text-[10px] leading-normal mt-2">
            <colgroup>
              <col className="w-[46%]" />
              <col className="w-[8%]" />
              <col className="w-[15%]" />
              <col className={`w-[15%] ${hasDiscount ? "" : "print:hidden capture-hide"}`} />
              <col className="w-[16%]" />
            </colgroup>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-1 text-left border border-black align-middle">Description</th>
                <th className="p-1 border border-black align-middle">Qty</th>
                <th className="p-1 border border-black align-middle">Price (KES)</th>
                <th className={`p-1 border border-black align-middle ${hasDiscount ? "" : "print:hidden capture-hide"}`}>
                  Discount (KES)
                </th>
                <th className="p-1 border border-black align-middle">Total (KES)</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items?.map(item=>{
                const discount = lineDiscount(item);
                const canEdit = estimate.status === "pending";
                return (
                <tr key={item.id}>
                  <td className="p-1 border border-black align-middle">
                    {item.description}
                    {item.customer_supplied &&
                      <span className="italic text-gray-500 ml-1">(customer supplied)</span>
                    }
                  </td>
                  <td className="p-1 border border-black text-center align-middle">{item.quantity}</td>
                  <td className="p-1 border border-black text-right align-middle">
                    {item.customer_supplied ? "-" : formatMoney(item.unit_price)}
                  </td>

                  <td className={`p-1 border border-black align-middle ${hasDiscount ? "" : "print:hidden capture-hide"}`}>
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

                  <td className="p-1 border border-black align-middle text-right font-bold">
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
                <td className="p-1 border border-black text-right align-middle">Totals</td>
                <td className="p-1 border border-black text-center align-middle">{formatNumber(totalQty)}</td>
                <td className="p-1 border border-black text-right align-middle">{formatMoney(Number(estimate.subtotal) + totalDiscount)}</td>
                <td className={`p-1 border border-black text-right align-middle ${hasDiscount ? "" : "print:hidden capture-hide"}`}>
                  {formatMoney(totalDiscount)}
                </td>
                <td className="p-1 border border-black text-right align-middle">{formatMoney(estimate.subtotal)}</td>
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
                  <td className="border border-black px-1 py-0.5 font-bold align-middle" colSpan={2}>Payment To:</td>
                </tr>
                <tr><td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>NCBA Bank, Nakuru Branch</td></tr>
                <tr><td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>A/C Name: Rift Motors Ltd</td></tr>
                <tr><td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>A/C No: 3364820034, or through</td></tr>
                <tr><td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>Mpesa Paybill No: 532602</td></tr>
                <tr><td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>A/C No: RIFT MOTORS</td></tr>
              </tbody>
            </table>

            <table className="border border-black w-[40%] h-fit">
              <tbody>
                {totalDiscount > 0 && (
                  <>
                    <tr>
                      <td className="border border-black px-1 py-0.5 align-middle">Total</td>
                      <td className="border border-black px-1 py-0.5 text-right align-middle">{formatMoney(Number(estimate.subtotal) + totalDiscount)}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-1 py-0.5 align-middle">Discount</td>
                      <td className="border border-black px-1 py-0.5 text-right align-middle">-{formatMoney(totalDiscount)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td className="border border-black px-1 py-0.5 align-middle">Sub Total</td>
                  <td className="border border-black px-1 py-0.5 text-right align-middle">{formatMoney(estimate.subtotal)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5 align-middle">Vat </td>
                  <td className="border border-black px-1 py-0.5 text-right align-middle">{formatMoney(estimate.tax_amount)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5 font-bold align-middle">Total Amount</td>
                  <td className="border border-black px-1 py-0.5 text-right font-bold align-middle">{formatMoney(estimate.total)}</td>
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

        {
  showBillToModal && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 print:hidden capture-hide">
      <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">

        <h2 className="text-xl font-bold mb-2">Bill To (Invoice)</h2>

        <p className="text-sm text-slate-500 mb-4">
          The estimate can stay addressed to the customer, but this invoice
          may need to bill someone else — e.g. a company or department.
          Confirm or update who this invoice should actually bill.
        </p>

        <label className="text-sm">Bill To Name</label>
        <input
          type="text"
          value={billToName}
          onChange={(e)=>setBillToName(e.target.value)}
          placeholder="e.g. National Police Service HQ"
          className="w-full border rounded-lg p-2 mb-4"
        />

        <label className="text-sm">Bill To KRA Pin</label>
        <input
          type="text"
          value={billToKraPin}
          onChange={(e)=>setBillToKraPin(e.target.value)}
          placeholder="e.g. P051234567X"
          className="w-full border rounded-lg p-2 mb-4"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={()=>setShowBillToModal(false)}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmConvert}
            disabled={converting || !billToName.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {converting ? "Converting..." : "Convert To Invoice"}
          </button>
        </div>

      </div>
    </div>
  )
}

      </div>
    </div>
  )
}

export default ServiceEstimateDetails;