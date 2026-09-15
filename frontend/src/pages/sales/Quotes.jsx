import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import { hasPermission } from "../../utils/permissions";

const statusColor = (status) => ({
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  expired: "bg-gray-200 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
}[status] || "bg-gray-100 text-gray-600");

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/sales-quotes")
      .then((res) => setQuotes(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">📋 Sales Quotes</h2>
          {hasPermission("sales.quotes.create") && (
            <button onClick={() => navigate("/admin/sales/quotes/create")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
              + New Quote
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-6">Loading...</p>
        ) : quotes.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No quotes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-2 px-4 text-left">Ref</th>
                  <th className="py-2 px-4 text-left">Vehicle</th>
                  <th className="py-2 px-4 text-left">Customer</th>
                  <th className="py-2 px-4 text-left">Total</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium">{q.quote_ref}</td>
                    <td className="py-2 px-4">{q.make} {q.model} ({q.year})</td>
                    <td className="py-2 px-4">{q.customer_name}</td>
                    <td className="py-2 px-4">Ksh {Number(q.total_price).toLocaleString()}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(q.status)}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-500">
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4">
                      <button onClick={() => navigate(`/admin/sales/quotes/${q.id}`)}
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

export default Quotes;