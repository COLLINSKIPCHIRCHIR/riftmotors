import React, { useEffect, useState, useRef } from "react";

import API, { API_ORIGIN } from "../../api/api";

import { useParams, useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import { hasPermission } from "../../utils/permissions";

import jsPDF from "jspdf";

import html2canvas from "html2canvas";

const resolveImageUrl = (url) => {
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_ORIGIN}${url}`;
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const field = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

const PDF_CAPTURE_WIDTH_PX = 1100;

const QuoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quote, setQuote] = useState(null);
  const [converting, setConverting] = useState(false);

  const printRef = useRef();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchQuote = () => {
    API.get(`/sales-quotes/${id}`).then((res) => setQuote(res.data));
  };

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this quote?")) return;

    await API.patch(`/sales-quotes/${id}/status`, {
      status: "cancelled",
    });

    toast.success("Quote cancelled");

    fetchQuote();
  };

  const handleConvertToInvoice = async () => {
    setConverting(true);

    try {
      const res = await API.post("/sales-invoices", {
        quote_id: quote.id,
        vehicle_id: quote.vehicle_id,
        customer_id: quote.customer_id,
        sale_price: quote.quoted_price,
        trade_in_amount: quote.trade_in_amount,
        vat_amount: quote.vat_amount,
        registration_fee: quote.registration_fee,
      });

      toast.success(
        `✅ Invoice ${res.data.invoice.invoice_no} created`
      );

      navigate(
        `/admin/sales/invoices/${res.data.invoice.id}`
      );
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.error ||
          "Error creating invoice"
      );
    } finally {
      setConverting(false);
    }
  };

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
        const clonedContainer =
          clonedDoc.querySelector(".print-document");

        if (clonedContainer) {
          clonedContainer.style.width = `${PDF_CAPTURE_WIDTH_PX}px`;
          clonedContainer.style.maxWidth = `${PDF_CAPTURE_WIDTH_PX}px`;
          clonedContainer.style.margin = "0";
        }

        clonedDoc
          .querySelectorAll(".capture-hide")
          .forEach((el) => {
            el.style.display = "none";
          });

        clonedDoc
          .querySelectorAll("table td, table th")
          .forEach((el) => {
            el.style.verticalAlign = "middle";
            el.style.lineHeight = "1.6";
          });

        if (clonedContainer) {
          clonedContainer.style.fontSize = "14px";
        }

        clonedDoc
          .querySelectorAll("table th")
          .forEach((el) => {
            el.style.fontSize = "16px";
            el.style.fontWeight = "800";
            el.style.padding = "6px 7px";
          });

        clonedDoc
          .querySelectorAll("table td")
          .forEach((el) => {
            el.style.fontSize = "15px";
            el.style.fontWeight = "700";
            el.style.padding = "5px 7px";
          });

        clonedDoc
          .querySelectorAll(".doc-title")
          .forEach((el) => {
            el.style.paddingTop = "8px";
            el.style.paddingBottom = "8px";
          });

        clonedDoc
          .querySelectorAll(".doc-title h2")
          .forEach((el) => {
            el.style.fontSize = "28px";
            el.style.fontWeight = "800";
            el.style.letterSpacing = "4px";
            el.style.color = "#000";
            el.style.lineHeight = "1.4";
            el.style.margin = "0";
          });

        clonedDoc
          .querySelectorAll("table")
          .forEach((el) => {
            el.style.borderCollapse = "collapse";
          });

        clonedDoc
          .querySelectorAll(
            "table, table td, table th, table tr"
          )
          .forEach((el) => {
            el.style.borderColor = "#555555";
          });

        const container =
          clonedDoc.querySelector(".print-document");

        if (container) {
          const containerTop =
            container.getBoundingClientRect().top;

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

    const pageWidthMM =
      pdf.internal.pageSize.getWidth();

    const pageHeightMM =
      pdf.internal.pageSize.getHeight();

    const margin = 6;

    const usableWidth =
      pageWidthMM - margin * 2;

    const SCALE = 2;

    const pxPerMM =
      canvas.width / pageWidthMM;

    const pageHeightPx =
      pageHeightMM * pxPerMM;

    const rowBottoms = rowBoundaries
      .map((r) => r.bottom * SCALE)
      .sort((a, b) => a - b);

    let currentY = 0;
    let pageIndex = 0;

    while (currentY < canvas.height - 1) {
      const idealEnd = Math.min(
        currentY + pageHeightPx,
        canvas.height
      );

      let sliceEnd = idealEnd;

      if (idealEnd < canvas.height) {
        const safeBreak = rowBottoms
          .filter(
            (b) =>
              b > currentY &&
              b <= idealEnd
          )
          .pop();

        if (safeBreak) {
          sliceEnd = safeBreak;
        }
      }

      const sliceHeight = Math.round(
        sliceEnd - currentY
      );

      if (sliceHeight <= 0) break;

      const sliceCanvas =
        document.createElement("canvas");

      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;

      sliceCanvas
        .getContext("2d")
        .drawImage(
          canvas,
          0,
          currentY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

      const imgData =
        sliceCanvas.toDataURL("image/png");

      const imgHeightMM =
        (sliceHeight * usableWidth) /
        canvas.width;

      if (pageIndex > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        margin,
        usableWidth,
        imgHeightMM
      );

      currentY = sliceEnd;
      pageIndex += 1;
    }

    return pdf.output("blob");
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await generatePdfBlob();

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download = `Quote-${quote.quote_ref.replace(
        /\//g,
        "-"
      )}.pdf`;

      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);

      toast.error(
        "Could not generate PDF"
      );
    }
  };

  const handleShare = async () => {
    try {
      const blob =
        await generatePdfBlob();

      const file = new File(
        [blob],
        `Quote-${quote.quote_ref.replace(
          /\//g,
          "-"
        )}.pdf`,
        {
          type: "application/pdf",
        }
      );

      if (
        navigator.canShare &&
        navigator.canShare({
          files: [file],
        })
      ) {
        await navigator.share({
          files: [file],
          title: `Quote ${quote.quote_ref}`,
          text: `Proforma Quote ${quote.quote_ref} from Rift Motors - total KES ${formatMoney(
            quote.total_price
          )}.`,
        });
      } else {
        const text =
          encodeURIComponent(
            `Proforma Quote ${quote.quote_ref} from Rift Motors - total KES ${formatMoney(
              quote.total_price
            )}. PDF attached separately.`
          );

        if (
          window.confirm(
            "Your browser can't attach the PDF directly. Download it now, then open WhatsApp to send it manually?"
          )
        ) {
          await handleDownloadPdf();

          window.open(
            `https://wa.me/?text=${text}`,
            "_blank"
          );
        }
      }
    } catch (err) {
      console.error(err);

      toast.error("Sharing failed");
    }
  };

  if (!quote) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  const isNew =
    quote.condition === "new";

  const itemsTotal =
    (quote.items || []).reduce(
      (sum, it) =>
        sum +
        Number(it.price) *
          Number(it.quantity),
      0
    );

  const subTotal =
    Number(quote.quoted_price) -
    Number(quote.trade_in_amount || 0) +
    itemsTotal +
    Number(quote.vat_amount || 0);

  const vehicleImageUrl =
    resolveImageUrl(
      quote.vehicle_image_url
    );

  return (
    <div className="print-container p-6 bg-gray-100 min-h-screen print:p-0 print:bg-white print:min-h-0">

      {/* Print page setup — A4 with tight margins so the doc has more usable height */}
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
        }
      `}</style>

      <div
        ref={printRef}
        className="max-w-3xl mx-auto bg-white print-document p-6 text-[12px] leading-[16px] print:p-2 print:text-[10px] print:leading-[13px]"
      >

        {/* =====================================================
            HEADER — KEEPING ORIGINAL HEADER (left untouched)
        ===================================================== */}

        <div className="doc-header flex justify-center items-center gap-4 pb-2 print:gap-2 print:pb-1">
          <div className="flex items-center justify-end">
            <img
              src="/rmotologo.jpg"
              className="h-16 w-auto object-contain print:h-12"
              alt="Rift Motors Limited"
            />
          </div>

          <div className="border-l-2 border-black self-stretch"></div>

          <div className="flex flex-col justify-center text-left text-[9px] leading-[14px] text-gray-700 space-y-0.5 print:text-[8px] print:leading-[11px]">
            <p>
              P.O. Box 18952 - 20100
            </p>

            <p>
              KFA - Show Ground Road, Nakuru
            </p>

            <p>
              +254 790 406 996
            </p>

            <p>
              info@riftmotors.com
            </p>

            <p>
              riftmotorsltd@gmail.com
            </p>

            <p className="font-bold text-black text-[12px] print:text-[10px]">
              PIN: PO51561799Q
            </p>
          </div>
        </div>

        {/* HEADER LINE */}
        <div className="border-t-2 border-black"></div>


        {/* =====================================================
            QUOTE REFERENCE / DATE
        ===================================================== */}

        <div className="flex justify-between items-baseline text-[11px] mt-1 print:text-[10px] print:mt-0.5">
          <p>
            <span className="font-bold">
              Quote Ref:
            </span>{" "}
            {quote.quote_ref}
          </p>

          <p>
            <span className="font-bold">
              Date
            </span>{" "}
            {new Date(
              quote.created_at
            ).toLocaleDateString("en-GB")}
          </p>
        </div>


        {/* =====================================================
            DOCUMENT TITLE
        ===================================================== */}

        <div className="doc-title text-center py-0.5 print:py-0.5">
          <h2 className="text-base font-bold tracking-[5px] uppercase">
            Proforma Invoice
          </h2>
        </div>

        <div className="border-t-2 border-black"></div>


        {/* =====================================================
            CLIENT DETAILS
            LINE ABOVE + LINE BELOW
        ===================================================== */}

        <div className="border-b border-black py-1 print:py-0.5">
          <p className="font-bold underline text-[11px] print:text-[10px]">
            Client Details
          </p>
        </div>

        <div className="grid grid-cols-[75px_1fr_60px_1fr] gap-x-2 gap-y-1 text-[11px] mt-1 pb-2 print:text-[10px] print:mt-0.5 print:pb-1 print:gap-y-0.5">
          <p className="font-bold">
            Name:
          </p>

          <p>
            {field(
              quote.customer_name
            )}
          </p>

          <p className="font-bold">
            Phone:
          </p>

          <p>
            {field(
              quote.customer_phone
            )}
          </p>

          <p className="font-bold">
            Address:
          </p>

          <p>
            {field(
              quote.customer_address
            )}
          </p>

          <p className="font-bold">
            Email:
          </p>

          <p>
            {field(
              quote.customer_email
            )}
          </p>
        </div>


        {/* =====================================================
            VEHICLE DETAILS
        ===================================================== */}

        <div className="border-t border-black py-1 print:py-0.5">
          <p className="font-bold underline text-[11px] print:text-[10px]">
            Vehicle Details
          </p>
        </div>


        {/* =====================================================
            VEHICLE IMAGE + SPECIFICATIONS
        ===================================================== */}

        <div className="grid grid-cols-[44%_56%] gap-3 mt-1 print:gap-2 print:mt-1">

          {/* LEFT SIDE */}

          <div>
            {vehicleImageUrl ? (
              <img
                src={vehicleImageUrl}
                alt={quote.model}
                className="w-full h-auto object-contain print:max-h-[130px]"
                onError={(e) => {
                  e.target.style.display =
                    "none";
                }}
              />
            ) : (
              <div className="w-full h-40 flex items-center justify-center text-gray-400 text-xs">
                No image
              </div>
            )}

            {/* WARRANTY */}

            {isNew &&
              (quote.warranty_text ||
                quote.free_service_text) && (
                <div className="text-[10px] mt-2 space-y-0.5 print:text-[9px] print:mt-1">
                  {quote.warranty_text && (
                    <p>
                      {
                        quote.warranty_text
                      }
                    </p>
                  )}

                  {quote.free_service_text && (
                    <p>
                      {
                        quote.free_service_text
                      }
                    </p>
                  )}
                </div>
              )}
          </div>


          {/* RIGHT SIDE — SPECIFICATIONS */}

          <div className="text-[11px] print:text-[10px]">

            <div className="grid grid-cols-[95px_1fr] gap-x-3 gap-y-0.5 print:gap-y-0.5">

              <p className="font-bold">
                Make
              </p>

              <p>
                {field(quote.make)}{" "}
                {field(quote.model)}
              </p>

              {isNew ? (
                <>
                  <p className="font-bold">
                    Engine Rating
                  </p>

                  <p>
                    {field(
                      quote.engine_rating
                    )}
                  </p>

                  <p className="font-bold">
                    Max Power
                  </p>

                  <p>
                    {field(
                      quote.max_power
                    )}
                  </p>

                  <p className="font-bold">
                    Max Torque
                  </p>

                  <p>
                    {field(
                      quote.max_torque
                    )}
                  </p>

                  <p className="font-bold">
                    Braking
                  </p>

                  <p>
                    {field(
                      quote.braking
                    )}
                  </p>

                  <p className="font-bold">
                    Seating Cap
                  </p>

                  <p>
                    {field(
                      quote.seating_capacity
                    )}
                  </p>

                  <p className="font-bold">
                    Transmission
                  </p>

                  <p>
                    {field(
                      quote.transmission
                    )}
                  </p>

                  <p className="font-bold">
                    Fuel Tank
                  </p>

                  <p>
                    {quote.fuel_tank_litres
                      ? `${quote.fuel_tank_litres} Litres`
                      : "—"}
                  </p>

                  <p className="font-bold">
                    Suspension
                  </p>

                  <p>
                    {field(
                      quote.suspension
                    )}
                  </p>

                  <p className="font-bold">
                    Tyre Size
                  </p>

                  <p>
                    {field(
                      quote.tyre_size
                    )}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold">
                    Chassis No
                  </p>

                  <p>
                    {field(
                      quote.chassis_no
                    )}
                  </p>

                  <p className="font-bold">
                    Mileage
                  </p>

                  <p>
                    {quote.mileage != null
                      ? `${Number(
                          quote.mileage
                        ).toLocaleString()}KMS`
                      : "—"}
                  </p>

                  <p className="font-bold">
                    Manu Year
                  </p>

                  <p>
                    {field(
                      quote.year
                    )}
                  </p>

                  <p className="font-bold">
                    Colour
                  </p>

                  <p>
                    {field(
                      quote.color
                    )}
                  </p>
                </>
              )}

            </div>
          </div>

        </div>


        {/* =====================================================
            LOWER SECTION
            BANK DETAILS LEFT
            PRICE BREAKDOWN RIGHT
        ===================================================== */}

        <div className="grid grid-cols-[44%_56%] gap-3 mt-4 print:gap-2 print:mt-2">

          {/* =================================================
              BANK DETAILS — LEFT
          ================================================= */}

          <div className="text-[11px] print:text-[10px] mt-6 print:mt-5">

            <p className="font-bold mb-1 print:mb-0.5">
              Amounts are payable to:
            </p>

            <p className="mt-2 print:mt-1">
              Bank: {field(quote.bank_name)}
            </p>

            <p>
              Account Name: {field(quote.bank_account_name)}
            </p>

            <p>
              Account No: {field(quote.bank_account_no)}
            </p>

            <p>
              Branch: {field(quote.bank_branch)}
            </p>

          </div>


          {/* =================================================
              PRICE BREAKDOWN — RIGHT
          ================================================= */}

          <div>

            <table className="w-full text-[11px] border-collapse table-fixed print:text-[10px]">

              <colgroup>
                <col style={{ width: "62%" }} />
                <col style={{ width: "38%" }} />
              </colgroup>

              <thead>
                <tr>
                  <th></th>
                  <th className="text-right font-bold pb-1 print:pb-0.5">
                    KES
                  </th>
                </tr>
              </thead>

              <tbody>

                {/* MAIN PRICE */}

                <tr>
                  <td className="py-0.5 print:py-0.5">
                    {isNew
                      ? "Duty Paid Price"
                      : "Unit Price"}
                  </td>

                  <td className="py-0.5 text-right print:py-0.5">
                    {formatMoney(
                      quote.quoted_price
                    )}
                  </td>
                </tr>


                {/* TRADE IN */}

                {quote.trade_in_amount > 0 && (
                  <tr>
                    <td className="py-0.5 print:py-0.5">
                      LESS:{" "}
                      {field(
                        quote.trade_in_reg_no
                      )}
                    </td>

                    <td className="py-0.5 text-right print:py-0.5">
                      -
                      {formatMoney(
                        quote.trade_in_amount
                      )}
                    </td>
                  </tr>
                )}


                {/* ADDITIONAL ITEMS */}

                {(quote.items || []).map(
                  (it) => (
                    <tr key={it.id}>
                      <td className="py-0.5 print:py-0.5">
                        {it.item_name}

                        {it.quantity > 1
                          ? ` (x${it.quantity})`
                          : ""}
                      </td>

                      <td className="py-0.5 text-right print:py-0.5">
                        {formatMoney(
                          Number(it.price) *
                            Number(
                              it.quantity
                            )
                        )}
                      </td>
                    </tr>
                  )
                )}


                {/* VAT */}

                {isNew &&
                  quote.vat_amount > 0 && (
                    <tr>
                      <td className="py-0.5 print:py-0.5">
                        VAT
                      </td>

                      <td className="py-0.5 text-right print:py-0.5 border-b border-black">
                        {formatMoney(
                          quote.vat_amount
                        )}
                      </td>
                    </tr>
                  )}


                {/* SUB TOTAL */}

                {isNew && (
                  <tr className="font-bold">
                    <td className="py-0.5 print:py-0.5">
                      Sub Total
                    </td>

                    <td className="py-0.5 text-right border-b border-black print:py-0.5">
                      {formatMoney(
                        subTotal
                      )}
                    </td>
                  </tr>
                )}


                {/* REGISTRATION */}

                {isNew &&
                  quote.registration_fee >
                    0 && (
                    <tr>
                      <td className="py-0.5 print:py-0.5">
                        Registration
                      </td>

                      <td className="py-0.5 text-right print:py-0.5">
                        {formatMoney(
                          quote.registration_fee
                        )}
                      </td>
                    </tr>
                  )}


                {/* QTY */}

                {isNew && (
                  <tr>
                    <td className="py-0.5 print:py-0.5">
                      Qty
                    </td>

                    <td className="py-0.5 text-right border-b border-black print:py-0.5">
                      1
                    </td>
                  </tr>
                )}


                {/* TOTAL */}

                <tr className="font-bold">
                  <td className="py-0.5 print:py-0.5">
                    Total
                  </td>

                  <td className="py-0.5 text-right border-b border-black print:py-0.5">
                    {formatMoney(
                      quote.total_price
                    )}
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>


        {/* =====================================================
            SIGNATURES
        ===================================================== */}

        <div className="grid grid-cols-2 gap-16 mt-10 text-[11px] print:gap-8 print:mt-4 print:text-[10px]">

          <div>
            <div className="h-8 print:h-4"></div>

            <div className="border-t border-black pt-1 print:pt-0.5">
              <p className="font-bold">
                Sales Manager
              </p>

              <p className="mt-1 print:mt-0.5">
                0721-806026
              </p>

              <p className="font-bold mt-1 print:mt-0.5">
                Edwin Okuku
              </p>
            </div>
          </div>


          <div>
            <div className="h-8 flex items-end print:h-4">
              <span className="font-bold">for:</span>
            </div>

            <div className="border-t border-black pt-1 print:pt-0.5">
              <p className="font-bold">
                Managing Director
              </p>

              <p className="mt-1 print:mt-0.5">
                0722-734878
              </p>

              <p className="font-bold mt-1 print:mt-0.5">
                Benard Kirui
              </p>
            </div>
          </div>

        </div>


        {/* =====================================================
            NOTES
        ===================================================== */}

        <div className="mt-8 text-[9px] text-gray-600 print:mt-3 print:text-[7.5px]">

          <p className="font-bold underline mb-2 print:mb-1">
            NB
          </p>

          <p className="mb-2 print:mb-1">
            The quotation is valid for 30 days only.
          </p>

          <p className="mb-2 print:mb-1">
            The price of this quotation is
            subject to a variation in price
            from source of supply which may
            occur at any stage prior to
            delivery of the vehicle. No
            warranties, representations or
            guarantees are binding on the
            seller unless included herein and
            countersigned by a director.
          </p>

          <p>
            The said unit/units is/are subject
            to availability and thus this
            document is a proposal only.
          </p>

        </div>


        {/* =====================================================
            PRINT INFORMATION
        ===================================================== */}

        <div className="mt-3 flex justify-between text-[9px] text-gray-500 print:mt-1 print:text-[7.5px]">
          <p>
            Printed By:{" "}
            {user?.username || "N/A"}
          </p>

          <p>
            Printed On:{" "}
            {new Date().toLocaleString()}
          </p>
        </div>


        {/* =====================================================
            STATUS
        ===================================================== */}

        <div className="mt-3 print:hidden capture-hide">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 capitalize">
            {quote.status}
          </span>
        </div>


        {/* =====================================================
            ACTION BUTTONS
        ===================================================== */}

        <div className="flex justify-end gap-3 my-3 print:hidden capture-hide">

          <button
            onClick={() => window.print()}
            className="bg-gray-800 text-white px-5 py-2 rounded"
          >
            Print
          </button>

          <button
            onClick={handleDownloadPdf}
            className="bg-blue-800 text-white px-5 py-2 rounded"
          >
            Download PDF
          </button>

          <button
            onClick={handleShare}
            className="bg-emerald-700 text-white px-5 py-2 rounded"
          >
            Share
          </button>

        </div>


        {/* =====================================================
            CONVERT / CANCEL
        ===================================================== */}

        {quote.status === "pending" && (
          <div className="flex justify-end gap-3 my-3 print:hidden capture-hide">

            {hasPermission(
              "sales.invoices.create"
            ) && (
              <button
                onClick={
                  handleConvertToInvoice
                }
                disabled={converting}
                className="bg-green-600 text-white px-5 py-2 rounded disabled:bg-gray-400"
              >
                {converting
                  ? "Converting..."
                  : "Convert To Invoice"}
              </button>
            )}

            <button
              onClick={handleCancel}
              className="bg-red-600 text-white px-5 py-2 rounded"
            >
              Cancel Quote
            </button>

          </div>
        )}

      </div>
    </div>
  );
};

export default QuoteDetails;