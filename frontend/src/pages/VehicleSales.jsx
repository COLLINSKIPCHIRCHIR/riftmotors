import React, { useState, useEffect } from "react";
import API from "../api/api";

const VehicleSales = () => {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    price: "",
    stock_quantity: "",
  });
  const [loading, setLoading] = useState(false);

  // ✅ Fetch vehicles from backend
  const fetchVehicles = async () => {
    try {
      const res = await API.get("/vehicles");
      setVehicles(res.data);
    } catch (error) {
      console.error("❌ Error fetching vehicles:", error);
    }
  };

  // ✅ Add new vehicle
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post("/vehicles", formData);
      await fetchVehicles();
      setFormData({
        make: "",
        model: "",
        year: "",
        price: "",
        stock_quantity: "",
      });
    } catch (error) {
      console.error("❌ Error adding vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete a vehicle
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;
    try {
      await API.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (error) {
      console.error("❌ Error deleting vehicle:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">🚗 Vehicle Management</h2>

      {/* Add Vehicle Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded-xl shadow mb-6"
      >
        <input
          type="text"
          name="make"
          placeholder="Make"
          value={formData.make}
          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="model"
          placeholder="Model"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          name="year"
          placeholder="Year"
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price (KES)"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          type="number"
          name="stock_quantity"
          placeholder="Stock"
          value={formData.stock_quantity}
          onChange={(e) =>
            setFormData({ ...formData, stock_quantity: e.target.value })
          }
          className="border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition md:col-span-5 p-2"
          disabled={loading}
        >
          {loading ? "Saving..." : "Add Vehicle"}
        </button>
      </form>

      {/* Vehicle List */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-3">Available Vehicles</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Make</th>
              <th className="p-2 border">Model</th>
              <th className="p-2 border">Year</th>
              <th className="p-2 border">Price (KES)</th>
              <th className="p-2 border">Stock</th>
              <th className="p-2 border text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="p-2 border">{v.make}</td>
                <td className="p-2 border">{v.model}</td>
                <td className="p-2 border">{v.year}</td>
                <td className="p-2 border">{v.price}</td>
                <td className="p-2 border">{v.stock_quantity}</td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 p-3">
                  No vehicles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehicleSales;
