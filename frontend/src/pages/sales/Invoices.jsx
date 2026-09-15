import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";

const paymentColor = (status) => ({
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
}[status] || "bg-gray-100 text-gray-600");

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/sales-invoices")
      .then((res) => setInvoices(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">🧾 Sales Invoices</h2>

        {loading ? (
          <p className="text-gray-500 text-center py-6">Loading...</p>
        ) : invoices.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-2 px-4 text-left">Invoice No.</th>
                  <th className="py-2 px-4 text-left">Vehicle</th>
                  <th className="py-2 px-4 text-left">Customer</th>
                  <th className="py-2 px-4 text-left">Total</th>
                  <th className="py-2 px-4 text-left">Payment</th>
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium">{inv.invoice_no}</td>
                    <td className="py-2 px-4">{inv.make} {inv.model}</td>
                    <td className="py-2 px-4">{inv.customer_name}</td>
                    <td className="py-2 px-4">Ksh {Number(inv.total_amount).toLocaleString()}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentColor(inv.payment_status)}`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-500">
                      {new Date(inv.sale_date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4">
                      <button onClick={() => navigate(`/admin/sales/invoices/${inv.id}`)}
                        className="text-blue-600 hover:underline text-sm">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;