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
              <p className="font-bold text-black">PIN: PO51561799Q</p>
            </div>

          </div>

          <hr className="border-black border-t-2" />

          {/* TITLE */}
          <div className="doc-title text-center py-1">
            <h2 className="text-sm font-extrabold tracking-[4px] uppercase text-gray-900">
              SERVICE ESTIMATE
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
                <td className="border border-black px-1 py-0.5" colSpan={2}>{field(estimate.customer_name)}</td>
                <td className="border border-black px-1 py-0.5 font-bold">KRA Pin:</td>
                <td className="border border-black px-1 py-0.5">{field(estimate.customer_kra_pin)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Address:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{field(estimate.customer_address)}</td>
                <td className="border border-black px-1 py-0.5 font-bold">Reg No:</td>
                <td className="border border-black px-1 py-0.5">{field(estimate.registration_number)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Mobile:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{field(estimate.customer_phone)}</td>
                <td className="border border-black px-1 py-0.5 font-bold">Model:</td>
                <td className="border border-black px-1 py-0.5">{field(estimate.vehicle_make)} {field(estimate.vehicle_model)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Status:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{estimate.status}</td>
                <td className="border border-black px-1 py-0.5 font-bold">Vin No:</td>
                <td className="border border-black px-1 py-0.5">{field(estimate.vin_no)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5" colSpan={3}></td>
                <td className="border border-black px-1 py-0.5 font-bold">Engine:</td>
                <td className="border border-black px-1 py-0.5">{field(estimate.engine_number)}</td>
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
            <button
              onClick={handleConvertInvoice}
              disabled={estimate.status !== "pending"}
              className="bg-green-600 text-white px-5 py-2 rounded disabled:bg-gray-400"
            >Convert To Invoice</button>
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

          {estimate.status==="invoiced" && (
            <div className="bg-blue-100 text-blue-700 p-2 rounded mb-2 text-[10px] print:hidden">
              This estimate has been converted to invoice and can no longer be edited.
            </div>
          )}

          {/* ITEMS — same bordered/compact styling as the items table on the
              paper estimate; the per-item adjustment controls (logic unchanged)
              live inside the Total cell so the table still fits densely. */}
          <table className="w-full border border-black text-[9px] leading-tight mt-2">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-0.5 text-left border border-black">Description</th>
                <th className="p-0.5 text-left border border-black">Type</th>
                <th className="p-0.5 border border-black">Qty</th>
                <th className="p-0.5 border border-black">Price</th>
                <th className="p-0.5 border border-black">Total</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items?.map(item=>(
                <tr key={item.id}>
                  <td className="p-0.5 border border-black align-top">{item.description}</td>
                  <td className="p-0.5 border border-black align-top">{item.item_type}</td>
                  <td className="p-0.5 border border-black text-center align-top">{item.quantity}</td>
                  <td className="p-0.5 border border-black text-right align-top">{Number(item.unit_price).toFixed(2)}</td>
                  <td className="p-0.5 border border-black align-top">

                    <div className="text-gray-500">
                      Original: KES {Number(item.original_price).toFixed(2)}
                    </div>

                    {item.item_type==="service" && estimate.status==="pending" && (
                      <div className="mt-1 print:hidden">
                        <label className="text-gray-500">Discount / Reduction</label>
                        <div className="flex gap-1 mt-0.5">
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
                            className="border border-black rounded px-1 py-0.5 w-16 text-[9px]"
                          />
                          <button
                            onClick={()=>handleAdjustmentUpdate(item.id)}
                            className="bg-blue-600 text-white rounded px-2 text-[9px]"
                          >Apply</button>
                        </div>
                      </div>
                    )}

                    {item.item_type==="sparepart" && estimate.status==="pending" && (
                      <div className="mt-1 print:hidden">
                        <label className="text-gray-500">Discount</label>
                        <div className="flex gap-1 mt-0.5 items-center">
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
                            className="border border-black rounded text-[9px]"
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
                            className="border border-black rounded px-1 py-0.5 w-14 text-[9px]"
                          />
                          <button
                            onClick={()=>handleAdjustmentUpdate(item.id)}
                            className="bg-blue-600 text-white rounded px-2 text-[9px]"
                          >Apply</button>
                        </div>
                      </div>
                    )}

                    <p className="mt-1">Adjustment: KES {Number(item.adjustment).toFixed(2)}</p>
                    <p className="font-bold">Final: KES {Number(item.total_price).toFixed(2)}</p>

                  </td>
                </tr>
              ))}
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
        {/* END OUTER FRAME */}

        {/* BRAND LOGOS — outside the frame */}
        <div className="doc-logos flex justify-between items-center px-2 mt-3">
          <img src="/brands/nissan.png" alt="Nissan" className="h-16 object-contain" />
          <img src="/brands/ford.jpg" alt="Ford" className="h-16 object-contain" />
          <img src="/brands/subaru.jpg" alt="Subaru" className="h-16 object-contain" />
        </div>

      </div>
    </div>
  )
}

export default ServiceEstimateDetails;