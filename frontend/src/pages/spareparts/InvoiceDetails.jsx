import React,{useEffect,useState,useRef} from "react";
import {useParams,useNavigate} from "react-router-dom";
import API from "../../api/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Shows a value, or "N/A" when it's missing. Spare-parts invoices don't
// link to a vehicle (walk-in customers may not have one on file), so
// Reg No / Model / VIN / Engine / Mileage will always show N/A here -
// that's expected, not a bug.
const field = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Same pattern used elsewhere in the app for "Served By"/"Printed By"
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await API.get(`/spare-invoices/${id}`);
        setInvoice(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const payInvoice = async () => {
    if (!window.confirm(`Pay using ${paymentMethod}?`)) return;

    try {
      await API.post(`/spare-invoices/${id}/pay`, {
        payment_method: paymentMethod,
      });

      alert("✅ Invoice paid. Receipt created.");
      navigate("/admin/spare-parts/receipts");
    } catch (err) {
      alert("Payment failed");
    }
  };

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
      link.download = `Invoice-${invoice.invoice_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not generate PDF");
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generatePdfBlob();
      const file = new File([blob], `Invoice-${invoice.invoice_number}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoice.invoice_number}`,
          text: `Invoice ${invoice.invoice_number} from Rift Motors`,
        });
      } else {
        const text = encodeURIComponent(
          `Invoice ${invoice.invoice_number} from Rift Motors - total KES ${Number(invoice.total).toFixed(2)}. PDF attached separately.`
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (!invoice) return <div className="p-6">Invoice not found</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen print-container">
      <div ref={printRef} className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl p-10 print-document border">

        {/* HEADER */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6">

          <div className="flex items-center">
            <img
              src="/rmotologo.jpg"
              className="w-56 h-40 object-contain"
              alt="Rift Motors Limited"
            />
          </div>

          <div className="text-right text-sm text-gray-600 leading-6">
            <p>P.O. Box 18952 - 20100</p>
            <p>KFA - Show Ground Road, Nakuru</p>
            <p>+254 712 345 678</p>
            <p>info@riftmotors.com</p>
          </div>

        </div>

        {/* TITLE */}
        <div className="text-center border-b py-3 mt-4">
          <h2 className="text-2xl font-bold tracking-widest text-gray-800">INVOICE</h2>
        </div>

        {/* REF / CUSTOMER / DATE / KRA */}
        <div className="grid grid-cols-2 gap-6 mt-6 text-sm">

          <div className="space-y-1">
            <p><span className="font-bold">REF:</span> {field(invoice.invoice_number)}</p>
            <p><span className="font-bold">Bill To:</span> {field(invoice.customer_name)}</p>
            <p><span className="font-bold">Address:</span> {field(invoice.customer_address)}</p>
            <p><span className="font-bold">Mobile:</span> {field(invoice.customer_phone)}</p>
          </div>

          <div className="space-y-1 text-right">
            <p><span className="font-bold">Date:</span> {new Date(invoice.created_at).toLocaleDateString()}</p>
            <p><span className="font-bold">KRA Pin:</span> {field(invoice.customer_kra_pin)}</p>
            <p>
              <span className="font-bold">Status:</span>{" "}
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                {invoice.status}
              </span>
            </p>
          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 my-6 print:hidden flex-wrap">

          {invoice.status !== "paid" && (
            <>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="border px-2 py-2 rounded"
              >
                <option value="cash">Cash</option>
                <option value="mpesa">Mpesa</option>
                <option value="card">Card</option>
              </select>

              <button
                onClick={payInvoice}
                className="bg-green-600 text-white px-5 py-2 rounded"
              >Pay Invoice</button>
            </>
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

        {/* ITEMS */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left border">Code</th>
              <th className="p-3 text-left border">Description</th>
              <th className="p-2 border">Qty</th>
              <th className="p-2 border">Unit Price</th>
              <th className="p-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item,index)=>(
              <tr key={item.id || index} className="border-t">
                <td className="p-3 border">{field(item.part_number)}</td>
                <td className="p-3 border">{item.name}</td>
                <td className="p-2 border text-center">{item.quantity}</td>
                <td className="p-2 border text-right">KES {Number(item.unit_price).toFixed(2)}</td>
                <td className="p-2 border text-right font-bold">KES {Number(item.total_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAYMENT DETAILS + TOTALS */}
        <div className="flex justify-between mt-8 gap-8">

          <div className="text-sm text-gray-700 leading-6 border rounded p-4 w-80">
            <p className="font-bold mb-1">Payment To:</p>
            <p>NCBA Bank, Nakuru Branch</p>
            <p>A/C Name: Rift Motors Ltd</p>
            <p>A/C No: 3364820034, or through</p>
            <p>Mpesa Paybill No: 532602</p>
            <p>A/C No: RIFT MOTORS</p>
          </div>

          <div className="w-72">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <b>KES {Number(invoice.subtotal).toFixed(2)}</b>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <b>KES {Number(invoice.discount).toFixed(2)}</b>
            </div>
            <div className="flex justify-between">
              <span>VAT ({invoice.tax_rate}%)</span>
              <b>KES {Number(invoice.tax_amount).toFixed(2)}</b>
            </div>
            <hr className="my-3"/>
            <div className="flex justify-between text-xl font-bold">
              <span>TOTAL</span>
              <span>KES {Number(invoice.total).toFixed(2)}</span>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="mt-10 text-center border-t pt-4 text-sm text-gray-600">
          <p className="font-semibold">THANK YOU FOR YOUR BUSINESS!</p>
          <p className="mt-2">Goods remain property of the company unless fully paid for.</p>
        </div>

        {/* PRINTED BY */}
        <p className="mt-4 text-xs text-gray-500">Printed By: {user?.username || "N/A"}</p>

        {/* BRAND LOGOS - replace src with your own local assets */}
        <div className="flex justify-center items-center gap-10 mt-6 opacity-80">
          <img src="/brands/nissan.png" alt="Nissan" className="h-10 object-contain" />
          <img src="/brands/ford.jpg" alt="Ford" className="h-10 object-contain" />
          <img src="/brands/subaru.jpg" alt="Subaru" className="h-10 object-contain" />
        </div>

      </div>
    </div>
  );
}