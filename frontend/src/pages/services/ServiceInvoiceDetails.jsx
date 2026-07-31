import React,{useEffect,useState,useRef} from "react";
import {useParams,useNavigate} from "react-router-dom";
import {
  getServiceInvoice,
  payServiceInvoice
} from "../../api/serviceApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Shows a value, or "N/A" when it's missing (e.g. no vehicle linked to
// the job, or the customer has no KRA pin on file yet).
const field = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

// Discount amount for a single line item — mirrors the same helper used
// in ServiceEstimateDetails so the two documents stay visually consistent.
const lineDiscount = (item) =>
  Number(item.original_price || 0) - Number(item.total_price || 0);

const ServiceInvoiceDetails = () => {

  const {id} = useParams();
  const navigate = useNavigate();
  const [invoice,setInvoice] = useState(null);
  const [paymentMethod,setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const printRef = useRef();

  // Same pattern used elsewhere in the app for "Served By"/"Printed By"
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(()=>{
    const load = async()=>{
      const res = await getServiceInvoice(id);
      setInvoice(res.data);
    }
    load();
  },[id]);

  useEffect(()=>{
  if (invoice) {
    const remaining = Number(invoice.total) - Number(invoice.amount_paid || 0);
    setAmountPaid(remaining > 0 ? remaining : "");
  }
}, [invoice]);

  if(!invoice)
    return <div className="p-6">Loading invoice...</div>

 const handlePay = async () => {
  if (!paymentMethod) {
    alert("Select payment method");
    return;
  }
  if (!amountPaid || Number(amountPaid) <= 0) {
    alert("Enter an amount to pay");
    return;
  }
  const res = await payServiceInvoice(invoice.id, paymentMethod, amountPaid);
  navigate(`/admin/services/receipts/${res.data.receipt.id}`);
};

  // Renders the printable area into a PDF and returns it as a Blob.
  // The invoice has no live editing controls, but we keep the same
  // capture-hide + onclone pattern used in ServiceEstimateDetails so the
  // two components stay consistent and any future on-screen-only controls
  // added here are automatically excluded from exports too.
  const generatePdfBlob = async () => {
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll(".capture-hide").forEach((el) => {
          el.style.display = "none";
        });
      },
    });
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
      link.download = `ServiceInvoice-${invoice.invoice_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not generate PDF");
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generatePdfBlob();
      const file = new File([blob], `ServiceInvoice-${invoice.invoice_number}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Service Invoice ${invoice.invoice_number}`,
          text: `Service Invoice ${invoice.invoice_number} from Rift Motors`,
        });
      } else {
        const text = encodeURIComponent(
          `Service Invoice ${invoice.invoice_number} from Rift Motors - total KES ${Number(invoice.total).toFixed(2)}. PDF attached separately.`
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

  // Sum of every line's discount — feeds the Discount row in the totals box.
  const totalDiscount = (invoice.items || []).reduce(
    (sum, item) => sum + lineDiscount(item),
    0
  );

  // Sum of every line's quantity — feeds the Qty column in the items-table
  // totals row so the invoice is self-explanatory without cross-checking
  // the summary box further down the page.
  const totalQty = (invoice.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen print-container">
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
              SERVICE INVOICE
            </h2>
          </div>

          {/* REF / CUSTOMER / VEHICLE GRID */}
          <table className="w-full border border-black text-[10px] leading-[13px]">
            <tbody>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold w-[10%]">REF:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{field(invoice.invoice_number)}</td>
                <td className="border border-black px-1 py-0.5 font-bold w-[10%]">Date:</td>
                <td className="border border-black px-1 py-0.5">{new Date(invoice.created_at).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Bill To:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{field(invoice.customer_name)}</td>
                <td className="border border-black px-1 py-0.5 font-bold">KRA Pin:</td>
                <td className="border border-black px-1 py-0.5">{field(invoice.customer_kra_pin)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Address:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{field(invoice.customer_address)}</td>
                <td className="border border-black px-1 py-0.5 font-bold">Reg No:</td>
                <td className="border border-black px-1 py-0.5">{field(invoice.registration_number)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Mobile:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{field(invoice.customer_phone)}</td>
                <td className="border border-black px-1 py-0.5 font-bold">Model:</td>
                <td className="border border-black px-1 py-0.5">{field(invoice.vehicle_make)} {field(invoice.vehicle_model)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold">Status:</td>
                <td className="border border-black px-1 py-0.5" colSpan={2}>{invoice.status}</td>
                <td className="border border-black px-1 py-0.5 font-bold">Vin No:</td>
                <td className="border border-black px-1 py-0.5">{field(invoice.vin_no)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5" colSpan={3}></td>
                <td className="border border-black px-1 py-0.5 font-bold">Engine:</td>
                <td className="border border-black px-1 py-0.5">{field(invoice.engine_number)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5" colSpan={3}></td>
                <td className="border border-black px-1 py-0.5 font-bold">Mileage:</td>
                <td className="border border-black px-1 py-0.5">{field(invoice.mileage)}</td>
              </tr>
            </tbody>
          </table>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 my-3 print:hidden flex-wrap">

            {invoice.status!=="paid" && (
            <>
                <input
                type="number"
                placeholder="Amount to pay"
                value={amountPaid}
                onChange={(e)=>setAmountPaid(e.target.value)}
                className="border border-black p-2 rounded text-[10px] w-28"
                />
                <select
                value={paymentMethod}
                onChange={(e)=>setPaymentMethod(e.target.value)}
                className="border border-black p-2 rounded text-[10px]"
                >
                <option value="">Select payment</option>
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                </select>

                <button
                onClick={handlePay}
                className="bg-green-600 text-white px-5 py-2 rounded"
                >Record Payment</button>
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

          {/* ITEMS — Discount gets its own column, same as the estimate,
              so a converted estimate looks like the same document family. */}
          <table className="w-full border border-black text-[9px] leading-tight mt-2">
            <colgroup>
              <col className="w-[34%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-0.5 text-left border border-black">Description</th>
                <th className="p-0.5 text-left border border-black">Type</th>
                <th className="p-0.5 border border-black">Qty</th>
                <th className="p-0.5 border border-black">Price (KES)</th>
                <th className="p-0.5 border border-black">Discount (KES)</th>
                <th className="p-0.5 border border-black">Total (KES)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map(item=>{
                const discount = lineDiscount(item);
                return (
                <tr key={item.id}>
                  <td className="p-0.5 border border-black align-top">
                    {item.description}
                    {item.customer_supplied &&
                      <span className="italic text-gray-500 ml-1">(customer supplied)</span>
                    }
                  </td>
                  <td className="p-0.5 border border-black align-top">{item.item_type}</td>
                  <td className="p-0.5 border border-black text-center align-top">{item.quantity}</td>
                  <td className="p-0.5 border border-black text-right align-top">
                    {item.customer_supplied ? "-" : Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="p-0.5 border border-black text-right align-top">
                    {item.customer_supplied ? "-" : (discount > 0 ? discount.toFixed(2) : "-")}
                  </td>
                  <td className="p-0.5 border border-black align-top text-right font-bold">
                    {item.customer_supplied ? "-" : Number(item.total_price).toFixed(2)}
                  </td>
                </tr>
              )})}

              {/* TOTALS ROW — always shown, lands in the same Qty / Price /
                  Discount / Total columns as the line items above, so the
                  invoice is self-explanatory on its own: Qty column sums
                  every line's quantity, Price column shows the pre-discount
                  items total, Discount column shows what was taken off (or
                  "-" when there's none), and Total lands in the same column
                  as invoice.subtotal further down. */}
              <tr className="bg-gray-100 font-bold">
                <td colSpan={2} className="p-0.5 border border-black text-right">Totals</td>
                <td className="p-0.5 border border-black text-center">{totalQty}</td>
                <td className="p-0.5 border border-black text-right">{(Number(invoice.subtotal) + totalDiscount).toFixed(2)}</td>
                <td className="p-0.5 border border-black text-right">{totalDiscount > 0 ? totalDiscount.toFixed(2) : "-"}</td>
                <td className="p-0.5 border border-black text-right">{Number(invoice.subtotal).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* PAYMENT DETAILS + TOTALS */}
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
                {totalDiscount > 0 && (
                  <>
                    <tr>
                      <td className="border border-black px-1 py-0.5">Total</td>
                      <td className="border border-black px-1 py-0.5 text-right">{(Number(invoice.subtotal) + totalDiscount).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-1 py-0.5">Discount</td>
                      <td className="border border-black px-1 py-0.5 text-right">-{totalDiscount.toFixed(2)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td className="border border-black px-1 py-0.5">Sub Total</td>
                  <td className="border border-black px-1 py-0.5 text-right">{Number(invoice.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5">Vat ({invoice.tax_rate}%)</td>
                  <td className="border border-black px-1 py-0.5 text-right">{Number(invoice.tax_amount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5 font-bold">Total Amount</td>
                  <td className="border border-black px-1 py-0.5 text-right font-bold">{Number(invoice.total).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

          </div>

          {/* FOOTER */}
          <div className="doc-footer mt-3 text-center border-t pt-2 text-[9px] text-gray-600">
            <p className="font-semibold">THANK YOU FOR YOUR BUSINESS!</p>
            <p className="mt-0.5">Goods remain property of the company unless fully paid for.</p>
          </div>

          {/* PRINTED BY / PRINTED ON */}
          <div className="mt-1 flex justify-between text-[9px] text-gray-500">
            <p>Printed By: {user?.username || "N/A"}</p>
            <p>Printed On: {new Date().toLocaleString()}</p>
          </div>

          {/* MARKETING FOOTER — invoices only */}
          <div className="mt-2 pt-1 border-t border-dashed border-gray-400 text-center text-[8px] text-gray-500">
            <p>Invoicing powered by <span className="font-semibold">Comax Solutions</span></p>
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

export default ServiceInvoiceDetails;