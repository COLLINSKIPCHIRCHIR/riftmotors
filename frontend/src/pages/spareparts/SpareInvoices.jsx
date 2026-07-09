// pages/spareparts/SpareInvoices.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

export default function SpareInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await API.get("/spare-invoices");
        setInvoices(res.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch invoices", err);
        setError("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  if (loading) return <div className="p-6">Loading invoices...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (invoices.length === 0) return <div className="p-6">No invoices found.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-6">Spare Invoices</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Invoice #</th>
            <th className="border p-2">Customer</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Created</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="text-center hover:bg-gray-50">
              <td className="border p-2 font-mono text-sm">{inv.invoice_number}</td>
              <td className="border p-2">{inv.customer_name}</td>
              <td className="border p-2">Ksh {Number(inv.total).toFixed(2)}</td>
              <td className="border p-2 capitalize">{inv.status}</td>
              <td className="border p-2">{new Date(inv.created_at).toLocaleString()}</td>
              <td className="border p-2">
                <button
                  className="text-blue-600 underline"
                  onClick={() => navigate(`/admin/spare-parts/invoices/${inv.id}`)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
