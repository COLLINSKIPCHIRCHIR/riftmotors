import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Shows a value, or "N/A" when it's missing. Spare-parts sales don't link
// to a vehicle (walk-in customers may not have one on file), same as
// InvoiceDetails.jsx for spare parts.
const field = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

const money = (value) => {
  return Number(value || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 });
};

// --- Number-to-words helper, used for the "Fifty Thousand No Cents" line
// under the Amount field, matching the paper receipt format. ---
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numberToWords(num) {
  num = Math.floor(Number(num) || 0);
  if (num === 0) return "Zero";

  const chunk = (n) => {
    let str = "";
    if (n >= 100) {
      str += ONES[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += TENS[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 11) {
      str += ONES[n] + " ";
      n = 0;
    }
    if (n > 0 && n < 11) {
      str += ONES[n] + " ";
    }
    return str.trim();
  };

  const units = ["", "Thousand", "Million", "Billion"];
  let result = "";
  let unitIndex = 0;
  while (num > 0) {
    const rem = num % 1000;
    if (rem !== 0) {
      result = chunk(rem) + (units[unitIndex] ? " " + units[unitIndex] : "") + " " + result;
    }
    num = Math.floor(num / 1000);
    unitIndex++;
  }
  return result.trim();
}

const amountInWords = (total) => {
  const value = Number(total || 0);
  const whole = Math.floor(value);
  const cents = Math.round((value - whole) * 100);
  const wholeWords = numberToWords(whole);
  const centsPhrase = cents > 0 ? `And ${numberToWords(cents)} Cents` : "No Cents";
  return `${wholeWords} ${centsPhrase}`;
};

export default function ViewReceipt() {

  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [sale, setSale] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const loadReceipt = async () => {
      try {
        const res = await API.get(`/spare-sales/${id}/receipt`);
        setSale(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadReceipt();
  }, [id]);

  if (!sale)
    return <div className="p-6">Loading receipt...</div>;

  // Renders the printable area into a PDF and returns it as a Blob.
  const generatePdfBlob = async () => {
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
    return pdf.output("blob");
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipt-${sale.receipt_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not generate PDF");
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generatePdfBlob();
      const file = new File([blob], `Receipt-${sale.receipt_number}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Receipt ${sale.receipt_number}`,
          text: `Receipt ${sale.receipt_number} from Rift Motors`,
        });
      } else {
        const text = encodeURIComponent(
          `Receipt ${sale.receipt_number} from Rift Motors - total KES ${money(sale.total)}. PDF attached separately.`
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen print-container">
      <div ref={printRef} className="max-w-5xl mx-auto bg-white print-document border border-black p-3 text-[10px] leading-[13px]">

        {/* OUTER FRAME */}
        <div className="border-2 border-black p-3">

          {/* HEADER — same as invoices/estimates */}
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
            </div>

          </div>

          <hr className="border-black border-t-2" />

          {/* TITLE BANNER — like the "Payment Receipt" bar in the paper receipt */}
          <div className="text-center bg-gray-100 border border-black py-1 mt-2">
            <h2 className="text-sm font-extrabold tracking-[4px] uppercase text-gray-900">
              Payment Receipt
            </h2>
          </div>

          {/* DATE / REF — small table, right aligned like the paper receipt */}
          <div className="flex justify-end mt-2">
            <table className="text-[10px] border border-black">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-0.5 font-bold">Date</td>
                  <td className="border border-black px-2 py-0.5">{new Date(sale.sale_date).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-0.5 font-bold">Ref</td>
                  <td className="border border-black px-2 py-0.5">{field(sale.receipt_number)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* NAME */}
          <div className="flex items-center mt-4 text-[11px]">
            <span className="font-bold w-24">Name:</span>
            <span className="flex-1 border-b border-black pb-0.5">{field(sale.customer_name)}</span>
          </div>

          {/* AMOUNT + PAID IN */}
          <div className="flex items-end gap-6 mt-3 text-[11px]">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold w-24">Amount:</span>
                <span className="flex-1 border-b border-black text-center pb-0.5">{money(sale.total)}</span>
              </div>
              <p className="text-[9px] italic mt-0.5 ml-24">{amountInWords(sale.total)}</p>
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="font-bold">Paid in:</span>
              <span className="uppercase">{field(sale.payment_method)}</span>
            </div>
          </div>

          {/* FOR */}
          <div className="flex items-start mt-4 gap-2 text-[10px]">
            <span className="font-bold w-24 pt-1">For:</span>
            <div className="flex-1 border border-black p-2 min-h-[45px]">
              {field(sale.invoice_number)}: PAID
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 my-3 print:hidden flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-600 text-white px-5 py-2 rounded"
            >Back</button>
            <button
              onClick={() => window.print()}
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

          {/* ACCOUNT BALANCE + TRANSACTION BY */}
          <div className="flex justify-between items-start mt-2 text-[10px]">

            <table className="border border-black w-64">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-0.5">Account balance</td>
                  <td className="border border-black px-2 py-0.5 text-right">{money(sale.account_balance_before)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-0.5">This payment</td>
                  <td className="border border-black px-2 py-0.5 text-right">{money(sale.total)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-0.5 font-bold">Account balance</td>
                  <td className="border border-black px-2 py-0.5 text-right font-bold">{money(sale.account_balance_after)}</td>
                </tr>
              </tbody>
            </table>

            <p className="pt-1"><span className="font-bold">Transaction By:</span> {user?.username || "N/A"}</p>

          </div>

          {/* FOOTER — Printed By / Printed On, positioned bottom-left/bottom-right like the paper receipt */}
          <div className="flex justify-between mt-10 text-[9px] text-gray-600">
            <p>Printed By: {user?.username || "N/A"}</p>
            <p>Printed On: {new Date().toLocaleString()}</p>
          </div>

        </div>
        {/* END OUTER FRAME */}


      </div>
    </div>
  );
}