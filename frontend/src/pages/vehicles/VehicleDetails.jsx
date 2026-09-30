import React, { useEffect, useState } from "react";
import API, { API_ORIGIN } from "../../api/api";
import { useParams, useNavigate } from "react-router-dom";
import { hasPermission } from "../../utils/permissions";

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url}`;
};

const fmt = (n) => (n === null || n === undefined || n === "" ? "—" : `Ksh ${Number(n).toLocaleString()}`);
const val = (v, suffix = "") => (v === null || v === undefined || v === "" ? "—" : `${v}${suffix}`);

const statusColor = (status) => ({
  available: "bg-green-100 text-green-700",
  reserved: "bg-yellow-100 text-yellow-700",
  sold: "bg-gray-200 text-gray-600",
}[status] || "bg-gray-100 text-gray-600");

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">
      {title}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
      {children}
    </div>
  </div>
);

const Row = ({ label, children }) => (
  <p className="flex justify-between border-b border-dashed border-gray-100 py-1">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800 text-right">{children}</span>
  </p>
);

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

  const isNew = vehicle.condition === "new";

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6 border-b pb-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}
            </h2>
            {vehicle.model_code && (
              <p className="text-xs text-gray-400 mt-1">Model Code: {vehicle.model_code}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(vehicle.status)}`}>
              {vehicle.status}
            </span>
            {vehicle.status === "available" && hasPermission("sales.quotes.create") && (
              <button onClick={() => navigate(`/admin/sales/quotes/create?vehicle_id=${vehicle.id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                Create Quote
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
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
                    className={`w-16 h-12 object-cover rounded cursor-pointer border hover:opacity-80 ${
                      resolveImageUrl(img.image_url) === activeImage ? "ring-2 ring-blue-500" : ""
                    }`} />
                ))}
              </div>
            )}
          </div>

          {/* Identification + status */}
          <div>
            <Section title="Identification">
              <Row label="Condition"><span className="capitalize">{vehicle.condition}</span></Row>
              <Row label="Chassis / VIN">{val(vehicle.chassis_no)}</Row>
              <Row label="Engine No.">{val(vehicle.engine_no)}</Row>
              <Row label="Registration No.">{val(vehicle.registration_no)}</Row>
              <Row label="Color">{val(vehicle.color)}</Row>
              <Row label="Mileage">{vehicle.mileage != null ? `${Number(vehicle.mileage).toLocaleString()} km` : "—"}</Row>
              <Row label="Transmission">{val(vehicle.transmission)}</Row>
              <Row label="Drivetrain">{val(vehicle.drivetrain)}</Row>
              <Row label="Body / Cab Type">{val(vehicle.body_type)}</Row>
              <Row label="Fuel Type">{val(vehicle.fuel_type)}</Row>
              <Row label="Stock Quantity">{val(vehicle.stock_quantity)}</Row>
            </Section>
          </div>
        </div>

        {/* Pricing */}
        <Section title="Pricing">
          <Row label="Selling / List Price">{fmt(vehicle.selling_price)}</Row>
          <Row label="Best Price">{fmt(vehicle.best_price)}</Row>
          <Row label="Negotiable">{vehicle.is_negotiable ? "Yes" : "No"}</Row>
          <Row label="Visible in Inventory">{vehicle.visible_in_inventory ? "Yes" : "No"}</Row>
          {isNew && (
            <>
              <Row label="Duty Free (excl. VAT)">{fmt(vehicle.duty_free_price_excl_vat)}</Row>
              <Row label="Duty Free (incl. VAT)">{fmt(vehicle.duty_free_price)}</Row>
              <Row label="Duty Paid (excl. VAT)">{fmt(vehicle.duty_paid_price_excl_vat)}</Row>
              <Row label="Duty Paid (incl. VAT)">{fmt(vehicle.duty_paid_price)}</Row>
              <Row label="Price List Date">{val(vehicle.price_list_date)}</Row>
            </>
          )}
        </Section>

        {/* Technical specs — new vehicles */}
        {isNew && (
          <Section title="Technical Specifications">
            <Row label="Engine Rating">{val(vehicle.engine_rating)}</Row>
            <Row label="Max Power">{val(vehicle.max_power)}</Row>
            <Row label="Max Torque">{val(vehicle.max_torque)}</Row>
            <Row label="Braking">{val(vehicle.braking)}</Row>
            <Row label="Seating Capacity">{val(vehicle.seating_capacity)}</Row>
            <Row label="Fuel Tank">{val(vehicle.fuel_tank_litres, " L")}</Row>
            <Row label="Suspension">{val(vehicle.suspension)}</Row>
            <Row label="Tyre Size">{val(vehicle.tyre_size)}</Row>
          </Section>
        )}

        {/* Warranty — new vehicles */}
        {isNew && (vehicle.warranty_text || vehicle.free_service_text) && (
          <Section title="Warranty & Service">
            <Row label="Warranty">{val(vehicle.warranty_text)}</Row>
            <Row label="Free Service Plan">{val(vehicle.free_service_text)}</Row>
          </Section>
        )}

        {/* Description */}
        {vehicle.description && (
          <Section title="Description / Notes">
            <p className="col-span-2 text-gray-600 whitespace-pre-wrap">{vehicle.description}</p>
          </Section>
        )}
      </div>
    </div>
  );
};

export default VehicleDetails;