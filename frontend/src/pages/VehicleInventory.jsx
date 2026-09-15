import React, { useEffect, useState } from "react";
import API, { API_ORIGIN } from "../api/api";
import { useNavigate } from "react-router-dom";
import { hasPermission } from "../utils/permissions";

const VehicleInventory = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | new | used
  const navigate = useNavigate();

  const fetchVehicles = async () => {
    try {
      const res = await API.get("/vehicles");
      setVehicles(res.data);
    } catch (err) {
      console.error("❌ Error fetching vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const filtered = vehicles.filter((v) => filter === "all" || v.condition === filter);

  const statusColor = (status) => ({
    available: "bg-green-100 text-green-700",
    reserved: "bg-yellow-100 text-yellow-700",
    sold: "bg-gray-200 text-gray-600",
  }[status] || "bg-gray-100 text-gray-600");

  const resolveImageUrl = (url) => {
    if (!url) return null;
    // Already absolute (e.g. external URL) — use as-is
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_ORIGIN}${url}`;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">🚘 Vehicle Inventory</h2>
          <div className="flex items-center gap-3">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
              className="border rounded-md p-2 text-sm">
              <option value="all">All</option>
              <option value="new">New / Zero Mileage</option>
              <option value="used">Used</option>
            </select>
            {hasPermission("vehicles.create") && (
              <button onClick={() => navigate("/admin/vehicles/add")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                + Add Vehicle
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-6">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No vehicles found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-2 px-4 text-left">Photo</th>
                  <th className="py-2 px-4 text-left">Make / Model</th>
                  <th className="py-2 px-4 text-left">Condition</th>
                  <th className="py-2 px-4 text-left">Chassis No.</th>
                  <th className="py-2 px-4 text-left">Year</th>
                  <th className="py-2 px-4 text-left">Price</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const primaryImg = v.images?.find((img) => img.is_primary) || v.images?.[0];
                  const imgSrc = resolveImageUrl(primaryImg?.image_url);
                  return (
                    <tr key={v.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">
                        {imgSrc ? (
                          <img src={imgSrc} alt={v.model}
                            className="w-16 h-12 object-cover rounded"
                            onError={(e) => { e.target.style.display = "none"; }} />
                        ) : (
                          <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-4">{v.make} {v.model}</td>
                      <td className="py-2 px-4 capitalize">{v.condition}</td>
                      <td className="py-2 px-4 text-xs text-gray-500">{v.chassis_no || "—"}</td>
                      <td className="py-2 px-4">{v.year}</td>
                      <td className="py-2 px-4">Ksh {Number(v.selling_price).toLocaleString()}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(v.status)}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 space-x-2">
                        {v.status === "available" && hasPermission("sales.quotes.create") && (
                          <button onClick={() => navigate(`/admin/sales/quotes/create?vehicle_id=${v.id}`)}
                            className="text-blue-600 hover:underline text-sm">
                            Quote
                          </button>
                        )}
                        <button onClick={() => navigate(`/admin/vehicles/${v.id}`)}
                          className="text-gray-600 hover:underline text-sm">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleInventory;