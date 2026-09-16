// src/pages/spareparts/SupplierStatement.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSupplierStatement } from "../../api/supplierPaymentApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

// Same fixed-capture-width PDF pattern as PurchaseDetails.jsx / 
// ServiceEstimateDetails.jsx — keeps page count identical regardless of
// screen size/zoom, and avoids cutting a table row across a page break.
const PDF_CAPTURE_WIDTH_PX = 1100;

export default function SupplierStatement() {
  const { supplierId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [statement, setStatement] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId]);

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const res = await getSupplierStatement(supplierId, params);
      setStatement(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Could not load supplier statement");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    load({
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    });
  };

  const handleClearFilter = () => {
    setFromDate("");
    setToDate("");
    load();
  };

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

    const margin = 8;
    const usableWidth = pageWidthMM - margin * 2;

    const SCALE = 2;
    const pxPerMM = canvas.width / pageWidthMM;
    const pageHeightPx = pageHeightMM * pxPerMM;

    const rowBottoms = rowBoundaries.map((r) => r.bottom * SCALE).sort((a, b) => a - b);

    let currentY = 0;
    let pageIndex = 0;

    while (currentY < canvas.height - 1) {
      const idealEnd = Math.min(currentY + pageHeightPx, canvas.height);
      let sliceEnd = idealEnd;

      if (idealEnd < canvas.height) {
        const safeBreak = rowBottoms.filter((b) => b > currentY && b <= idealEnd).pop();
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
      link.download = `Statement-${statement.supplier.name.replace(/\s+/g, "_")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Could not generate PDF");
    }
  };

  if (loading) return <div className="p-6">Loading statement...</div>;
  if (!statement || !statement.supplier)
    return <div className="p-6">Supplier not found.</div>;

  const { supplier, opening_balance, closing_balance, transactions, from_date, to_date } = statement;

  return (
    <div className="print-container p-6 bg-gray-100 min-h-screen">
      {/* FILTER BAR — screen only */}
      <div className="max-w-5xl mx-auto mb-4 bg-white rounded-xl shadow p-4 flex flex-wrap items-end gap-3 print:hidden capture-hide">
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-600">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded text-sm"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-600">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded text-sm"
          />
        </div>
        <button onClick={handleFilter} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
          Apply
        </button>
        <button onClick={handleClearFilter} className="text-sm text-gray-500 underline px-2 py-2">
          Clear
        </button>

        <div className="flex-1" />

        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded border text-sm">
          Back
        </button>
        <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded text-sm">
          Print
        </button>
        <button onClick={handleDownloadPdf} className="bg-blue-800 text-white px-4 py-2 rounded text-sm">
          Download PDF
        </button>
      </div>

      <div
        ref={printRef}
        className="max-w-5xl mx-auto bg-white print-document border border-black p-2 text-[10px] leading-[13px]"
      >
        <div className="border-2 border-black p-3">
          {/* HEADER — same letterhead block as PurchaseDetails.jsx */}
          <div className="doc-header flex justify-center items-center gap-4 pb-2">
            <div className="flex items-center justify-end">
              <img src="/rmotologo.jpg" className="h-16 w-auto object-contain" alt="Rift Motors Limited" />
            </div>
            <div className="border-l-2 border-black self-stretch"></div>
            <div className="flex flex-col justify-center text-left text-[9px] leading-[14px] text-gray-700 space-y-0.5">
              <p>P.O. Box 18952 - 20100</p>
              <p>KFA - Show Ground Road, Nakuru</p>
              <p>+254 790 406 996</p>
              <p>info@riftmotors.com</p>
              <p className="font-bold text-black text-[12px]">PIN: PO51561799Q</p>
            </div>
          </div>

          <hr className="border-black border-t-2" />

          <div className="doc-title text-center py-1">
            <h2 className="text-sm font-extrabold tracking-[4px] uppercase text-gray-900">
              Supplier Statement
            </h2>
          </div>

          {/* SUPPLIER + PERIOD */}
          <div className="flex gap-2 mb-2">
            <table className="border border-black w-1/2 text-[10px] leading-[13px] align-top">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 font-bold bg-gray-50">Supplier</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 align-top h-16">
                    <p className="font-semibold">{supplier.name}</p>
                    {supplier.address && <p>{supplier.address}</p>}
                    {supplier.phone && <p>{supplier.phone}</p>}
                    {supplier.email && <p>{supplier.email}</p>}
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="border border-black w-1/2 text-[10px] leading-[13px] align-top">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 font-bold bg-gray-50">Statement Period</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 align-top h-16">
                    <p>From: {from_date ? formatDate(from_date) : "Account start"}</p>
                    <p>To: {to_date ? formatDate(to_date) : "Today"}</p>
                    <p className="mt-1 font-semibold">
                      Closing Balance: KES {formatMoney(closing_balance)}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* LEDGER */}
          <table className="w-full border border-black text-[10px] leading-normal mt-1">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[36%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-1 border border-black align-middle">Date</th>
                <th className="p-1 border border-black align-middle">Type</th>
                <th className="p-1 text-left border border-black align-middle">Reference</th>
                <th className="p-1 border border-black align-middle">Debit</th>
                <th className="p-1 border border-black align-middle">Credit</th>
                <th className="p-1 border border-black align-middle">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50 font-semibold">
                <td className="p-1 border border-black align-middle" colSpan={5}>
                  Opening Balance
                </td>
                <td className="p-1 border border-black text-right align-middle">
                  {formatMoney(opening_balance)}
                </td>
              </tr>

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 border border-black text-center text-gray-400">
                    No transactions in this period.
                  </td>
                </tr>
              )}

              {transactions.map((tx) => (
                <tr key={`${tx.type}-${tx.id}`}>
                  <td className="p-1 border border-black text-center align-middle">
                    {formatDate(tx.date)}
                  </td>
                  <td className="p-1 border border-black text-center align-middle capitalize">
                    {tx.type}
                  </td>
                  <td className="p-1 border border-black align-middle">
                    {tx.reference || (tx.type === "payment" ? `Payment #${tx.id}` : "-")}
                    {tx.detail && (
                      <span className="text-gray-500"> — {tx.detail.replace(/_/g, " ")}</span>
                    )}
                  </td>
                  <td className="p-1 border border-black text-right align-middle">
                    {tx.debit ? formatMoney(tx.debit) : ""}
                  </td>
                  <td className="p-1 border border-black text-right align-middle">
                    {tx.credit ? formatMoney(tx.credit) : ""}
                  </td>
                  <td className="p-1 border border-black text-right align-middle font-medium">
                    {formatMoney(tx.balance)}
                  </td>
                </tr>
              ))}

              <tr className="bg-gray-100 font-bold">
                <td className="p-1 border border-black align-middle" colSpan={5}>
                  Closing Balance
                </td>
                <td className="p-1 border border-black text-right align-middle">
                  {formatMoney(closing_balance)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-2 flex justify-between text-[9px] text-gray-500">
            <p>Printed By: {user?.username || "N/A"}</p>
            <p>Printed On: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}