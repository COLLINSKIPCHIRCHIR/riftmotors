import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSupplierInvoice, cancelSupplierInvoice } from "../../api/supplierInvoiceApi";
import toast from "react-hot-toast";

const STATUS_LABELS = {
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  cancelled: "Cancelled",
};

export default function SupplierInvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const res = await getSupplierInvoice(id);
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Could not load this invoice");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this invoice? This frees up its quantities to be re-invoiced.")) return;
    try {
      await cancelSupplierInvoice(id);
      toast.success("Invoice cancelled.");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel invoice");
    }
  };

  if (!data || !data.invoice) return <div className="p-6">Loading invoice...</div>;

  const { invoice, items, payments } = data;
  const balance = Number(invoice.total) - Number(invoice.amount_paid);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-gray-500 text-sm">
              {invoice.supplier_name} {invoice.lpo_number && `— against ${invoice.lpo_number}`}
            </p>
            {invoice.supplier_invoice_number && (
              <p className="text-gray-400 text-xs mt-1">Supplier ref: {invoice.supplier_invoice_number}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 capitalize">
              {STATUS_LABELS[invoice.status] || invoice.status}
            </span>
            <div className="flex gap-2">
              {invoice.status !== "cancelled" && balance > 0 && (
                <button
                  onClick={() =>
                    navigate(`/admin/spare-parts/supplier-payments/create?supplier_id=${invoice.supplier_id}`)
                  }
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm"
                >
                  Pay
                </button>
              )}
              {invoice.status === "unpaid" && Number(invoice.amount_paid) === 0 && (
                <button onClick={handleCancel} className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <table className="w-full border text-sm mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">Part</th>
              <th className="p-2 border">Qty</th>
              <th className="p-2 border">Unit Cost</th>
              <th className="p-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td className="border p-2">
                  {it.sparepart_name}
                  {it.part_number ? ` - ${it.part_number}` : ""}
                </td>
                <td className="border p-2 text-center">{it.quantity}</td>
                <td className="border p-2 text-right">{Number(it.unit_cost).toFixed(2)}</td>
                <td className="border p-2 text-right">{Number(it.total_cost).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <table className="text-sm w-64">
            <tbody>
              <tr>
                <td className="py-1">Subtotal</td>
                <td className="py-1 text-right">KES {Number(invoice.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1">VAT ({Number(invoice.tax_rate)}%)</td>
                <td className="py-1 text-right">KES {Number(invoice.tax_amount).toFixed(2)}</td>
              </tr>
              <tr className="font-bold">
                <td className="py-1">Total</td>
                <td className="py-1 text-right">KES {Number(invoice.total).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1">Paid</td>
                <td className="py-1 text-right">KES {Number(invoice.amount_paid).toFixed(2)}</td>
              </tr>
              <tr className="font-bold">
                <td className="py-1">Balance</td>
                <td className="py-1 text-right">KES {balance.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {invoice.notes && <p className="text-sm text-gray-500 mt-4">Notes: {invoice.notes}</p>}
      </div>

      {payments.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Payments Applied</h2>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">Date</th>
                <th className="p-2 border text-left">Method</th>
                <th className="p-2 border text-left">Reference</th>
                <th className="p-2 border text-left">Recorded By</th>
                <th className="p-2 border text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i}>
                  <td className="border p-2">{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td className="border p-2 capitalize">{p.payment_method?.replace("_", " ") || "-"}</td>
                  <td className="border p-2">{p.reference_number || "-"}</td>
                  <td className="border p-2">{p.recorded_by_name || "-"}</td>
                  <td className="border p-2 text-right">KES {Number(p.amount_allocated).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}