import React, { useState, useEffect } from "react";
import API from "../api/api";

const SalesTransactions = () => {
  const [sales, setSales] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    customer_name: "",
    sale_price: "",
  });
  const [loading, setLoading] = useState(false);

  // ✅ Fetch vehicles (for dropdown)
  const fetchVehicles = async () => {
    try {
      const res = await API.get("/vehicles");
      setVehicles(res.data);
    } catch (error) {
      console.error("❌ Error fetching vehicles:", error);
    }
  };

  // ✅ Fetch sales list
  const fetchSales = async () => {
    try {
      const res = await API.get("/sales");
      setSales(res.data);
    } catch (error) {
      console.error("❌ Error fetching sales:", error);
    }
  };

  // ✅ Handle Sale Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.vehicle_id) {
        alert("Please select a vehicle");
        return;
      }

      setLoading(true);
      await API.post("/sales", formData);
      await fetchSales();
      await fetchVehicles(); // refresh stock after sale

      setFormData({ vehicle_id: "", customer_name: "", sale_price: "" });
    } catch (error) {
      console.error("❌ Error adding sale:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchSales();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">💰 Vehicle Sales</h2>

      {/* Add Sale Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow mb-6"
      >
        <select
          name="vehicle_id"
          value={formData.vehicle_id}
          onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
          className="border p-2 rounded"
          required
        >
          <option value="">Select Vehicle</option>
          {vehicles
            .filter((v) => v.stock_quantity > 0)
            .map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model} ({v.year}) - KES {v.price.toLocaleString()}
              </option>
            ))}
        </select>

        <input
          type="text"
          name="customer_name"
          placeholder="Customer Name"
          value={formData.customer_name}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
          className="border p-2 rounded"
          required
        />

        <input
          type="number"
          name="sale_price"
          placeholder="Sale Price (KES)"
          value={formData.sale_price}
          onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
          className="border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition md:col-span-4 p-2"
          disabled={loading}
        >
          {loading ? "Recording..." : "Record Sale"}
        </button>
      </form>

      {/* Sales List */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-3">Sales Records</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Vehicle</th>
              <th className="p-2 border">Customer</th>
              <th className="p-2 border">Sale Price</th>
              <th className="p-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-2 border">
                  {s.make} {s.model} ({s.year})
                </td>
                <td className="p-2 border">{s.customer_name}</td>
                <td className="p-2 border">KES {s.sale_price.toLocaleString()}</td>
                <td className="p-2 border">
                  {new Date(s.sale_date).toLocaleString()}
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center text-gray-500 p-3">
                  No sales recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTransactions;
