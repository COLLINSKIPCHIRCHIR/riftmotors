import React, { useEffect, useState } from "react";
import { getPurchases } from "../../api/purchaseApi";
import { useNavigate } from "react-router-dom";
import { FaEye, FaPlus } from "react-icons/fa";

// Same status set as the DB CHECK constraint on spare_purchases.status —
// keep these two in sync if the lifecycle ever changes.
const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  partially_received: "bg-amber-100 text-amber-700",
  received: "bg-green-100 text-green-700",
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

export default function PurchaseList() {
  const [purchases, setPurchases] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, [statusFilter]);

  const load = async () => {
    try {
      const res = await getPurchases(statusFilter || undefined);
      setPurchases(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Purchase Orders (LPO)</h1>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border p-2 rounded text-sm"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partially_received">Partially Received</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={() => navigate("/admin/spare-parts/purchases/create")}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
            >
              <FaPlus /> New LPO
            </button>
          </div>
        </div>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border text-left">LPO No.</th>
              <th className="p-3 border text-left">Supplier</th>
              <th className="p-3 border text-left">Order Date</th>
              <th className="p-3 border text-left">Total</th>
              <th className="p-3 border text-left">Status</th>
              <th className="p-3 border text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id}>
                <td className="border p-3 font-medium">{p.lpo_number || `PO-${p.id}`}</td>
                <td className="border p-3">{p.supplier_name || "-"}</td>
                <td className="border p-3">
                  {p.order_date ? new Date(p.order_date).toLocaleDateString() : "-"}
                </td>
                <td className="border p-3">KES {Number(p.total).toFixed(2)}</td>
                <td className="border p-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="border p-3">
                  <button
                    onClick={() => navigate(`/admin/spare-parts/purchases/${p.id}`)}
                    className="text-blue-600 flex items-center gap-2"
                  >
                    <FaEye /> View
                  </button>
                </td>
              </tr>
            ))}

            {purchases.length === 0 && (
              <tr>
                <td colSpan={6} className="border p-6 text-center text-gray-400">
                  No purchase orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}