import React,{useEffect,useState,useRef} from "react";
import {useParams,useNavigate} from "react-router-dom";
import {
  getServiceEstimate,
  convertServiceEstimate,
  updateEstimateItem
} from "../../api/serviceApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Shows a value, or "N/A" when it's missing (e.g. no vehicle linked to
// the job, or the customer has no KRA pin on file yet).
const field = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

const ServiceEstimateDetails =()=>{

  const {id}=useParams();
  const navigate = useNavigate();
  const [estimate,setEstimate]=useState(null);
  const [adjustments,setAdjustments]=useState({});
  const printRef = useRef();

  // Same pattern used in InvoiceDetails.jsx for "Served By"
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(()=>{
    const load=async()=>{
      try{
        const res = await getServiceEstimate(id);
        setEstimate(res.data);
      }catch(err){
        console.log(err);
      }
    }
    load();
  },[id]);

  if(!estimate)
    return (<div className="p-6">Loading estimate...</div>)

  const handleConvertInvoice = async()=>{
    try{
      const res = await convertServiceEstimate(id);
      alert("Estimate converted to invoice");
      navigate(`/admin/services/invoices/${res.data.invoice.id}`);
    }catch(err){
      alert(err.response?.data?.error || "Failed converting invoice");
    }
  }

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
      link.download = `ServiceEstimate-${estimate.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not generate PDF");
    }
  };

  // Native share sheet where available (most mobile browsers share the
  // real PDF file). Desktop browsers can't push a file into WhatsApp Web
  // or a mail client this way, so we fall back to downloading the PDF and
  // opening WhatsApp Web with just a text note.
  const handleShare = async () => {
    try {
      const blob = await generatePdfBlob();
      const file = new File([blob], `ServiceEstimate-${estimate.id}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Service Estimate EST-${estimate.id}`,
          text: `Service Estimate EST-${estimate.id} from Rift Motors`,
        });
      } else {
        const text = encodeURIComponent(
          `Service Estimate EST-${estimate.id} from Rift Motors - total KES ${Number(estimate.total).toFixed(2)}. PDF attached separately.`
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

  const handleAdjustmentUpdate = async(itemId)=>{
    await updateEstimateItem(itemId, adjustments[itemId]);
    const res = await getServiceEstimate(id);
    setEstimate(res.data);
  }

  return (
    <div className="print-container p-6 bg-gray-100 min-h-screen">
      <div ref={printRef} className="print-document max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-6 border">

        {/* HEADER */}
        <div className="doc-header flex justify-between items-start border-b-2 border-black pb-2">

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
          <h2 className="text-2xl font-bold tracking-widest text-gray-800">SERVICE ESTIMATE</h2>
        </div>

        {/* CUSTOMER / VEHICLE / DATE */}
        <div className="grid grid-cols-2 gap-6 mt-6 text-sm">

          <div className="space-y-1">
            <p><span className="font-bold">REF:</span> EST-{estimate.id}</p>
            <p><span className="font-bold">Bill To:</span> {field(estimate.customer_name)}</p>
            <p><span className="font-bold">Address:</span> {field(estimate.customer_address)}</p>
            <p><span className="font-bold">Mobile:</span> {field(estimate.customer_phone)}</p>
            <p><span className="font-bold">KRA Pin:</span> {field(estimate.customer_kra_pin)}</p>
          </div>

          <div className="space-y-1 text-right">
            <p><span className="font-bold">Date:</span> {new Date(estimate.created_at).toLocaleDateString()}</p>
            <p><span className="font-bold">Reg No:</span> {field(estimate.registration_number)}</p>
            <p><span className="font-bold">Model:</span> {field(estimate.vehicle_make)} {field(estimate.vehicle_model)}</p>
            <p><span className="font-bold">VIN No:</span> {field(estimate.vin_no)}</p>
            <p><span className="font-bold">Engine:</span> {field(estimate.engine_number)}</p>
            <p><span className="font-bold">Mileage:</span> {field(estimate.mileage)}</p>
            <p>
              <span className="font-bold">Status:</span>{" "}
              <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                {estimate.status}
              </span>
            </p>
          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 my-6 print:hidden">
          <button
            onClick={handleConvertInvoice}
            disabled={estimate.status !== "pending"}
            className="bg-green-600 text-white px-5 py-2 rounded-lg disabled:bg-gray-400"
          >Convert To Invoice</button>
          <button
            onClick={()=>window.print()}
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

        {estimate.status==="invoiced" && (
          <div className="bg-blue-100 text-blue-700 p-3 rounded mb-5">
            This estimate has been converted to invoice and can no longer be edited.
          </div>
        )}

        {/* ITEMS */}
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left border">Description</th>
              <th className="p-3 text-left border">Type</th>
              <th className="p-2 border">Qty</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {estimate.items?.map(item=>(
              <tr key={item.id} className="border-t">
                <td className="p-3 border">{item.description}</td>
                <td className="p-2 border">{item.item_type}</td>
                <td className="p-2 border text-center">{item.quantity}</td>
                <td className="p-2 border text-right">KES {item.unit_price}</td>
                <td className="p-3 border">

                  <div className="text-sm text-gray-500">
                    Original: KES {item.original_price}
                  </div>

                  {item.item_type==="service" && estimate.status==="pending" && (
                    <div className="mt-2">
                      <label className="text-xs text-gray-500">Discount / Reduction</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={adjustments[item.id]?.adjustment ?? item.adjustment ?? ""}
                          onChange={(e)=>
                            setAdjustments({
                              ...adjustments,
                              [item.id]:{
                                ...adjustments[item.id],
                                adjustment:Number(e.target.value)
                              }
                            })
                          }
                          className="border rounded p-2 w-24"
                        />
                        <button
                          onClick={()=>handleAdjustmentUpdate(item.id)}
                          className="bg-blue-600 text-white rounded px-3"
                        >Apply</button>
                      </div>
                    </div>
                  )}

                  {item.item_type==="sparepart" && estimate.status==="pending" && (
                    <div>
                      <label>Discount</label>
                      <select
                        onChange={(e)=>
                          setAdjustments({
                            ...adjustments,
                            [item.id]:{
                              ...adjustments[item.id],
                              discount_type:e.target.value
                            }
                          })
                        }
                      >
                        <option value="amount">KES</option>
                        <option value="percentage">%</option>
                      </select>
                      <input
                        type="number"
                        value={adjustments[item.id]?.discount_value ?? ""}
                        onChange={(e)=>
                          setAdjustments({
                            ...adjustments,
                            [item.id]:{
                              ...adjustments[item.id],
                              discount_value:Number(e.target.value)
                            }
                          })
                        }
                      />
                      <button onClick={()=>handleAdjustmentUpdate(item.id)}>Apply</button>
                    </div>
                  )}

                  <p className="mt-2">Adjustment: KES {item.adjustment}</p>
                  <p className="font-bold">Final: KES {item.total_price}</p>

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
              <b>KES {estimate.subtotal}</b>
            </div>
            <div className="flex justify-between">
              <span>Tax ({estimate.tax_rate}%)</span>
              <b>KES {estimate.tax_amount}</b>
            </div>
            <hr className="my-3"/>
            <div className="flex justify-between text-xl">
              <span>TOTAL</span>
              <b>KES {estimate.total}</b>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="mt-10 text-center text-sm text-gray-600 border-t pt-4">
          <p className="font-semibold">THANK YOU FOR YOUR BUSINESS!</p>
          <p className="mt-2">This estimate is valid before confirmation and invoice generation.</p>
        </div>

        {/* PRINTED BY - same localStorage pattern as "Served By" in InvoiceDetails.jsx */}
        <p className="mt-4 text-xs text-gray-500">Printed By: {user?.username || "N/A"}</p>

        {/* BRAND LOGOS - replace src with your own local assets */}
        <div className="flex justify-center items-center gap-10 mt-6 opacity-80">
          <img src="/brands/nissan.png" alt="Nissan" className="h-10 object-contain" />
          <img src="/brands/ford.jpg" alt="Ford" className="h-10 object-contain" />
          <img src="/brands/subaru.jpg" alt="Subaru" className="h-10 object-contain" />
        </div>

      </div>
    </div>
  )
}

export default ServiceEstimateDetails;