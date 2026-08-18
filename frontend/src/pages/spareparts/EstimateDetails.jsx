import React,{useEffect,useState,useRef} from "react";
import {useParams,useNavigate} from "react-router-dom";
import API from "../../api/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Shows a value, or "N/A" when it's missing. Keeps the printed form
// looking like a paper estimate even when some fields aren't filled in.
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
// e.g. 12000 -> "12,000". No forced decimals. Falls back to "N/A" like field().
const formatNumberField = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return Number(value).toLocaleString("en-KE");
};

export default function EstimateDetails(){

  const {id}=useParams();
  const navigate=useNavigate();
  const [estimate,setEstimate]=useState(null);
  const printRef = useRef();

  // Same pattern used in InvoiceDetails.jsx for "Served By"
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(()=>{
    const load=async()=>{
      const res = await API.get(`/estimates/${id}`);
      setEstimate(res.data);
    }
    load();
  },[id]);

  if(!estimate)
    return <div className="p-6">Loading estimate...</div>

  const convertToInvoice=async()=>{
    try{
      const res = await API.post(`/estimates/${id}/convert`);
      navigate(`/admin/spare-parts/invoices/${res.data.invoice.id}`);
    }catch(err){
      alert(err.response?.data?.error || "Conversion failed")
    }
  }

  // Renders the printable area into a (possibly multi-page) PDF and
  // returns it as a Blob. Mirrors ServiceEstimateDetails/ServiceInvoiceDetails
  // so every document in the app behaves and looks the same once
  // downloaded/shared:
  //   1. `.capture-hide` elements (live action buttons/inputs) are
  //      stripped from the clone before rasterizing — separate from
  //      `print:hidden`, which only affects the native browser Print
  //      and has no effect on html2canvas.
  //   2. Every cell is forced to vertically center with a looser
  //      line-height, since html2canvas rasterizes the DOM into a
  //      fixed-height row and tight line-height + 1px borders can leave
  //      glyphs hugging the bottom border.
  //   3. Row top/bottom boundaries are recorded, in the SAME layout that
  //      will actually be rasterized (after 1 and 2 above), so page
  //      breaks below never land in the middle of a row.
  const PDF_CAPTURE_WIDTH_PX = 1100;

  const generatePdfBlob = async () => {
    const rowBoundaries = [];

    // Fonts loading late (webfont swap) shift text metrics slightly
    // between machines depending on network/cache state, which can also
    // nudge content across a page boundary. Waiting for them to be fully
    // loaded before measuring/capturing keeps that deterministic.
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Pin the capture to the top of the container regardless of scroll
    // position, and lock the render viewport to a fixed width so the
    // layout never depends on the host browser's actual window size —
    // otherwise a narrower window/zoom wraps text onto more lines,
    // pushing content onto an extra page, while a wider window fits it
    // on one.
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
        // happened to lay out the live page.
        clonedDoc.querySelectorAll("table td, table th").forEach((el) => {
          el.style.verticalAlign = "middle";
          el.style.lineHeight = "1.6";
        });

        // PDF-only text sizing — bolder and bigger than the on-screen /
        // native-print sizes, without touching either of those.
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
          el.style.lineHeight = "1.4";
          el.style.margin = "0";
        });

        // Lighten table borders for capture only. At `scale: 2`,
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

    // Declared up front, before the pagination loop, since both the
    // slice-height math and the addImage call depend on them.
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
      link.download = `Estimate-${estimate.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not generate PDF");
    }
  };

  // Uses the native share sheet where available (most mobile browsers) so
  // the actual PDF file gets shared to WhatsApp/Email/etc. Desktop browsers
  // generally can't push a file into WhatsApp Web or a mail client this way,
  // so we fall back to opening WhatsApp Web / a mailto link with just a
  // text note in that case, and let the person attach the downloaded PDF.
  const handleShare = async () => {
    try {
      const blob = await generatePdfBlob();
      const file = new File([blob], `Estimate-${estimate.id}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Estimate EST-${estimate.id}`,
          text: `Estimate EST-${estimate.id} from Rift Motors`,
        });
      } else {
        const text = encodeURIComponent(
          `Estimate EST-${estimate.id} from Rift Motors - total KES ${formatMoney(estimate.total)}. PDF attached separately.`
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

  // Sum of every line's quantity and total — feeds the Totals row at the
  // bottom of the items table so the estimate is self-explanatory without
  // cross-checking the Sub Total box further down the page.
  const totalQty = (estimate.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const totalAmount = (estimate.items || []).reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen print-container">
      <div ref={printRef} className="max-w-5xl mx-auto bg-white print-document border border-black p-3 text-[10px] leading-[13px]">

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

  {/* VERTICAL DIVIDER — fixed height, centered with the logo/text */}
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
            ESTIMATE
          </h2>
        </div>

        {/* REF / CUSTOMER / VEHICLE GRID — bordered form fields like the paper estimate */}
        <table className="w-full border border-black text-[10px] leading-[13px]">
          <tbody>
            <tr>
              <td className="border border-black px-1 py-0.5 font-bold w-[10%] align-middle">REF:</td>
              <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>EST-{estimate.id}</td>
              <td className="border border-black px-1 py-0.5 font-bold w-[10%] align-middle">Date:</td>
              <td className="border border-black px-1 py-0.5 align-middle">{new Date(estimate.created_at).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 font-bold align-middle">Bill To:</td>
              <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}></td>
              <td className="border border-black px-1 py-0.5 font-bold align-middle">KRA Pin:</td>
              <td className="border border-black px-1 py-0.5 align-middle">{field(estimate.customer_kra_pin)}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 font-bold align-middle">Customer:</td>
              <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{field(estimate.customer_name)}</td>
              <td className="border border-black px-1 py-0.5 font-bold align-middle">Reg No:</td>
              <td className="border border-black px-1 py-0.5 align-middle">{field(estimate.reg_no)}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 font-bold align-middle">Address:</td>
              <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{field(estimate.customer_address)}</td>
              <td className="border border-black px-1 py-0.5 font-bold align-middle">Model:</td>
              <td className="border border-black px-1 py-0.5 align-middle">{field(estimate.model)}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 font-bold align-middle">Contact Person:</td>
              <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{field(estimate.contact_person)}</td>
              <td className="border border-black px-1 py-0.5 font-bold align-middle">Vin No:</td>
              <td className="border border-black px-1 py-0.5 align-middle">{field(estimate.vin_no)}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 font-bold align-middle">Mobile:</td>
              <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{field(estimate.customer_phone)}</td>
              <td className="border border-black px-1 py-0.5 font-bold align-middle">Engine:</td>
              <td className="border border-black px-1 py-0.5 align-middle">{field(estimate.engine)}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5" colSpan={3}></td>
              <td className="border border-black px-1 py-0.5 font-bold align-middle">Mileage:</td>
              <td className="border border-black px-1 py-0.5 align-middle">{formatNumberField(estimate.mileage)}</td>
            </tr>
          </tbody>
        </table>

        {/* ACTIONS — on-screen only. print:hidden keeps it out of the
            native browser Print, and capture-hide (stripped in the
            html2canvas onclone above) keeps it out of Download PDF /
            Share too. */}
        <div className="flex justify-end gap-3 my-3 print:hidden capture-hide">
          {estimate.status==="pending" &&
            <button
              onClick={()=>navigate(`/admin/spare-parts/estimates/${estimate.id}/edit`)}
              className="bg-yellow-600 text-white px-5 py-2 rounded"
            >Edit</button>
          }
          {estimate.status==="pending" &&
            <button
              onClick={convertToInvoice}
              className="bg-green-600 text-white px-5 py-2 rounded"
            >Convert To Invoice</button>
          }
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

        {/* ITEMS — thin borders + tight padding so 10+ rows still fit
            comfortably. Nothing caps the row count; it just grows
            compactly instead of ballooning. Cells switched to
            align-middle so text sits centered once the PDF font is
            bumped up in the onclone override above. */}
        <table className="w-full border border-black text-[10px] leading-normal mt-2">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-1 text-left border border-black align-middle">Code</th>
              <th className="p-1 text-left border border-black align-middle">Description</th>
              <th className="p-1 border border-black align-middle">Qty</th>
              <th className="p-1 border border-black align-middle">Unit Price</th>
              <th className="p-1 border border-black align-middle">Total</th>
            </tr>
          </thead>
          <tbody>
            {estimate.items?.map(item=>(
              <tr key={item.id}>
                <td className="p-1 border border-black align-middle">{field(item.part_number)}</td>
                <td className="p-1 border border-black align-middle">{item.name}</td>
                <td className="p-1 border border-black text-center align-middle">{item.quantity}</td>
                <td className="p-1 border border-black text-right align-middle">{formatMoney(item.unit_price)}</td>
                <td className="p-1 border border-black text-right align-middle font-bold">{formatMoney(item.total)}</td>
              </tr>
            ))}

            {/* TOTALS ROW — always shown, mirrors the pattern used in
                ServiceEstimateDetails.jsx: Qty column sums every line's
                quantity, Total column sums every line's total, so the
                items table is self-explanatory without cross-checking the
                Sub Total box further down. */}
            <tr className="bg-gray-100 font-bold">
              <td colSpan={2} className="p-1 border border-black text-right align-middle">Totals</td>
              <td className="p-1 border border-black text-center align-middle">{totalQty}</td>
              <td className="p-1 border border-black text-right align-middle">-</td>
              <td className="p-1 border border-black text-right align-middle">{formatMoney(totalAmount)}</td>
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
              <tr>
                <td className="border border-black px-1 py-0.5 align-middle">Sub Total</td>
                <td className="border border-black px-1 py-0.5 text-right align-middle">{formatMoney(estimate.subtotal)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 align-middle">Discount</td>
                <td className="border border-black px-1 py-0.5 text-right align-middle">{formatMoney(estimate.discount)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 align-middle">Vat ({estimate.tax_rate}%)</td>
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

        {/* BRAND LOGOS */}
        <div className="doc-logos flex justify-between items-center px-2 mt-3">
          <img src="/brands/nissan.png" alt="Nissan" className="h-16 object-contain" />
          <img src="/brands/ford.jpg" alt="Ford" className="h-16 object-contain" />
          <img src="/brands/subaru.jpg" alt="Subaru" className="h-16 object-contain" />
        </div>

      </div>
    </div>
  );
}