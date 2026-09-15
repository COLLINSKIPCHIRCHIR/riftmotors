import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupplierInvoices } from "../../api/supplierInvoiceApi";
import { FaEye, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  unpaid: "bg-gray-100 text-gray-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const StatusBadge = ({ status }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
      STATUS_STYLES[status] || "bg-gray-100 text-gray-700"
    }`}
  >
    {status?.replace("_", " ")}
  </span>
);

export default function SupplierInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, [statusFilter]);

  const load = async () => {
    try {
      const res = await getSupplierInvoices(statusFilter ? { status: statusFilter } : {});
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Could not load invoices");
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Supplier Invoices</h1>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border p-2 rounded text-sm"
            >
              <option value="">All statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={() => navigate("/admin/spare-parts/supplier-invoices/create")}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
            >
              <FaPlus /> Record Invoice
            </button>
          </div>
        </div>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border text-left">Invoice No.</th>
              <th className="p-3 border text-left">Supplier Ref</th>
              <th className="p-3 border text-left">Supplier</th>
              <th className="p-3 border text-left">LPO</th>
              <th className="p-3 border text-left">Date</th>
              <th className="p-3 border text-left">Total</th>
              <th className="p-3 border text-left">Balance</th>
              <th className="p-3 border text-left">Status</th>
              <th className="p-3 border text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="border p-3 font-medium">{inv.invoice_number}</td>
                <td className="border p-3">{inv.supplier_invoice_number || "-"}</td>
                <td className="border p-3">{inv.supplier_name || "-"}</td>
                <td className="border p-3">{inv.lpo_number || "-"}</td>
                <td className="border p-3">
                  {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : "-"}
                </td>
                <td className="border p-3">KES {Number(inv.total).toFixed(2)}</td>
                <td className="border p-3">KES {Number(inv.balance).toFixed(2)}</td>
                <td className="border p-3">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="border p-3">
                  <button
                    onClick={() => navigate(`/admin/spare-parts/supplier-invoices/${inv.id}`)}
                    className="text-blue-600 flex items-center gap-2"
                  >
                    <FaEye /> View
                  </button>
                </td>
              </tr>
            ))}

            {invoices.length === 0 && (
              <tr>
                <td colSpan={9} className="border p-6 text-center text-gray-400">
                  No supplier invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}