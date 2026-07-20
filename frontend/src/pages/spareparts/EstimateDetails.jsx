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

  // Renders the printable area into a PDF and returns it as a Blob.
  // Reused by both the download button and the share button so the
  // capture logic only lives in one place.
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
          `Estimate EST-${estimate.id} from Rift Motors - total KES ${Number(estimate.total).toFixed(2)}. PDF attached separately.`
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
      <div ref={printRef} className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl p-4 print-document border">

        {/* HEADER — logo shrunk so it stops dictating the row height;
            title now sits directly above the divider instead of floating
            in the tall space a big logo used to leave beside it. */}
        <div className="doc-header">

          <div className="flex justify-between items-start">

            <img
              src="/rmotologo.jpg"
              className="h-16 w-auto object-contain"
              alt="Rift Motors Limited"
            />

            <div className="text-right text-[10px] leading-[13px] text-gray-700">
              <p>P.O. Box 18952 - 20100</p>
              <p>KFA - Show Ground Road, Nakuru</p>
              <p>+254 712 345 678</p>
              <p>info@riftmotors.com</p>
            </div>

          </div>

          <div className="doc-title text-center mt-1 mb-1">
            <h2 className="text-base font-extrabold tracking-[4px] uppercase text-gray-900">
              ESTIMATE
            </h2>
          </div>

          <hr className="border-black border-t-2" />

        </div>

        {/* REF / CUSTOMER / DATE / KRA */}
        <div className="doc-meta grid grid-cols-2 gap-4 mt-2 text-[11px] leading-[15px]">

          <div className="space-y-0.5">
            <p><span className="font-bold">REF:</span> EST-{estimate.id}</p>
            <p><span className="font-bold">Bill To:</span> {field(estimate.customer_name)}</p>
            <p><span className="font-bold">Address:</span> {field(estimate.customer_address)}</p>
            <p><span className="font-bold">Mobile:</span> {field(estimate.customer_phone)}</p>
          </div>

          <div className="space-y-0.5 text-right">
            <p><span className="font-bold">Date:</span> {new Date(estimate.created_at).toLocaleDateString()}</p>
            <p><span className="font-bold">KRA Pin:</span> {field(estimate.customer_kra_pin)}</p>
            <p>
              <span className="font-bold">Status:</span>{" "}
              <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-[10px]">
                {estimate.status}
              </span>
            </p>
          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 my-3 print:hidden">
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

        {/* ITEMS — thin borders + tight padding + small font so 10+ rows
            still fit on one page. Nothing caps the row count; it just
            grows compactly instead of ballooning. */}
        <table className="w-full border border-black text-[10px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-1 text-left border border-black">Code</th>
              <th className="p-1 text-left border border-black">Description</th>
              <th className="p-1 border border-black">Qty</th>
              <th className="p-1 border border-black">Unit Price</th>
              <th className="p-1 border border-black">Total</th>
            </tr>
          </thead>
          <tbody>
            {estimate.items?.map(item=>(
              <tr key={item.id}>
                <td className="p-1 border border-black">{field(item.part_number)}</td>
                <td className="p-1 border border-black">{item.name}</td>
                <td className="p-1 border border-black text-center">{item.quantity}</td>
                <td className="p-1 border border-black text-right">KES {Number(item.unit_price).toFixed(2)}</td>
                <td className="p-1 border border-black text-right font-bold">KES {Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAYMENT DETAILS + TOTALS */}
        <div className="flex justify-between mt-3 gap-6 text-[11px]">

          <div className="leading-[15px] border border-black rounded p-2 w-72">
            <p className="font-bold mb-0.5">Payment To:</p>
            <p>NCBA Bank, Nakuru Branch</p>
            <p>A/C Name: Rift Motors Ltd</p>
            <p>A/C No: 3364820034, or through</p>
            <p>Mpesa Paybill No: 532602</p>
            <p>A/C No: RIFT MOTORS</p>
          </div>

          <div className="w-56">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <b>KES {Number(estimate.subtotal).toFixed(2)}</b>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <b>KES {Number(estimate.discount).toFixed(2)}</b>
            </div>
            <div className="flex justify-between">
              <span>VAT ({estimate.tax_rate}%)</span>
              <b>KES {Number(estimate.tax_amount).toFixed(2)}</b>
            </div>
            <hr className="my-1"/>
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span>KES {Number(estimate.total).toFixed(2)}</span>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="doc-footer mt-3 text-center border-t pt-2 text-[10px] text-gray-600">
          <p className="font-semibold">THANK YOU FOR YOUR BUSINESS!</p>
          <p className="mt-0.5">Goods remain property of the company unless fully paid for.</p>
          <p>Estimate applies one month from the date issued.</p>
        </div>

        {/* PRINTED BY - same localStorage pattern as "Served By" in InvoiceDetails.jsx */}
        <p className="mt-1 text-[9px] text-gray-500">Printed By: {user?.username || "N/A"}</p>

        {/* BRAND LOGOS - larger and spread across the width, like a
            printed dealer strip, rather than small and clustered tight
            in the center. */}
        <div className="doc-logos flex justify-between items-center px-2 mt-3">
          <img src="/brands/nissan.png" alt="Nissan" className="h-20 object-contain" />
          <img src="/brands/ford.jpg" alt="Ford" className="h-20 object-contain" />
          <img src="/brands/subaru.jpg" alt="Subaru" className="h-20 object-contain" />
        </div>

      </div>
    </div>
  )
}