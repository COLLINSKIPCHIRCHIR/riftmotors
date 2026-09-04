import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getCustomerStatement } from "../../api/CustomerApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const field = (value) => (value === null || value === undefined || value === "" ? "N/A" : value);

const AGING_LABELS = [
  { key: "current", label: "Current" },
  { key: "d1_30", label: "1-30 Days Past Due" },
  { key: "d31_60", label: "31-60 Days Past Due" },
  { key: "d61_90", label: "61-90 Days Past Due" },
  { key: "over90", label: "Over 90 Days Past Due" },
];

const TRANSACTION_LABEL = {
  invoice: (row) => `INV #${row.reference}`,
  payment: () => "PMT",
  credit_note: (row) => `CREDNOTE #${row.reference}`,
};

const StatementView = () => {
  const { id } = useParams();

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null); // { customer, service, spareparts }
  const [activeType, setActiveType] = useState("service");
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchStatement = async () => {
    setLoading(true);
    try {
      const res = await getCustomerStatement(id, from, to, "both");
      setData(res.data);
      // Default to whichever ledger actually has activity
      if (res.data.service?.rows?.length) setActiveType("service");
      else if (res.data.spareparts?.rows?.length) setActiveType("spareparts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const ledger = data?.[activeType];
  const hasService = !!data?.service;
  const hasSpareparts = !!data?.spareparts;

  /* ============ PDF (same multi-page capture pattern as ServiceInvoiceDetails) ============ */
  const PDF_CAPTURE_WIDTH_PX = 1100;

  const generatePdfBlob = async () => {
    const rowBoundaries = [];
    if (document.fonts?.ready) await document.fonts.ready;

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: PDF_CAPTURE_WIDTH_PX,
      windowHeight: printRef.current.scrollHeight,
      onclone: (clonedDoc) => {
        const container = clonedDoc.querySelector(".print-document");
        if (container) {
          container.style.width = `${PDF_CAPTURE_WIDTH_PX}px`;
          container.style.maxWidth = `${PDF_CAPTURE_WIDTH_PX}px`;
          container.style.margin = "0";
        }
        clonedDoc.querySelectorAll(".capture-hide").forEach((el) => (el.style.display = "none"));
        clonedDoc.querySelectorAll("table td, table th").forEach((el) => {
          el.style.verticalAlign = "middle";
          el.style.lineHeight = "1.6";
        });
        clonedDoc.querySelectorAll("table").forEach((el) => (el.style.borderCollapse = "collapse"));
        clonedDoc
          .querySelectorAll("table, table td, table th, table tr")
          .forEach((el) => (el.style.borderColor = "#555555"));

        if (container) {
          const containerTop = container.getBoundingClientRect().top;
          container.querySelectorAll("tr").forEach((tr) => {
            const r = tr.getBoundingClientRect();
            rowBoundaries.push({ top: r.top - containerTop, bottom: r.bottom - containerTop });
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
    const blob = await generatePdfBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Statement-${data.customer.name}-${activeType}-${to}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const blob = await generatePdfBlob();
    const file = new File([blob], `Statement-${data.customer.name}.pdf`, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Statement of Account" });
    } else {
      alert("Your browser can't attach the PDF directly — use Download instead.");
    }
  };

  if (!data) return <div className="p-6">{loading ? "Loading statement..." : "No data"}</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen print-container">
      {/* CONTROLS — on-screen only */}
      <div className="max-w-5xl mx-auto mb-4 flex flex-wrap items-end gap-3 print:hidden capture-hide">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm" />
        </div>
        <button onClick={fetchStatement} disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-60">
          {loading ? "Loading..." : "Generate"}
        </button>

        {hasService && hasSpareparts && (
          <div className="flex rounded-xl overflow-hidden border border-slate-200 ml-2">
            <button onClick={() => setActiveType("service")}
              className={`px-4 py-2 text-sm ${activeType === "service" ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>
              Service
            </button>
            <button onClick={() => setActiveType("spareparts")}
              className={`px-4 py-2 text-sm ${activeType === "spareparts" ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>
              Spare Parts
            </button>
          </div>
        )}

        <div className="ml-auto flex gap-2">
          <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">Print</button>
          <button onClick={handleDownloadPdf} className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm">Download PDF</button>
          <button onClick={handleShare} className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm">Share</button>
        </div>
      </div>

      {!ledger ? (
        <p className="max-w-5xl mx-auto text-sm text-slate-500">
          No {activeType === "service" ? "service" : "spare parts"} activity for this customer.
        </p>
      ) : (
        <div ref={printRef} className="max-w-5xl mx-auto bg-white print-document border border-black p-3 text-[10px] leading-[13px]">
          <div className="border-2 border-black p-3">

            {/* HEADER — same brand block as your invoices */}
            <div className="doc-header flex justify-between items-start gap-4 pb-2">
              <div className="flex items-center gap-3">
                <img src="/rmotologo.jpg" className="h-16 w-auto object-contain" alt="Rift Motors Limited" />
                <div className="text-[9px] leading-[14px] text-gray-700">
                  <p className="font-bold text-black text-[12px]">
                    RIFT MOTORS LIMITED{activeType === "service" ? " - SERVICE" : ""}
                  </p>
                  <p>P.O. Box 18952 - 20100, Nakuru</p>
                  <p>+254 790 406 996 &middot; info@riftmotors.com</p>
                  <p className="font-bold">PIN: PO51561799Q</p>
                </div>
              </div>
              <div className="text-right text-[9px]">
                <h2 className="text-lg font-extrabold tracking-[2px] uppercase">Statement</h2>
                <p className="mt-1">Date: {new Date().toLocaleDateString()}</p>
                <p>Period: {from} to {to}</p>
              </div>
            </div>

            <hr className="border-black border-t-2" />

            {/* TO + AMOUNT DUE */}
            <div className="flex justify-between mt-2 gap-4">
              <table className="border border-black w-[55%]">
                <tbody>
                  <tr><td className="border border-black px-2 py-1 font-bold">To:</td></tr>
                  <tr><td className="border border-black px-2 py-3">{field(data.customer.name)}</td></tr>
                  <tr><td className="border border-black px-2 py-1">{field(data.customer.phone)}</td></tr>
                  <tr><td className="border border-black px-2 py-1">{field(data.customer.address)}</td></tr>
                </tbody>
              </table>
              <table className="border border-black w-[35%] h-fit">
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold" colSpan={2}>Amount Due</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-2 text-right font-bold text-[14px]" colSpan={2}>
                      KES {formatMoney(ledger.closing_balance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* LEDGER */}
            <table className="w-full border border-black text-[10px] leading-normal mt-2">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[45%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-1 border border-black text-left">Date</th>
                  <th className="p-1 border border-black text-left">Transaction</th>
                  <th className="p-1 border border-black text-right">Amount</th>
                  <th className="p-1 border border-black text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50">
                  <td className="p-1 border border-black">{from}</td>
                  <td className="p-1 border border-black italic">Balance forward</td>
                  <td className="p-1 border border-black text-right"></td>
                  <td className="p-1 border border-black text-right font-bold">
                    {formatMoney(ledger.opening_balance)}
                  </td>
                </tr>
                {ledger.rows.map((row, i) => (
                  <tr key={i}>
                    <td className="p-1 border border-black">{row.date}</td>
                    <td className="p-1 border border-black">
                      {TRANSACTION_LABEL[row.type](row)}{row.type === "invoice" ? `. ${row.description}` : ""}
                    </td>
                    <td className="p-1 border border-black text-right">
                      {row.amount >= 0 ? formatMoney(row.amount) : `(${formatMoney(Math.abs(row.amount))})`}
                    </td>
                    <td className="p-1 border border-black text-right font-bold">{formatMoney(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* AGING SUMMARY */}
            <table className="w-full border border-black text-[10px] leading-normal mt-2">
              <thead className="bg-gray-100">
                <tr>
                  {AGING_LABELS.map((b) => (
                    <th key={b.key} className="p-1 border border-black text-center">{b.label}</th>
                  ))}
                  <th className="p-1 border border-black text-center">Amount Due</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {AGING_LABELS.map((b) => (
                    <td key={b.key} className="p-1 border border-black text-center">
                      {formatMoney(ledger.aging[b.key])}
                    </td>
                  ))}
                  <td className="p-1 border border-black text-center font-bold">
                    KES {formatMoney(ledger.total_due)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-1 flex justify-between text-[9px] text-gray-500">
              <p>Printed By: {user?.username || "N/A"}</p>
              <p>Printed On: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatementView;