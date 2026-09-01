import React,{useEffect,useState,useRef} from "react";
import {useParams,useNavigate} from "react-router-dom";
import { getServiceCreditNote, updateCreditNote } from "../../api/serviceApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const field = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ServiceCreditNoteDetails = () => {

  const {id} = useParams();
  const navigate = useNavigate();
  const [creditNote,setCreditNote] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedReason, setEditedReason] = useState("");
  // { [itemId]: { credit_amount: string|number, quantity: string|number } }
  const [editedItems, setEditedItems] = useState({});
  const [saving, setSaving] = useState(false);
  const printRef = useRef();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(()=>{
    const load = async()=>{
      try{
        const res = await getServiceCreditNote(id);
        setCreditNote(res.data);
      }catch(err){
        console.log(err);
      }
    }
    load();
  },[id]);

  if(!creditNote)
    return <div className="p-6">Loading credit note...</div>

  // Same multi-page PDF pipeline used in ServiceInvoiceDetails/
  // ServiceEstimateDetails, trimmed to what this document needs. Kept
  // identical in approach so pagination and print quality stay
  // consistent across all three document types.
  const PDF_CAPTURE_WIDTH_PX = 1100;

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
          clonedContainer.style.fontSize = "14px";
        }

        clonedDoc.querySelectorAll(".capture-hide").forEach((el) => {
          el.style.display = "none";
        });

        clonedDoc.querySelectorAll("table td, table th").forEach((el) => {
          el.style.verticalAlign = "middle";
          el.style.lineHeight = "1.6";
        });

        clonedDoc.querySelectorAll("table th").forEach((el) => {
          el.style.fontSize = "16px";
          el.style.fontWeight = "800";
          el.style.padding = "6px 7px";
        });

        clonedDoc.querySelectorAll("table td").forEach((el) => {
          el.style.fontSize = "15px";
          el.style.fontWeight = "700";
          el.style.padding = "5px 7px";
        });

        clonedDoc.querySelectorAll(".doc-title").forEach((el) => {
          el.style.paddingTop = "10px";
          el.style.paddingBottom = "10px";
        });
        clonedDoc.querySelectorAll(".doc-title h2").forEach((el) => {
          el.style.fontSize = "28px";
          el.style.fontWeight = "800";
          el.style.letterSpacing = "4px";
          el.style.color = "#000";
          el.style.lineHeight = "1.4";
          el.style.margin = "0";
        });

        clonedDoc.querySelectorAll("table").forEach((el) => {
          el.style.borderCollapse = "collapse";
        });
        clonedDoc
          .querySelectorAll("table, table td, table th, table tr")
          .forEach((el) => {
            el.style.borderColor = "#555555";
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

    const margin = 6;
    const usableWidth = pageWidthMM - margin * 2;

    const SCALE = 2;
    const pxPerMM = canvas.width / pageWidthMM;
    const pageHeightPx = pageHeightMM * pxPerMM;

    const rowBottoms = rowBoundaries
      .map((r) => r.bottom * SCALE)
      .sort((a, b) => a - b);

    let currentY = 0;
    let pageIndex = 0;

    while (currentY < canvas.height - 1) {
      const idealEnd = Math.min(currentY + pageHeightPx, canvas.height);
      let sliceEnd = idealEnd;

      if (idealEnd < canvas.height) {
        const safeBreak = rowBottoms
          .filter((b) => b > currentY && b <= idealEnd)
          .pop();
        if (safeBreak) sliceEnd = safeBreak;
      }

      const sliceHeight = Math.round(sliceEnd - currentY);
      if (sliceHeight <= 0) break;

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;
      sliceCanvas
        .getContext("2d")
        .drawImage(
          canvas,
          0, currentY, canvas.width, sliceHeight,
          0, 0, canvas.width, sliceHeight
        );

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
      link.download = `CreditNote-${creditNote.credit_note_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not generate PDF");
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generatePdfBlob();
      const file = new File([blob], `CreditNote-${creditNote.credit_note_number}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Credit Note ${creditNote.credit_note_number}`,
          text: `Credit Note ${creditNote.credit_note_number} from Rift Motors`,
        });
      } else {
        const text = encodeURIComponent(
          `Credit Note ${creditNote.credit_note_number} from Rift Motors - amount KES ${formatMoney(creditNote.total)}. PDF attached separately.`
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

  // EDIT MODE ---------------------------------------------------------
  // Two independent things can be corrected per line:
  //   - credit_amount: real money owed back to the customer.
  //   - quantity: a documentation-only label (e.g. the invoice recorded
  //     "2" for labour due to a rounding bug, but the real figure was
  //     "1.5"). Changing quantity alone never touches subtotal/tax/total.
  // A line needs at least one of the two to actually change, enforced
  // server-side.

  const handleStartEdit = () => {
    setEditedReason(creditNote.reason || "");
    setEditedItems(
      Object.fromEntries(
        creditNote.items.map((i) => [
          i.id,
          { credit_amount: i.total_price, quantity: i.quantity }
        ])
      )
    );
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const handleAmountChange = (itemId, value) => {
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], credit_amount: value }
    }));
  };

  const handleQuantityChange = (itemId, value) => {
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: value }
    }));
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const items = Object.entries(editedItems).map(([itemId, vals]) => ({
        id: Number(itemId),
        credit_amount: Number(vals.credit_amount || 0),
        quantity: Number(vals.quantity)
      }));
      const res = await updateCreditNote(creditNote.id, { reason: editedReason, items });
      setCreditNote(res.data.creditNote);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update credit note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="print-container p-6 bg-gray-100 min-h-screen">
      <div ref={printRef} className="max-w-5xl mx-auto bg-white print-document border border-black p-2 text-[10px] leading-[13px]">

        <div className="border-2 border-black p-3">

          {/* HEADER */}
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
              <p>+254 790 406 996</p>
              <p>info@riftmotors.com</p>
              <p className="font-bold text-black text-[12px]">PIN: PO51561799Q</p>
            </div>
          </div>

          <hr className="border-black border-t-2" />

          {/* TITLE */}
          <div className="doc-title text-center py-1">
            <h2 className="text-sm font-extrabold tracking-[4px] uppercase text-red-700">
              CREDIT NOTE
            </h2>
          </div>

          {/* REF / INVOICE / CUSTOMER GRID */}
          <table className="w-full border border-black text-[10px] leading-[13px]">
            <tbody>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold w-[10%] align-middle">REF:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>
                  {creditNote.credit_note_number}
                </td>
                <td className="border border-black px-1 py-0.5 font-bold w-[10%] align-middle">Date:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{new Date(creditNote.created_at).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Against Invoice:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={4}>
                  {field(creditNote.invoice_number)}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Customer:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>
                  {field(creditNote.customer_name)}
                </td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">KRA Pin:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(creditNote.customer_kra_pin)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Address:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>{field(creditNote.customer_address)}</td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Reg No:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(creditNote.registration_number)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Model:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={2}>
                  {field(creditNote.vehicle_make)} {field(creditNote.vehicle_model)}
                </td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Vin No:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(creditNote.vin_no)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5" colSpan={3}></td>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Engine:</td>
                <td className="border border-black px-1 py-0.5 align-middle">{field(creditNote.engine_number)}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5 font-bold align-middle">Reason:</td>
                <td className="border border-black px-1 py-0.5 align-middle" colSpan={4}>
                  {editing ? (
                    <input
                      type="text"
                      value={editedReason}
                      onChange={(e) => setEditedReason(e.target.value)}
                      className="w-full border border-black rounded px-1 py-0.5 text-[10px] capture-hide print:hidden"
                    />
                  ) : (
                    field(creditNote.reason)
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 my-3 print:hidden capture-hide flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-600 text-white px-5 py-2 rounded"
            >Back</button>

            {editing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="bg-gray-500 text-white px-5 py-2 rounded disabled:opacity-50"
                >Cancel</button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="bg-green-600 text-white px-5 py-2 rounded disabled:opacity-50"
                >{saving ? "Saving..." : "Save Changes"}</button>
              </>
            ) : (
              <button
                onClick={handleStartEdit}
                className="bg-amber-600 text-white px-5 py-2 rounded"
              >Edit</button>
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

          {editing && (
            <p className="text-[9px] text-gray-500 mb-1 print:hidden capture-hide">
              Amount is pre-VAT money credited back. Qty only needs changing if
              it was recorded wrong on the original invoice — that alone doesn't
              move any money.
            </p>
          )}

          {/* ITEMS */}
          <table className="w-full border border-black text-[10px] leading-normal mt-2">
            <colgroup>
              <col className="w-[46%]" />
              <col className="w-[18%]" />
              <col className="w-[36%]" />
            </colgroup>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-1 text-left border border-black align-middle">Description</th>
                <th className="p-1 border border-black align-middle">Qty</th>
                <th className="p-1 border border-black align-middle">Credited (KES)</th>
              </tr>
            </thead>
            <tbody>
              {creditNote.items?.map(item=>(
                <tr key={item.id}>
                  <td className="p-1 border border-black align-middle">{item.description}</td>
                  <td className="p-1 border border-black text-center align-middle">
                    {editing ? (
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={editedItems[item.id]?.quantity ?? item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="w-16 border border-black rounded px-1 py-0.5 text-center text-[10px] capture-hide print:hidden"
                      />
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td className="p-1 border border-black text-right align-middle font-bold">
                    {editing ? (
                      <input
                        type="number"
                        min={0}
                        value={editedItems[item.id]?.credit_amount ?? item.total_price}
                        onChange={(e) => handleAmountChange(item.id, e.target.value)}
                        className="w-full border border-black rounded px-1 py-0.5 text-right text-[10px] capture-hide print:hidden"
                      />
                    ) : (
                      formatMoney(item.total_price)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="flex justify-end mt-2 text-[10px] leading-[13px]">
            <table className="border border-black w-[40%] h-fit">
              <tbody>
                <tr>
                  <td className="border border-black px-1 py-0.5 align-middle">Sub Total</td>
                  <td className="border border-black px-1 py-0.5 text-right align-middle">{formatMoney(creditNote.subtotal)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5 align-middle">Vat ({creditNote.tax_rate}%)</td>
                  <td className="border border-black px-1 py-0.5 text-right align-middle">{formatMoney(creditNote.tax_amount)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-1 py-0.5 font-bold align-middle">Total Credited</td>
                  <td className="border border-black px-1 py-0.5 text-right font-bold align-middle">{formatMoney(creditNote.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="doc-footer mt-3 text-center border-t pt-2 text-[9px] text-gray-600">
            <p className="font-semibold">This amount has been credited against the invoice above.</p>
          </div>

          <div className="mt-1 flex justify-between text-[9px] text-gray-500">
            <p>Issued By: {user?.username || "N/A"}</p>
            <p>Printed On: {new Date().toLocaleString()}</p>
          </div>

        </div>

        <div className="doc-logos flex justify-between items-center px-2 mt-3">
          <img src="/brands/nissan.png" alt="Nissan" className="h-16 object-contain" />
          <img src="/brands/ford.jpg" alt="Ford" className="h-16 object-contain" />
          <img src="/brands/subaru.jpg" alt="Subaru" className="h-16 object-contain" />
        </div>

      </div>
    </div>
  )
}

export default ServiceCreditNoteDetails;