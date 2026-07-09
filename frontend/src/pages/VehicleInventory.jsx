import React, { useEffect, useState } from "react";
import API from "../api/api";

const VehicleInventory = () => {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await API.get("/vehicles");
        setVehicles(res.data);
      } catch (err) {
        console.error("❌ Error fetching vehicles:", err);
      }
    };
    fetchVehicles();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          🚘 Vehicle Inventory
        </h2>

        {vehicles.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No vehicles found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-2 px-4 text-left">Make</th>
                  <th className="py-2 px-4 text-left">Model</th>
                  <th className="py-2 px-4 text-left">Year</th>
                  <th className="py-2 px-4 text-left">Price</th>
                  <th className="py-2 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-gray-100">
                    <td className="py-2 px-4">{v.make}</td>
                    <td className="py-2 px-4">{v.model}</td>
                    <td className="py-2 px-4">{v.year}</td>
                    <td className="py-2 px-4">Ksh {v.price}</td>
                    <td className="py-2 px-4 capitalize text-blue-700 font-medium">
                      {v.status}
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

export default VehicleInventory;
