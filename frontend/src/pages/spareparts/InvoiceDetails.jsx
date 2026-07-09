// pages/spareparts/InvoiceDetails.jsx

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");

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

  const handlePrint = () => {
    window.print();
  };

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

  if (loading) return <div className="p-6">Loading...</div>;
  if (!invoice) return <div className="p-6">Invoice not found</div>;




  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* ACTION BUTTONS */}
      <div className="max-w-5xl mx-auto mb-4 flex gap-3">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Print Invoice
        </button>

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
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Pay Invoice
            </button>
          </>
        )}
      </div>

      {/* PRINT AREA */}
      <div
      ref={printRef}
      className="
      max-w-5xl
      mx-auto
      bg-white
      shadow-xl
      rounded-xl
      p-10
      print-document
      "
      >
        {/* HEADER */}
        <div
        className="
        flex
        justify-between
        border-b
        pb-6
        "
        >


        <div>


        <img

        src="/rmotologo.jpg"

        className="w-44 h-32 object-contain"

        />


        <p>
        Rift Motors
        </p>


        <p>
        Nakuru, Kenya
        </p>


        <p>
        Phone: +254712345678
        </p>


        </div>




        <div className="text-right">


        <h2
        className="
        text-3xl
        font-bold
        text-blue-700
        "
        >

        INVOICE

        </h2>


        <p className="mt-3">

        Invoice No:

        <b>
        {invoice.invoice_number}
        </b>

        </p>


        <p>

        Date:

        {
        new Date(invoice.created_at)
        .toLocaleDateString()

        }

        </p>


        <p>

        Status:

        <span className="
        ml-2
        bg-green-100
        text-green-700
        px-3
        py-1
        rounded-full
        ">

        {invoice.status}

        </span>


        </p>


        </div>



        </div>



        {/* CUSTOMER */}
        <div className="grid grid-cols-2 mt-8">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Bill To</h3>
          <p className="font-semibold text-slate-800">{invoice.customer_name}</p>
          <p className="text-slate-500 text-sm">{invoice.customer_phone}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Served By</h3>
          <p className="font-semibold text-slate-800">{user?.username || "Staff"}</p>
          <p className="text-slate-500 text-sm capitalize">{user?.role || "cashier"}</p>
        </div>
      </div>

        {/* ITEMS TABLE */}
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Spare Part</th>
              <th className="p-3">Part No</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Unit Price</th>
              <th className="p-3 ">Total</th>
            </tr>
          </thead>

          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td className="border p-2 text-center">
                  {index + 1}
                </td>

                <td className="border p-2">
                  {item.name}
                </td>

                <td className="border p-2 text-center">
                  {item.part_number || "-"}
                </td>

                <td className="border p-2 text-center">
                  {item.quantity}
                </td>

                <td className="border p-2 text-right">
                  {Number(item.unit_price).toFixed(2)}
                </td>

                <td className="border p-2 text-right">
                  {Number(item.total_price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <div className="flex justify-end mt-8">
          <div className="w-72">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Ksh {Number(invoice.subtotal).toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
          <span>Discount:</span>

          <span>
          Ksh {Number(invoice.discount).toFixed(2)}
          </span>

          </div>



          <div className="flex justify-between">

          <span>
          VAT ({invoice.tax_rate}%):
          </span>


          <span>
          Ksh {Number(invoice.tax_amount).toFixed(2)}
          </span>


          </div>



          <div className="flex justify-between font-bold text-lg border-t mt-2 pt-2">

          <span>
          Total:
          </span>


          <span>
          Ksh {Number(invoice.total).toFixed(2)}
          </span>


          </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-10 text-center text-sm text-gray-500">
          Thank you for choosing Rift Motors.
        </div>
      </div>

      {/* PRINT STYLE */}
      <style>
        {`
          @media print {
            body {
              background: white;
            }

            button, select {
              display: none;
            }
          }
        `}
      </style>

    </div>
  );
}
