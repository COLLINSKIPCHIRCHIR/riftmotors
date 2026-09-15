import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";

const DeliveryNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/delivery-notes")
      .then((res) => setNotes(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">🚚 Delivery Notes</h2>

        {loading ? (
          <p className="text-gray-500 text-center py-6">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No delivery notes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-2 px-4 text-left">Invoice No.</th>
                  <th className="py-2 px-4 text-left">Vehicle</th>
                  <th className="py-2 px-4 text-left">Customer</th>
                  <th className="py-2 px-4 text-left">Mileage</th>
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {notes.map((n) => (
                  <tr key={n.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium">{n.invoice_no}</td>
                    <td className="py-2 px-4">{n.make} {n.model} — {n.chassis_no}</td>
                    <td className="py-2 px-4">{n.customer_name}</td>
                    <td className="py-2 px-4">{n.mileage_on_delivery ?? "—"} km</td>
                    <td className="py-2 px-4 text-sm text-gray-500">
                      {new Date(n.delivery_date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4">
                      <button onClick={() => navigate(`/admin/sales/delivery-notes/${n.id}`)}
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

export default DeliveryNotes;