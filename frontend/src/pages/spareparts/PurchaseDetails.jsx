import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPurchase, sendPurchase, cancelPurchase } from "../../api/purchaseApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const field = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const STATUS_LABELS = {
  draft: "Draft",
  sent: "Sent",
  partially_received: "Partially Received",
  received: "Received",
  cancelled: "Cancelled",
};

// Same fixed-width capture pattern as ServiceEstimateDetails.jsx — see the
// comments on generatePdfBlob there for why this exists (keeps PDF page
// count identical across machines/zoom levels/window widths).
const PDF_CAPTURE_WIDTH_PX = 1100;

const PurchaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const printRef = useRef();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const res = await getPurchase(id);
      setData(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  if (!data || !data.purchase) return <div className="p-6">Loading LPO...</div>;

  const { purchase, items, receipts } = data;

  const handleSend = async () => {
    if (!window.confirm("Send this LPO to the supplier? It can't be edited after this.")) return;
    try {
      await sendPurchase(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send LPO");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this LPO?")) return;
    try {
      await cancelPurchase(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel LPO");
    }
  };

  // Identical rendering/pagination approach to generatePdfBlob in
  // ServiceEstimateDetails.jsx — see that file for the detailed reasoning
  // behind each onclone step (fixed capture width, stripped capture-hide
  // elements, forced cell alignment, print-matched font sizes, row-safe
  // page breaks). Kept in sync structurally so every document in the app
  // exports the same way.
  const generatePdfBlob = async () => {
    const rowBoundaries = [];

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: PDF_CAPTURE_WIDTH_PX,
      windowHeight: printRef.current.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedContainer = clonedDoc.querySelector(".print-document");
        if (clonedContainer) {
          clonedContainer.style.width = `${PDF_CAPTURE_WIDTH_PX}px`;
          clonedContainer.style.maxWidth = `${PDF_CAPTURE_WIDTH_PX}px`;
          clonedContainer.style.margin = "0";
        }

        clonedDoc.querySelectorAll(".capture-hide").forEach((el) => {
          el.style.display = "none";
        });

        clonedDoc.querySelectorAll("table td, table th").forEach((el) => {
          el.style.verticalAlign = "middle";
          el.style.lineHeight = "1.6";
        });

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
          el.style.paddingTop = "10px";
          el.style.paddingBottom = "10px";
        });
        clonedDoc.querySelectorAll(".doc-title h2").forEach((el) => {
          el.style.fontSize = "28px";
          el.style.fontWeight = "800";
          el.style.letterSpacing = "4px";
          el.style.color = "#000";
          el.style.lineHeight = "1.4";
          el.style.margin = "0";
        });

        clonedDoc.querySelectorAll("table").forEach((el) => {
          el.style.borderCollapse = "collapse";
        });
        clonedDoc
          .querySelectorAll("table, table td, table th, table tr")
          .forEach((el) => {
            el.style.borderColor = "#555555";
          });

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

    const margin = 6;
    const usableWidth = pageWidthMM - margin * 2;

    const SCALE = 2;
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
        .drawImage(canvas, 0, currentY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      const imgData = sliceCanvas.toDataURL("image/png");
      const imgHeightMM = (sliceHeight * usableWidth) / canvas.width;

      if (pageIndex > 0) pdf.addPage();

      pdf.addImage(imgData, "PNG", margin, margin, usableWidth, imgHeightMM);

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
      link.download = `${purchase.lpo_number || `PO-${purchase.id}`}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not generate PDF");
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generatePdfBlob();
      const fileName = `${purchase.lpo_number || `PO-${purchase.id}`}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: purchase.lpo_number || `Purchase Order ${purchase.id}`,
          text: `Purchase Order ${purchase.lpo_number || purchase.id} from Rift Motors`,
        });
      } else {
        const text = encodeURIComponent(
          `Purchase Order ${purchase.lpo_number || purchase.id} from Rift Motors - total KES ${formatMoney(
            purchase.total
          )}. PDF attached separately.`
        );
        if (
          window.confirm(
            "Your browser can't attach the PDF directly. Download it now, then open WhatsApp to send it manually?"
          )
        ) {
          await handleDownloadPdf();
          window.open(`https://wa.me/?text=${text}`, "_blank");
        }
      }
    } catch (err) {
      alert("Sharing failed");
    }
  };

  const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <div className="print-container p-6 bg-gray-100 min-h-screen">
      <div ref={printRef} className="max-w-5xl mx-auto bg-white print-document border border-black p-2 text-[10px] leading-[13px]">

        {/* OUTER FRAME */}
        <div className="border-2 border-black p-3">

          {/* HEADER — identical block to ServiceEstimateDetails.jsx so every
              printed document in the app carries the same letterhead. */}
          <div className="doc-header flex justify-center items-center gap-4 pb-2">
            <div className="flex items-center justify-end">
              <img
                src="/rmotologo.jpg"
                className="h-16 w-auto object-contain"
                alt="Rift Motors Limited"
              />
            </div>

            <div className="border-l-2 border-black self-stretch"></div>

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
              <p className="font-bold text-black text-[12px]">PIN: PO51561799Q</p>
            </div>
          </div>

          <hr className="border-black border-t-2" />

          {/* TITLE */}
          <div className="doc-title text-center py-1">
            <h2 className="text-sm font-extrabold tracking-[4px] uppercase text-gray-900">
              Purchase Order
            </h2>
          </div>

          {/* TAX DATE / P.O. NO */}
          <table className="border border-black text-[10px] leading-[13px] mb-2">
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 font-bold bg-gray-50 align-middle">Tax Date</td>
                <td className="border border-black px-2 py-1 font-bold bg-gray-50 align-middle">P.O. No.</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 align-middle">
                  {purchase.order_date
                    ? new Date(purchase.order_date).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })
                    : "N/A"}
                </td>
                <td className="border border-black px-2 py-1 align-middle">
                  {purchase.lpo_number || `PO-${purchase.id}`}
                </td>
              </tr>
            </tbody>
          </table>

          {/* SUPPLIER / SHIP TO */}
          <div className="flex gap-2 mb-2">
            <table className="border border-black w-1/2 text-[10px] leading-[13px] align-top">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 font-bold bg-gray-50">Supplier</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 align-top h-20">
                    <p className="font-semibold">{field(purchase.supplier_name)}</p>
                    {purchase.supplier_address && <p>{purchase.supplier_address}</p>}
                    {purchase.supplier_phone && <p>{purchase.supplier_phone}</p>}
                    {purchase.supplier_email && <p>{purchase.supplier_email}</p>}
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="border border-black w-1/2 text-[10px] leading-[13px] align-top">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 font-bold bg-gray-50">Ship To</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 align-top h-20">
                    <p className="font-semibold">RIFT MOTORS LTD,</p>
                    <p>P.O. BOX 18952-20100,</p>
                    <p>NAKURU.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* OTHER1 / TERMS / EXPECTED / SHIP VIA */}
          <table className="w-full border border-black text-[10px] leading-[13px] mb-2">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black px-2 py-1">Other</th>
                <th className="border border-black px-2 py-1">Terms</th>
                <th className="border border-black px-2 py-1">Expected</th>
                <th className="border border-black px-2 py-1">Ship Via</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 align-middle">&nbsp;</td>
                <td className="border border-black px-2 py-1 align-middle">&nbsp;</td>
                <td className="border border-black px-2 py-1 align-middle">
                  {purchase.expected_delivery_date
                    ? new Date(purchase.expected_delivery_date).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })
                    : "N/A"}
                </td>
                <td className="border border-black px-2 py-1 align-middle">&nbsp;</td>
              </tr>
            </tbody>
          </table>

          {/* ACTIONS — on-screen only, same print:hidden + capture-hide
              pairing as ServiceEstimateDetails.jsx keeps these out of both
              native Print and the PDF/Share capture. */}
          <div className="flex justify-between items-center my-3 print:hidden capture-hide">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 capitalize">
              {STATUS_LABELS[purchase.status] || purchase.status}
            </span>
            <div className="flex gap-2 flex-wrap justify-end">
              {purchase.status === "draft" && (
                <button onClick={handleSend} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
                  Send to Supplier
                </button>
              )}
              {(purchase.status === "sent" || purchase.status === "partially_received") && (
                <button
                  onClick={() => navigate(`/admin/spare-parts/purchases/${id}/receive`)}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm"
                >
                  Receive Goods
                </button>
              )}
              {["draft", "sent"].includes(purchase.status) && (
                <button onClick={handleCancel} className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm">
                  Cancel LPO
                </button>
              )}
              <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded text-sm">
                Print
              </button>
              <button onClick={handleDownloadPdf} className="bg-blue-800 text-white px-4 py-2 rounded text-sm">
                Download PDF
              </button>
              <button onClick={handleShare} className="bg-emerald-700 text-white px-4 py-2 rounded text-sm">
                Share
              </button>
            </div>
          </div>

          {/* ITEMS — Description / Qty / Rate / VAT / Amount, matching the
              paper LPO layout. VAT column shows the tax class letter, not
              a computed value — there's no per-line tax breakdown in the
              schema, only header-level subtotal/total. */}
          <table className="w-full border border-black text-[10px] leading-normal mt-1">
            <colgroup>
              <col className="w-[44%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-1 text-left border border-black align-middle">Description</th>
                <th className="p-1 border border-black align-middle">Qty</th>
                <th className="p-1 border border-black align-middle">Rate</th>
                <th className="p-1 border border-black align-middle">VAT</th>
                <th className="p-1 border border-black align-middle">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="p-1 border border-black align-middle">{item.sparepart_name}</td>
                  <td className="p-1 border border-black text-center align-middle">{item.quantity}</td>
                  <td className="p-1 border border-black text-right align-middle">{formatMoney(item.unit_cost)}</td>
                  <td className="p-1 border border-black text-center align-middle">R</td>
                  <td className="p-1 border border-black text-right align-middle">{formatMoney(item.total_cost)}</td>
                </tr>
              ))}

              <tr className="bg-gray-100 font-bold">
                <td className="p-1 border border-black text-right align-middle">Totals</td>
                <td className="p-1 border border-black text-center align-middle">{totalQty}</td>
                <td className="p-1 border border-black align-middle"></td>
                <td className="p-1 border border-black align-middle"></td>
                <td className="p-1 border border-black text-right align-middle">{formatMoney(purchase.subtotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* NOTES + TOTALS BOX — mirrors the paper layout's VAT Summary /
              Subtotal-VAT-Total pairing. No per-rate VAT breakdown is
              tracked yet, so the left box carries the LPO notes instead;
              the right box shows the same Subtotal/Total the header
              already stores. */}
          <div className="flex justify-between mt-2 gap-4 text-[10px] leading-[13px]">
            <table className="border border-black w-[55%]">
              <tbody>
                <tr>
                  <td className="border border-black px-1 py-0.5 font-bold align-middle">Notes</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-1 align-top h-16">{purchase.notes || "-"}</td>
                </tr>
              </tbody>
            </table>

            <table className="border border-black w-[40%] h-fit">
              <tbody>
                <tr>
                  <td className="border border-black px-1 py-0.5 align-middle">Subtotal</td>
                  <td className="border border-black px-1 py-0.5 text-right align-middle">{formatMoney(purchase.subtotal)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5 align-middle">VAT Total</td>
                  <td className="border border-black px-1 py-0.5 text-right align-middle">0.00</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5 font-bold align-middle">Total</td>
                  <td className="border border-black px-1 py-0.5 text-right font-bold align-middle">{formatMoney(purchase.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* COMPANY VAT NUMBER */}
          <table className="border border-black text-[10px] leading-[13px] mt-2">
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 font-bold bg-gray-50">Company VAT Number</td>
                <td className="border border-black px-2 py-1">PO51561799Q</td>
              </tr>
            </tbody>
          </table>

          {/* PRINTED BY / PRINTED ON */}
          <div className="mt-2 flex justify-between text-[9px] text-gray-500">
            <p>Printed By: {user?.username || "N/A"}</p>
            <p>Printed On: {new Date().toLocaleString()}</p>
          </div>
        </div>
        {/* END OUTER FRAME */}

        {/* BRAND LOGOS — outside the frame, same as ServiceEstimateDetails.jsx */}
       {/* <div className="doc-logos flex justify-between items-center px-2 mt-3">
          <img src="/brands/nissan.png" alt="Nissan" className="h-16 object-contain" />
          <img src="/brands/ford.jpg" alt="Ford" className="h-16 object-contain" />
          <img src="/brands/subaru.jpg" alt="Subaru" className="h-16 object-contain" />
        </div>*/}
      </div>

      {/* DELIVERY (GRN) HISTORY — reference only, not part of the printed
          document itself; a fresh LPO print should always look like a
          clean purchase order, not a running log. */}
      {receipts.length > 0 && (
        <div className="max-w-5xl mx-auto mt-4 bg-white rounded-xl shadow p-6 print:hidden">
          <h2 className="text-lg font-semibold mb-4">Delivery History</h2>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">GRN No.</th>
                <th className="p-2 border text-left">Date</th>
                <th className="p-2 border text-left">Received By</th>
                <th className="p-2 border text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td className="border p-2">{r.grn_number}</td>
                  <td className="border p-2">{new Date(r.received_date).toLocaleDateString()}</td>
                  <td className="border p-2">{r.received_by_name || "-"}</td>
                  <td className="border p-2">{r.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PurchaseDetails;