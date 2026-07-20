import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getServiceReceipt } from "../../api/serviceApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Shows a value, or "N/A" when it's missing (e.g. no vehicle linked to
// the job, or the customer has no KRA pin on file yet).
const field = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

const money = (value) => {
  return Number(value || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 });
};

const ServiceReceiptDetails = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const printRef = useRef();

  // Same pattern used in InvoiceDetails.jsx for "Served By"/"Printed By"
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getServiceReceipt(id);
        setReceipt(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    load();
  }, [id]);

  if (!receipt)
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
      link.download = `ServiceReceipt-${receipt.receipt_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not generate PDF");
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generatePdfBlob();
      const file = new File([blob], `ServiceReceipt-${receipt.receipt_number}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Service Receipt ${receipt.receipt_number}`,
          text: `Service Receipt ${receipt.receipt_number} from Rift Motors`,
        });
      } else {
        const text = encodeURIComponent(
          `Service Receipt ${receipt.receipt_number} from Rift Motors - total KES ${money(receipt.total)}. PDF attached separately.`
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
      <div ref={printRef} className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-10 print-document border">

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
          <h2 className="text-2xl font-bold tracking-widest text-gray-800">SERVICE RECEIPT</h2>
        </div>

        {/* CUSTOMER / VEHICLE / DATE */}
        <div className="grid grid-cols-2 gap-6 mt-6 text-sm">

          <div className="space-y-1">
            <p><span className="font-bold">REF:</span> {field(receipt.receipt_number)}</p>
            <p><span className="font-bold">Received From:</span> {field(receipt.customer_name)}</p>
            <p><span className="font-bold">Address:</span> {field(receipt.customer_address)}</p>
            <p><span className="font-bold">Mobile:</span> {field(receipt.customer_phone)}</p>
            <p><span className="font-bold">KRA Pin:</span> {field(receipt.customer_kra_pin)}</p>
          </div>

          <div className="space-y-1 text-right">
            <p><span className="font-bold">Date:</span> {new Date(receipt.created_at).toLocaleDateString()}</p>
            <p><span className="font-bold">Reg No:</span> {field(receipt.registration_number)}</p>
            <p><span className="font-bold">Model:</span> {field(receipt.vehicle_make)} {field(receipt.vehicle_model)}</p>
            <p><span className="font-bold">VIN No:</span> {field(receipt.vin_no)}</p>
            <p><span className="font-bold">Engine:</span> {field(receipt.engine_number)}</p>
            <p><span className="font-bold">Mileage:</span> {field(receipt.mileage)}</p>
            <p>
              <span className="font-bold">Payment:</span>{" "}
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full capitalize">
                {receipt.payment_method}
              </span>
            </p>
          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 my-6 print:hidden flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 text-white px-5 py-2 rounded-lg"
          >Back</button>
          <button
            onClick={() => window.print()}
            className="bg-gray-800 text-white px-5 py-2 rounded-lg"
          >Print</button>
          <button
            onClick={handleDownloadPdf}
            className="bg-blue-800 text-white px-5 py-2 rounded-lg"
          >Download PDF</button>
          <button
            onClick={handleShare}
            className="bg-emerald-700 text-white px-5 py-2 rounded-lg"
          >Share</button>
        </div>

        {/* ITEMS */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left border">Description</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Qty</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items?.map(item => (
              <tr key={item.id} className="border-t">
                <td className="p-3 border">{item.description}</td>
                <td className="p-2 border">{item.item_type}</td>
                <td className="p-2 border text-center">{item.quantity}</td>
                <td className="p-2 border text-right">KES {money(item.unit_price)}</td>
                <td className="p-3 border">

                  <div className="text-sm text-gray-500">
                    Original: KES {money(item.original_price)}
                  </div>

                  {item.item_type === "service" && item.adjustment > 0 && (
                    <div className="text-sm text-green-600">
                      Reduction: KES {money(item.adjustment)}
                    </div>
                  )}

                  {item.item_type === "sparepart" && item.discount_value > 0 && (
                    <div className="text-sm text-green-600">
                      Discount: {item.discount_type === "percentage"
                        ? `${item.discount_value}%`
                        : `KES ${money(item.discount_value)}`}
                    </div>
                  )}

                  <div className="font-bold">Final: KES {money(item.total_price)}</div>

                </td>
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

          <div className="w-64">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <b>KES {money(receipt.subtotal)}</b>
            </div>

            {receipt.discount_value > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <b>
                  {receipt.discount_type === "percentage"
                    ? `${receipt.discount_value}%`
                    : `KES ${money(receipt.discount_value)}`}
                </b>
              </div>
            )}

            <div className="flex justify-between">
              <span>Tax ({receipt.tax_rate}%)</span>
              <b>KES {money(receipt.tax_amount)}</b>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-xl">
              <span>TOTAL</span>
              <b>KES {money(receipt.total)}</b>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="mt-10 text-center text-sm text-gray-600 border-t pt-4">
          <p className="font-semibold">THANK YOU FOR CHOOSING RIFT MOTORS!</p>
          <p className="mt-1">Payment received successfully.</p>
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
};

export default ServiceReceiptDetails;