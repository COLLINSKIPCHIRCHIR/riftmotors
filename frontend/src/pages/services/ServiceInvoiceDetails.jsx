import React,{useEffect,useState,useRef} from "react";
import {useParams,useNavigate} from "react-router-dom";
import {
  getServiceInvoice,
  payServiceInvoice,
  createCreditNote
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

// Discount amount for a single line item — mirrors the same helper used
// in ServiceEstimateDetails so the two documents stay visually consistent.
const lineDiscount = (item) =>
  Number(item.original_price || 0) - Number(item.total_price || 0);

const ServiceInvoiceDetails = () => {

  const {id} = useParams();
  const navigate = useNavigate();
  const [invoice,setInvoice] = useState(null);
  const [paymentMethod,setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [creditReason, setCreditReason] = useState("");
  // { [invoiceItemId]: { amount: string, quantity: string } }
  // `quantity` defaults to the invoice item's recorded quantity but can
  // be overridden — this is for correcting a wrong recorded quantity
  // (e.g. the old rounding bug turning 1.5 into 2), separate from the
  // credit amount itself. It never affects the money math.
  const [creditSelections, setCreditSelections] = useState({});
  const [issuingCredit, setIssuingCredit] = useState(false);
  const printRef = useRef();

  // Same pattern used elsewhere in the app for "Served By"/"Printed By"
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(()=>{
    const load = async()=>{
      const res = await getServiceInvoice(id);
      setInvoice(res.data);
    }
    load();
  },[id]);

  useEffect(()=>{
  if (invoice) {
    const remaining =
      Number(invoice.total) -
      Number(invoice.amount_paid || 0) -
      Number(invoice.amount_credited || 0);
    setAmountPaid(remaining > 0 ? remaining : "");
  }
}, [invoice]);

  if(!invoice)
    return <div className="p-6">Loading invoice...</div>

  // How much of this invoice's total can still be credited. Any invoice
  // qualifies regardless of payment status - a fully paid invoice can
  // still carry a credit, it just becomes money owed back rather than
  // reducing an unpaid balance.
  const remainingCreditable = Number(invoice.total) - Number(invoice.amount_credited || 0);

 const handlePay = async () => {
  if (!paymentMethod) {
    alert("Select payment method");
    return;
  }
  if (!amountPaid || Number(amountPaid) <= 0) {
    alert("Enter an amount to pay");
    return;
  }
  const remaining =
    Number(invoice.total) - Number(invoice.amount_paid || 0) - Number(invoice.amount_credited || 0);
  if (Number(amountPaid) > remaining) {
    alert(`Amount exceeds the outstanding balance of KES ${formatMoney(remaining)}`);
    return;
  }
  const res = await payServiceInvoice(invoice.id, paymentMethod, amountPaid);
  navigate(`/admin/services/receipts/${res.data.receipt.id}`);
};

const handleOpenCreditNoteModal = () => {
  setCreditReason("");
  setCreditSelections({});
  setShowCreditNoteModal(true);
};

const handleToggleCreditItem = (item) => {
  setCreditSelections((prev) => {
    const next = { ...prev };
    if (next[item.id] !== undefined) {
      delete next[item.id];
    } else {
      next[item.id] = { amount: item.total_price, quantity: item.quantity, restock: false };
    }
    return next;
  });
};

const handleCreditAmountChange = (itemId, value) => {
  setCreditSelections((prev) => ({
    ...prev,
    [itemId]: { ...prev[itemId], amount: value }
  }));
};

const handleCreditQuantityChange = (itemId, value) => {
  setCreditSelections((prev) => {
    const current = prev[itemId];
    const item = invoice.items.find((i) => i.id === itemId);
    // Restocked lines auto-recalculate the credit amount from
    // qty × unit price as the quantity changes — still editable
    // afterward if the return needs a partial-condition adjustment.
    const shouldRecalc = current?.restock && item;
    return {
      ...prev,
      [itemId]: {
        ...current,
        quantity: value,
        amount: shouldRecalc
          ? (Number(value || 0) * Number(item.unit_price)).toFixed(2)
          : current?.amount
      }
    };
  });
};


const handleToggleRestock = (item) => {
  setCreditSelections((prev) => {
    const current = prev[item.id] || { amount: item.total_price, quantity: item.quantity, restock: false };
    const nextRestock = !current.restock;
    const qty = Number(current.quantity ?? item.quantity) || 0;
    return {
      ...prev,
      [item.id]: {
        ...current,
        restock: nextRestock,
        amount: nextRestock ? (qty * Number(item.unit_price)).toFixed(2) : current.amount
      }
    };
  });
};



const handleSubmitCreditNote = async () => {
  const items = Object.entries(creditSelections).map(([invoice_item_id, sel]) => ({
    invoice_item_id: Number(invoice_item_id),
    credit_amount: Number(sel.amount || 0),
    quantity:
      sel.quantity !== undefined && sel.quantity !== "" ? Number(sel.quantity) : undefined,
    restock: !!sel.restock
  }));

  if (items.length === 0) {
    alert("Select at least one item");
    return;
  }

  setIssuingCredit(true);
  try {
    const res = await createCreditNote({
      invoice_id: invoice.id,
      reason: creditReason.trim(),
      items
    });
    navigate(`/admin/services/credit-notes/${res.data.creditNote.id}`);
  } catch (err) {
    alert(err.response?.data?.error || "Failed to issue credit note");
  } finally {
    setIssuingCredit(false);
  }
};

  // Renders the printable area into a (possibly multi-page) PDF and
  // returns it as a Blob. Mirrors ServiceEstimateDetails's generatePdfBlob
  // exactly, so estimates and invoices behave and look identical once
  // downloaded/shared, including once an estimate is converted into one
  // of these:
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
      link.download = `ServiceInvoice-${invoice.invoice_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not generate PDF");
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generatePdfBlob();
      const file = new File([blob], `ServiceInvoice-${invoice.invoice_number}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Service Invoice ${invoice.invoice_number}`,
          text: `Service Invoice ${invoice.invoice_number} from Rift Motors`,
        });
      } else {
        const text = encodeURIComponent(
          `Service Invoice ${invoice.invoice_number} from Rift Motors - total KES ${formatMoney(invoice.total)}. PDF attached separately.`
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

  // Sum of every line's discount — feeds the Discount row in the totals box.
  const totalDiscount = (invoice.items || []).reduce(
    (sum, item) => sum + lineDiscount(item),
    0
  );

  // Whether any discount has actually been applied. Drives whether the
  // Discount column shows up at all in print/PDF/Share output — mirrors
  // ServiceEstimateDetails so a converted estimate keeps the same
  // behaviour post-conversion. On screen the column always stays visible.
  const hasDiscount = totalDiscount > 0;

  // Sum of every line's quantity — feeds the Qty column in the items-table
  // totals row so the invoice is self-explanatory without cross-checking
  // the summary box further down the page.
  const totalQty = (invoice.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen print-container">
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
              SERVICE INVOICE
            </h2>
          </div>

          {/* REF / CUSTOMER / VEHICLE GRID */}
          <table className="w-full border border-black text-[10px] leading-[13px]">
            <tbody>

              
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold w-[10%] align-middle">REF:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{field(invoice.invoice_number)}</td>
                <td className="border border-black px-1 py-0.5 font-bold w-[10%] align-middle">Date:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{new Date(invoice.created_at).toLocaleDateString()}</td>
              </tr>
              

              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Bill To:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{field(invoice.bill_to_name || invoice.customer_name)}</td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">KRA Pin:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(invoice.bill_to_kra_pin || invoice.customer_kra_pin)}</td>
              </tr>

              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Customer:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={4}>
                  {field(invoice.customer_name)}
                </td>
              </tr>
              {invoice.driver_name && (
                <tr>
                  <td className="border border-black px-1 py-0.5 font-bold align-middle">Contact Person:</td>
                  <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{invoice.driver_name}</td>
                  <td className="border border-black px-1 py-0.5 font-bold align-middle">Phone:</td>
                  <td className="border border-black px-1 py-0.5 align-middle">{field(invoice.driver_phone)}</td>
                </tr>
              )}
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Address:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{field(invoice.customer_address)}</td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Reg No:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(invoice.registration_number)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Mobile:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{field(invoice.customer_phone)}</td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Model:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(invoice.vehicle_make)} {field(invoice.vehicle_model)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Status:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{invoice.status}</td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Vin No:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(invoice.vin_no)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5" colSpan={3}></td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Engine:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(invoice.engine_number)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5" colSpan={3}></td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Mileage:</td>
                <td className="border border-black px-1 py-0.5 align-middle">
                  {invoice.mileage === null || invoice.mileage === undefined || invoice.mileage === ""
                    ? "N/A"
                    : formatNumber(invoice.mileage)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ACTIONS — on-screen only. print:hidden keeps it out of the
              native browser Print, and capture-hide (stripped in the
              html2canvas onclone above) keeps it out of Download PDF /
              Share too. Record Payment only shows for unpaid/partial
              invoices, but Issue Credit Note is its own sibling block so
              it renders regardless of payment status - a paid invoice
              can still carry a credit (money owed back), it just can't
              take a payment anymore. */}
          <div className="flex justify-end gap-3 my-3 print:hidden capture-hide flex-wrap">

            {invoice.status!=="paid" && invoice.status!=="credited" && (
            <>
                <input
                type="number"
                placeholder="Amount to pay"
                value={amountPaid}
                onChange={(e)=>setAmountPaid(e.target.value)}
                className="border border-black p-2 rounded text-[10px] w-28"
                />
                <select
                value={paymentMethod}
                onChange={(e)=>setPaymentMethod(e.target.value)}
                className="border border-black p-2 rounded text-[10px]"
                >
                <option value="">Select payment</option>
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                </select>

                <button
                onClick={handlePay}
                className="bg-green-600 text-white px-5 py-2 rounded"
                >Record Payment</button>
            </>
            )}

            {remainingCreditable > 0 && (
              <button
                onClick={handleOpenCreditNoteModal}
                className="bg-red-700 text-white px-5 py-2 rounded"
              >Issue Credit Note</button>
            )}

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

          {/* ITEMS — Discount has its own column so the Total column stays
              a single clean number. The whole Discount column (colgroup
              entry, header, and each cell) is conditionally hidden — via
              print:hidden + capture-hide, driven by `hasDiscount` — in
              print/PDF/Share when no discount was applied to anything on
              the invoice; on screen it always stays visible, matching
              ServiceEstimateDetails's behaviour exactly (including after
              an estimate with no discount is converted into an invoice).
              Cells use align-middle so text sits centered in each row
              rather than crowding the bottom border once the PDF font is
              bumped up in the onclone override above. */}
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
              {invoice.items?.map(item=>{
                const discount = lineDiscount(item);
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
                  <td className={`p-1 border border-black text-right align-middle ${hasDiscount ? "" : "print:hidden capture-hide"}`}>
                    {item.customer_supplied ? "-" : (discount > 0 ? formatMoney(discount) : "-")}
                  </td>
                  <td className="p-1 border border-black align-middle text-right font-bold">
                    {item.customer_supplied ? "-" : formatMoney(item.total_price)}
                  </td>
                </tr>
              )})}

              {/* TOTALS ROW — always shown, lands in the same Qty / Price /
                  Discount / Total columns as the line items above, so the
                  invoice is self-explanatory on its own: Qty column sums
                  every line's quantity, Price column shows the pre-discount
                  items total, Discount column shows what was taken off
                  (hidden entirely in print/PDF/Share when nothing was
                  discounted, same as the estimate), and Total lands in the
                  same column as invoice.subtotal further down. */}
              <tr className="bg-gray-100 font-bold">
                <td className="p-1 border border-black text-right align-middle">Totals</td>
                <td className="p-1 border border-black text-center align-middle">{formatNumber(totalQty)}</td>
                <td className="p-1 border border-black text-right align-middle">{formatMoney(Number(invoice.subtotal) + totalDiscount)}</td>
                <td className={`p-1 border border-black text-right align-middle ${hasDiscount ? "" : "print:hidden capture-hide"}`}>
                  {formatMoney(totalDiscount)}
                </td>
                <td className="p-1 border border-black text-right align-middle">{formatMoney(invoice.subtotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* PAYMENT DETAILS + TOTALS */}
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
                      <td className="border border-black px-1 py-0.5 text-right align-middle">{formatMoney(Number(invoice.subtotal) + totalDiscount)}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-1 py-0.5 align-middle">Discount</td>
                      <td className="border border-black px-1 py-0.5 text-right align-middle">-{formatMoney(totalDiscount)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td className="border border-black px-1 py-0.5 align-middle">Sub Total</td>
                  <td className="border border-black px-1 py-0.5 text-right align-middle">{formatMoney(invoice.subtotal)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5 align-middle">Vat ({invoice.tax_rate}%)</td>
                  <td className="border border-black px-1 py-0.5 text-right align-middle">{formatMoney(invoice.tax_amount)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5 font-bold align-middle">Total Amount</td>
                  <td className="border border-black px-1 py-0.5 text-right font-bold align-middle">{formatMoney(invoice.total)}</td>
                </tr>
                {Number(invoice.amount_credited || 0) > 0 && (
                  <tr>
                    <td className="border border-black px-1 py-0.5 align-middle text-red-700">Credited</td>
                    <td className="border border-black px-1 py-0.5 text-right align-middle text-red-700">-{formatMoney(invoice.amount_credited)}</td>
                  </tr>
                )}
                {Number(invoice.amount_paid || 0) > 0 && (
                  <tr>
                    <td className="border border-black px-1 py-0.5 align-middle">Amount Paid</td>
                    <td className="border border-black px-1 py-0.5 text-right align-middle">-{formatMoney(invoice.amount_paid)}</td>
                  </tr>
                )}
                {(Number(invoice.amount_paid || 0) > 0 || Number(invoice.amount_credited || 0) > 0) && (
                  <tr className="bg-gray-50">
                    <td className="border border-black px-1 py-0.5 font-bold align-middle">Balance Due</td>
                    <td className="border border-black px-1 py-0.5 text-right font-bold align-middle">
                      {formatMoney(
                        Number(invoice.total) - Number(invoice.amount_paid || 0) - Number(invoice.amount_credited || 0)
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          </div>

          {/* FOOTER */}
          <div className="doc-footer mt-3 text-center border-t pt-2 text-[9px] text-gray-600">
            <p className="font-semibold">THANK YOU FOR YOUR BUSINESS!</p>
            <p className="mt-0.5">Goods remain property of the company unless fully paid for.</p>
          </div>

          {/* PRINTED BY / PRINTED ON */}
          <div className="mt-1 flex justify-between text-[9px] text-gray-500">
            <p>Printed By: {user?.username || "N/A"}</p>
            <p>Printed On: {new Date().toLocaleString()}</p>
          </div>

          {/* MARKETING FOOTER — invoices only */}
          <div className="mt-2 pt-1 border-t border-dashed border-gray-400 text-center text-[8px] text-gray-500">
            <p>Invoicing powered by <span className="font-semibold">Comax Solutions</span></p>
          </div>

        </div>
        {/* END OUTER FRAME */}

        {/* BRAND LOGOS — outside the frame */}
        <div className="doc-logos flex justify-between items-center px-2 mt-3">
          <img src="/brands/nissan.png" alt="Nissan" className="h-16 object-contain" />
          <img src="/brands/ford.jpg" alt="Ford" className="h-16 object-contain" />
          <img src="/brands/subaru.jpg" alt="Subaru" className="h-16 object-contain" />
        </div>

        {showCreditNoteModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 print:hidden capture-hide">
            <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-xl max-h-[85vh] overflow-y-auto">

              <h2 className="text-xl font-bold mb-2">Issue Credit Note</h2>
              <p className="text-sm text-slate-500 mb-4">
                Select the line(s) needing a correction. Amount is the pre-VAT
                money to credit back. Qty only needs changing if the invoice
                recorded the wrong quantity — that alone doesn't move any money.
                For a returned part, tick "add back to stock" so it goes back
                into inventory.
              </p>

              <div className="space-y-3 mb-4">
                {invoice.items
                  ?.filter((item) => !item.customer_supplied && Number(item.total_price) > 0)
                  .map((item) => {
                    const checked = creditSelections[item.id] !== undefined;
                    const sel = creditSelections[item.id];
                    const isSparepart = item.item_type === "sparepart";
                    return (
                      <div key={item.id} className="border rounded-lg p-3">
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleCreditItem(item)}
                          />
                          <span className="text-sm font-medium">{item.description}</span>
                          <span className="text-xs text-slate-400 ml-auto">
                            Line total: KES {formatMoney(item.total_price)} &middot; Qty: {item.quantity}
                          </span>
                        </label>

                        {checked && (
                          <>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="text-xs text-slate-500">Amount to credit (KES)</label>
                                <input
                                  type="number"
                                  value={sel?.amount ?? ""}
                                  onChange={(e) => handleCreditAmountChange(item.id, e.target.value)}
                                  max={item.total_price}
                                  min={0}
                                  className="w-full border rounded-lg p-2 text-sm"
                                  placeholder="0"
                                />
                              </div>
                              <div className="w-24">
                                <label className="text-xs text-slate-500">Qty</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={sel?.quantity ?? ""}
                                  onChange={(e) => handleCreditQuantityChange(item.id, e.target.value)}
                                  min={0}
                                  className="w-full border rounded-lg p-2 text-sm"
                                  placeholder={item.quantity}
                                />
                              </div>
                            </div>

                            {isSparepart && (
                              <label className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={!!sel?.restock}
                                  onChange={() => handleToggleRestock(item)}
                                />
                                Customer returned this part in sellable condition — add back to stock
                              </label>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>

              <label className="text-sm">Reason</label>
              <textarea
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="e.g. Labour was overpriced, correcting to agreed rate"
                className="w-full border rounded-lg p-2 mb-4"
                rows={3}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreditNoteModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >Cancel</button>
                <button
                  onClick={handleSubmitCreditNote}
                  disabled={issuingCredit}
                  className="bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >{issuingCredit ? "Issuing..." : "Issue Credit Note"}</button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default ServiceInvoiceDetails;