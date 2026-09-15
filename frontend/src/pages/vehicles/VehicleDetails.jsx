import React, { useEffect, useState } from "react";
import API, { API_ORIGIN } from "../../api/api";
import { useParams, useNavigate } from "react-router-dom";
import { hasPermission } from "../../utils/permissions";

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url}`;
};

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    API.get(`/vehicles/${id}`).then((res) => {
      setVehicle(res.data);
      const primary = res.data.images?.find((img) => img.is_primary) || res.data.images?.[0];
      setActiveImage(primary ? resolveImageUrl(primary.image_url) : null);
    });
  }, [id]);

  if (!vehicle) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">
            {vehicle.make} {vehicle.model} ({vehicle.year})
          </h2>
          {vehicle.status === "available" && hasPermission("sales.quotes.create") && (
            <button onClick={() => navigate(`/admin/sales/quotes/create?vehicle_id=${vehicle.id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
              Create Quote
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            {activeImage ? (
              <img src={activeImage} alt={vehicle.model}
                className="w-full h-64 object-cover rounded-lg border mb-3" />
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-3">
                No image
              </div>
            )}
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {vehicle.images.map((img) => (
                  <img key={img.id} src={resolveImageUrl(img.image_url)} alt=""
                    onClick={() => setActiveImage(resolveImageUrl(img.image_url))}
                    className="w-16 h-12 object-cover rounded cursor-pointer border hover:opacity-80" />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="text-sm space-y-2">
            <p><strong>Condition:</strong> <span className="capitalize">{vehicle.condition}</span></p>
            <p><strong>Chassis No.:</strong> {vehicle.chassis_no || "—"}</p>
            <p><strong>Engine No.:</strong> {vehicle.engine_no || "—"}</p>
            <p><strong>Registration No.:</strong> {vehicle.registration_no || "—"}</p>
            <p><strong>Color:</strong> {vehicle.color || "—"}</p>
            <p><strong>Mileage:</strong> {vehicle.mileage ?? "—"} km</p>
            <p><strong>Transmission:</strong> {vehicle.transmission || "—"}</p>
            <p><strong>Fuel Type:</strong> {vehicle.fuel_type || "—"}</p>
            <p><strong>Status:</strong> <span className="capitalize">{vehicle.status}</span></p>
            <p className="border-t pt-2"><strong>Selling Price:</strong> Ksh {Number(vehicle.selling_price).toLocaleString()}</p>
            {vehicle.best_price && <p><strong>Best Price:</strong> Ksh {Number(vehicle.best_price).toLocaleString()}</p>}
            {vehicle.condition === "new" && (
              <>
                {vehicle.duty_free_price && <p><strong>Duty Free Price:</strong> Ksh {Number(vehicle.duty_free_price).toLocaleString()}</p>}
                {vehicle.duty_paid_price && <p><strong>Duty Paid Price:</strong> Ksh {Number(vehicle.duty_paid_price).toLocaleString()}</p>}
              </>
            )}
            {vehicle.description && (
              <p className="border-t pt-2 text-gray-600">{vehicle.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;