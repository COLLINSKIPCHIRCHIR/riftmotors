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
    <p className="font-bold text-black">PIN: PO51561799Q</p>
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
              <td className="border border-black px-1 py-0.5 font-bold w-[10%]">REF:</td>
              <td className="border border-black px-1 py-0.5" colSpan={2}>EST-{estimate.id}</td>
              <td className="border border-black px-1 py-0.5 font-bold w-[10%]">Date:</td>
              <td className="border border-black px-1 py-0.5">{new Date(estimate.created_at).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 font-bold">Bill To:</td>
              <td className="border border-black px-1 py-0.5" colSpan={2}></td>
              <td className="border border-black px-1 py-0.5 font-bold">KRA Pin:</td>
              <td className="border border-black px-1 py-0.5">{field(estimate.customer_kra_pin)}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 font-bold">Customer:</td>
              <td className="border border-black px-1 py-0.5" colSpan={2}>{field(estimate.customer_name)}</td>
              <td className="border border-black px-1 py-0.5 font-bold">Reg No:</td>
              <td className="border border-black px-1 py-0.5">{field(estimate.reg_no)}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 font-bold">Address:</td>
              <td className="border border-black px-1 py-0.5" colSpan={2}>{field(estimate.customer_address)}</td>
              <td className="border border-black px-1 py-0.5 font-bold">Model:</td>
              <td className="border border-black px-1 py-0.5">{field(estimate.model)}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 font-bold">Contact Person:</td>
              <td className="border border-black px-1 py-0.5" colSpan={2}>{field(estimate.contact_person)}</td>
              <td className="border border-black px-1 py-0.5 font-bold">Vin No:</td>
              <td className="border border-black px-1 py-0.5">{field(estimate.vin_no)}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 font-bold">Mobile:</td>
              <td className="border border-black px-1 py-0.5" colSpan={2}>{field(estimate.customer_phone)}</td>
              <td className="border border-black px-1 py-0.5 font-bold">Engine:</td>
              <td className="border border-black px-1 py-0.5">{field(estimate.engine)}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5" colSpan={3}></td>
              <td className="border border-black px-1 py-0.5 font-bold">Mileage:</td>
              <td className="border border-black px-1 py-0.5">{field(estimate.mileage)}</td>
            </tr>
          </tbody>
        </table>

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
        <table className="w-full border border-black text-[9px] leading-tight mt-2">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-0.5 text-left border border-black">Code</th>
              <th className="p-0.5 text-left border border-black">Description</th>
              <th className="p-0.5 border border-black">Qty</th>
              <th className="p-0.5 border border-black">Unit Price</th>
              <th className="p-0.5 border border-black">Total</th>
            </tr>
          </thead>
          <tbody>
            {estimate.items?.map(item=>(
              <tr key={item.id}>
                <td className="p-0.5 border border-black">{field(item.part_number)}</td>
                <td className="p-0.5 border border-black">{item.name}</td>
                <td className="p-0.5 border border-black text-center">{item.quantity}</td>
                <td className="p-0.5 border border-black text-right">{Number(item.unit_price).toFixed(2)}</td>
                <td className="p-0.5 border border-black text-right font-bold">{Number(item.total).toFixed(2)}</td>
              </tr>
            ))}

            {/* TOTALS ROW — always shown, mirrors the pattern used in
                ServiceEstimateDetails.jsx: Qty column sums every line's
                quantity, Total column sums every line's total, so the
                items table is self-explanatory without cross-checking the
                Sub Total box further down. */}
            <tr className="bg-gray-100 font-bold">
              <td colSpan={2} className="p-0.5 border border-black text-right">Totals</td>
              <td className="p-0.5 border border-black text-center">{totalQty}</td>
              <td className="p-0.5 border border-black text-right">-</td>
              <td className="p-0.5 border border-black text-right">{totalAmount.toFixed(2)}</td>
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
                <td className="border border-black px-1 py-0.5 font-bold" colSpan={2}>Payment To:</td>
              </tr>
              <tr><td className="border border-black px-1 py-0.5" colSpan={2}>NCBA Bank, Nakuru Branch</td></tr>
              <tr><td className="border border-black px-1 py-0.5" colSpan={2}>A/C Name: Rift Motors Ltd</td></tr>
              <tr><td className="border border-black px-1 py-0.5" colSpan={2}>A/C No: 3364820034, or through</td></tr>
              <tr><td className="border border-black px-1 py-0.5" colSpan={2}>Mpesa Paybill No: 532602</td></tr>
              <tr><td className="border border-black px-1 py-0.5" colSpan={2}>A/C No: RIFT MOTORS</td></tr>
            </tbody>
          </table>

          <table className="border border-black w-[40%] h-fit">
            <tbody>
              <tr>
                <td className="border border-black px-1 py-0.5">Sub Total</td>
                <td className="border border-black px-1 py-0.5 text-right">{Number(estimate.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5">Discount</td>
                <td className="border border-black px-1 py-0.5 text-right">{Number(estimate.discount).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5">Vat ({estimate.tax_rate}%)</td>
                <td className="border border-black px-1 py-0.5 text-right">{Number(estimate.tax_amount).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Total Amount</td>
                <td className="border border-black px-1 py-0.5 text-right font-bold">{Number(estimate.total).toFixed(2)}</td>
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