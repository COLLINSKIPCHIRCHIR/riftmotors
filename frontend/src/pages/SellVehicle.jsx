import React, { useState, useEffect } from "react";
import API from "../api/api";

const SellVehicle = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState("");
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await API.get("/vehicles");
        setVehicles(res.data.filter((v) => v.status === "available"));
      } catch (err) {
        console.error("❌ Error fetching vehicles:", err);
      }
    };
    fetchVehicles();
  }, []);

  const handleSell = async (e) => {
    e.preventDefault();
    try {
      await API.post("/sales", { vehicle_id: selected, customer_name: customerName });
      alert("✅ Vehicle sold successfully!");
      setSelected("");
      setCustomerName("");
    } catch (err) {
      console.error("❌ Error processing sale:", err);
      alert("Error selling vehicle!");
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          💰 Sell Vehicle
        </h2>

        <form onSubmit={handleSell} className="space-y-4">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Vehicle</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model} - Ksh {v.price}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition duration-200"
          >
            Confirm Sale
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellVehicle;
