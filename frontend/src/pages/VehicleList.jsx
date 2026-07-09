// src/pages/VehicleList.jsx
import React, { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchVehicles = async () => {
    try {
      // expects GET /api/vehicles
      const res = await API.get("/vehicles");
      setVehicles(res.data || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error(err);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold">Vehicles for Sale</h3>
        <div>
          <button onClick={() => navigate("/admin/vehicles/add")} className="bg-green-600 text-white px-4 py-2 rounded">Add Vehicle</button>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Make</th>
              <th className="px-4 py-2 text-left">Model</th>
              <th className="px-4 py-2 text-left">Year</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-4">Loading...</td></tr>
            ) : vehicles.length === 0 ? (
              <tr><td colSpan="7" className="p-4">No vehicles found.</td></tr>
            ) : vehicles.map((v, i) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-2">{i+1}</td>
                <td className="px-4 py-2">{v.make}</td>
                <td className="px-4 py-2">{v.model}</td>
                <td className="px-4 py-2">{v.year}</td>
                <td className="px-4 py-2">{v.price}</td>
                <td className="px-4 py-2">{v.status}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => navigate(`/admin/vehicles/sell/${v.id}`)} className="px-3 py-1 bg-blue-600 text-white rounded">Sell</button>
                  <button onClick={() => navigate(`/admin/vehicles/${v.id}`)} className="px-3 py-1 border rounded">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
