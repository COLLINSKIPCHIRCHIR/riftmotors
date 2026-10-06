import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API, { API_ORIGIN } from "../api/api";
import toast from "react-hot-toast";

const makes = ["Toyota", "Nissan", "Subaru", "Ford", "Mazda", "Isuzu", "GWM", "Suzuki", "Haval", "Ora"];

const s = (v) => (v === null || v === undefined ? "" : String(v));

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url}`;
};

// Map a DB row (snake_case) to the form state (same shape as AddVehicle)
const toFormState = (v) => {
  const isNew = v.condition === "new";
  const noPhysicalUnit = !v.chassis_no && Number(v.stock_quantity) === 0;
  return {
    consignor_id: s(v.consignor_id),
    make: s(v.make),
    model: s(v.model),
    model_code: s(v.model_code),
    year: s(v.year),
    condition: s(v.condition) || "used",
    catalogOnly: isNew && noPhysicalUnit,
    chassis_no: s(v.chassis_no),
    engine_no: s(v.engine_no),
    registration_no: s(v.registration_no),
    mileage: s(v.mileage),
    color: s(v.color),
    transmission: s(v.transmission),
    fuel_type: s(v.fuel_type),
    status: s(v.status) || "available",
    bestPrice: s(v.best_price),
    sellingPrice: s(v.selling_price),
    dutyFreePrice: s(v.duty_free_price),
    dutyPaidPrice: s(v.duty_paid_price),
    negotiable: !!v.is_negotiable,
    visible: v.visible_in_inventory ?? true,
    description: s(v.description),
    stockQuantity: s(v.stock_quantity ?? 1),
    engineRating: s(v.engine_rating),
    maxPower: s(v.max_power),
    maxTorque: s(v.max_torque),
    braking: s(v.braking),
    seatingCapacity: s(v.seating_capacity),
    fuelTankLitres: s(v.fuel_tank_litres),
    suspension: s(v.suspension),
    tyreSize: s(v.tyre_size),
    warrantyText: s(v.warranty_text),
    freeServiceText: s(v.free_service_text),
    drivetrain: s(v.drivetrain),
    bodyType: s(v.body_type),
    dutyFreePriceExclVat: s(v.duty_free_price_excl_vat),
    dutyPaidPriceExclVat: s(v.duty_paid_price_excl_vat),
    // <input type="month"> needs YYYY-MM
    priceListDate: v.price_list_date ? String(v.price_list_date).slice(0, 7) : "",
  };
};

const EditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [consignors, setConsignors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadVehicle = async () => {
    try {
      const res = await API.get(`/vehicles/${id}`);
      setVehicle(toFormState(res.data));
      setExistingImages(res.data.images || []);
    } catch (err) {
      console.error("❌ Error loading vehicle:", err);
      toast.error(err.response?.data?.error || "Could not load vehicle");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicle();
    API.get("/consignors").then((res) => setConsignors(res.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVehicle({ ...vehicle, [name]: type === "checkbox" ? checked : value });
  };

  const handleConditionChange = (e) => {
    const condition = e.target.value;
    setVehicle({
      ...vehicle,
      condition,
      catalogOnly: false,
      stockQuantity: condition === "new" ? vehicle.stockQuantity : "1",
    });
  };

  const handleCatalogToggle = (e) => {
    const catalogOnly = e.target.checked;
    setVehicle({
      ...vehicle,
      catalogOnly,
      stockQuantity: catalogOnly ? "0" : "1",
      chassis_no: catalogOnly ? "" : vehicle.chassis_no,
      engine_no: catalogOnly ? "" : vehicle.engine_no,
      registration_no: catalogOnly ? "" : vehicle.registration_no,
      mileage: catalogOnly ? "" : vehicle.mileage,
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);
    setNewPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewPreviews(newPreviews.filter((_, i) => i !== index));
  };

  const deleteExistingImage = async (imageId) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await API.delete(`/vehicles/${id}/images/${imageId}`);
      setExistingImages((imgs) => imgs.filter((i) => i.id !== imageId));
      toast.success("Image deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not delete image");
    }
  };

  const makePrimary = async (imageId) => {
    try {
      await API.patch(`/vehicles/${id}/images/${imageId}/primary`);
      setExistingImages((imgs) =>
        imgs.map((i) => ({ ...i, is_primary: i.id === imageId }))
      );
      toast.success("Primary image updated");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not set primary image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append("consignor_id", vehicle.consignor_id);
    formData.append("make", vehicle.make);
    formData.append("model", vehicle.model);
    formData.append("model_code", vehicle.model_code);
    formData.append("year", vehicle.year);
    formData.append("condition", vehicle.condition);
    formData.append("chassis_no", vehicle.chassis_no);
    formData.append("engine_no", vehicle.engine_no);
    formData.append("registration_no", vehicle.registration_no);
    formData.append("mileage", vehicle.mileage);
    formData.append("color", vehicle.color);
    formData.append("transmission", vehicle.transmission);
    formData.append("fuel_type", vehicle.fuel_type);
    // status must be sent: the update query overwrites it (defaults to "available")
    formData.append("status", vehicle.status);
    formData.append("best_price", vehicle.bestPrice);
    formData.append("selling_price", vehicle.sellingPrice);
    formData.append("duty_free_price", vehicle.dutyFreePrice);
    formData.append("duty_paid_price", vehicle.dutyPaidPrice);
    formData.append("is_negotiable", vehicle.negotiable);
    formData.append("visible_in_inventory", vehicle.visible);
    formData.append("description", vehicle.description);
    formData.append("stock_quantity", vehicle.stockQuantity === "" ? "0" : vehicle.stockQuantity);
    formData.append("engine_rating", vehicle.engineRating);
    formData.append("max_power", vehicle.maxPower);
    formData.append("max_torque", vehicle.maxTorque);
    formData.append("braking", vehicle.braking);
    formData.append("seating_capacity", vehicle.seatingCapacity);
    formData.append("fuel_tank_litres", vehicle.fuelTankLitres);
    formData.append("suspension", vehicle.suspension);
    formData.append("tyre_size", vehicle.tyreSize);
    formData.append("warranty_text", vehicle.warrantyText);
    formData.append("free_service_text", vehicle.freeServiceText);
    formData.append("drivetrain", vehicle.drivetrain);
    formData.append("body_type", vehicle.bodyType);
    formData.append("duty_free_price_excl_vat", vehicle.dutyFreePriceExclVat);
    formData.append("duty_paid_price_excl_vat", vehicle.dutyPaidPriceExclVat);
    formData.append("price_list_date", vehicle.priceListDate ? `${vehicle.priceListDate}-01` : "");

    newImages.forEach((img) => formData.append("images", img));

    try {
      await API.put(`/vehicles/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("✅ Vehicle updated successfully!");
      navigate("/admin/vehicles");
    } catch (err) {
      console.error("❌ Error updating vehicle:", err);
      toast.error(err.response?.data?.error || "Error updating vehicle!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500 text-center py-12">Loading...</p>;
  if (!vehicle) return <p className="text-gray-500 text-center py-12">Vehicle not found.</p>;

  const isNew = vehicle.condition === "new";
  const isCatalogOnly = isNew && vehicle.catalogOnly;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">✏️ Edit Vehicle</h2>
          <button type="button" onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:underline">
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Condition */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Condition</h3>
            <div className="flex gap-4">
              {["used", "new"].map((c) => (
                <label key={c} className="flex items-center gap-2">
                  <input type="radio" name="condition" value={c}
                    checked={vehicle.condition === c} onChange={handleConditionChange} />
                  <span className="capitalize">{c === "new" ? "New / Zero Mileage" : "Used"}</span>
                </label>
              ))}
            </div>

            {isNew && (
              <label className="flex items-center gap-2 mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                <input type="checkbox" checked={vehicle.catalogOnly} onChange={handleCatalogToggle} />
                <span className="text-sm">
                  <strong>Catalog only</strong> — we don't have this physical unit yet, but we can order it
                </span>
              </label>
            )}
          </div>

          {/* Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select name="consignor_id" value={vehicle.consignor_id} onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500" required>
                <option value="">Select Consignor</option>
                {consignors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select name="make" value={vehicle.make} onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500" required>
                <option value="">Select Make</option>
                {/* keep the current make selectable even if it isn't in the list */}
                {[...new Set([...makes, vehicle.make].filter(Boolean))].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <input name="model" placeholder="Model" value={vehicle.model}
                onChange={handleChange} className="border border-gray-300 rounded-md p-2" required />
              <input name="model_code" placeholder="Model Code" value={vehicle.model_code}
                onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
              <input name="year" placeholder="Year" type="number" value={vehicle.year}
                onChange={handleChange} className="border border-gray-300 rounded-md p-2" required />
              <input name="color" placeholder="Color" value={vehicle.color}
                onChange={handleChange} className="border border-gray-300 rounded-md p-2" />

              {!isCatalogOnly && (
                <>
                  <input name="chassis_no" placeholder="Chassis / VIN No." value={vehicle.chassis_no}
                    onChange={handleChange} className="border border-gray-300 rounded-md p-2" required />
                  <input name="engine_no" placeholder="Engine No." value={vehicle.engine_no}
                    onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                  <input name="registration_no" placeholder="Registration No. (or PRE-REG)" value={vehicle.registration_no}
                    onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                  <input name="mileage" placeholder={isNew ? "Mileage (0 for new)" : "Mileage (km)"} type="number"
                    value={vehicle.mileage} onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                </>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">Stock Quantity</label>
                <input name="stockQuantity" type="number" min="0" value={vehicle.stockQuantity}
                  onChange={handleChange} className="border border-gray-300 rounded-md p-2 w-32" />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select name="status" value={vehicle.status} onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 w-full">
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              <input name="transmission" placeholder="Transmission" value={vehicle.transmission}
                onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
              <input name="fuel_type" placeholder="Fuel Type" value={vehicle.fuel_type}
                onChange={handleChange} className="border border-gray-300 rounded-md p-2" />

              <select name="drivetrain" value={vehicle.drivetrain} onChange={handleChange}
                className="border border-gray-300 rounded-md p-2">
                <option value="">Select Drivetrain</option>
                <option value="2WD">2WD</option>
                <option value="4WD">4WD</option>
                <option value="AWD">AWD</option>
              </select>

              <input name="bodyType" placeholder="Body/Cab Type (e.g. D-Cab, S-Cab, Wagon)"
                value={vehicle.bodyType} onChange={handleChange}
                className="border border-gray-300 rounded-md p-2" />
            </div>
          </div>

          {/* Specs (new vehicles) */}
          {isNew && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="engineRating" placeholder="Engine Rating" value={vehicle.engineRating}
                  onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="maxPower" placeholder="Max Power" value={vehicle.maxPower}
                  onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="maxTorque" placeholder="Max Torque" value={vehicle.maxTorque}
                  onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="braking" placeholder="Braking" value={vehicle.braking}
                  onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="seatingCapacity" placeholder="Seating Capacity" value={vehicle.seatingCapacity}
                  onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="fuelTankLitres" type="number" placeholder="Fuel Tank (Litres)" value={vehicle.fuelTankLitres}
                  onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="suspension" placeholder="Suspension" value={vehicle.suspension}
                  onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="tyreSize" placeholder="Tyre Size" value={vehicle.tyreSize}
                  onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="warrantyText" placeholder="Warranty" value={vehicle.warrantyText}
                  onChange={handleChange} className="border border-gray-300 rounded-md p-2 md:col-span-2" />
                <input name="freeServiceText" placeholder="Free Service Plan" value={vehicle.freeServiceText}
                  onChange={handleChange} className="border border-gray-300 rounded-md p-2 md:col-span-2" />
              </div>
            </div>
          )}

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pricing Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="sellingPrice" type="number" placeholder="Selling / List Price (KES)"
                value={vehicle.sellingPrice} onChange={handleChange}
                className="border border-gray-300 rounded-md p-2" required />
              <input name="bestPrice" type="number" placeholder="Best Price (KES)"
                value={vehicle.bestPrice} onChange={handleChange}
                className="border border-gray-300 rounded-md p-2" />

              {isNew && (
                <>
                  <input name="dutyFreePrice" type="number" placeholder="Duty Free Price (KES)"
                    value={vehicle.dutyFreePrice} onChange={handleChange}
                    className="border border-gray-300 rounded-md p-2" />
                  <input name="dutyPaidPrice" type="number" placeholder="Duty Paid Price (KES)"
                    value={vehicle.dutyPaidPrice} onChange={handleChange}
                    className="border border-gray-300 rounded-md p-2" />
                  <input name="dutyFreePriceExclVat" type="number" placeholder="Duty Free Price excl. VAT (KES)"
                    value={vehicle.dutyFreePriceExclVat} onChange={handleChange}
                    className="border border-gray-300 rounded-md p-2" />
                  <input name="dutyPaidPriceExclVat" type="number" placeholder="Duty Paid Price excl. VAT (KES)"
                    value={vehicle.dutyPaidPriceExclVat} onChange={handleChange}
                    className="border border-gray-300 rounded-md p-2" />
                  <input name="priceListDate" type="month" value={vehicle.priceListDate}
                    onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                </>
              )}
            </div>

            <label className="flex items-center mt-3">
              <input type="checkbox" name="negotiable" checked={vehicle.negotiable}
                onChange={handleChange} className="mr-2" />
              Price is negotiable
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input type="checkbox" name="visible" checked={vehicle.visible}
                onChange={handleChange} className="mr-2" />
              Visible in Inventory
            </label>
          </div>

          <div>
            <textarea name="description" placeholder="Description / Notes" value={vehicle.description}
              onChange={handleChange} rows={3}
              className="border border-gray-300 rounded-md p-2 w-full" />
          </div>

          {/* Images */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Images</h3>
            {existingImages.length === 0 ? (
              <p className="text-sm text-gray-400">No images yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img src={resolveImageUrl(img.image_url)} alt=""
                      className="w-full h-32 object-cover rounded-lg border shadow-sm" />
                    {img.is_primary ? (
                      <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Primary
                      </span>
                    ) : (
                      <button type="button" onClick={() => makePrimary(img.id)}
                        className="absolute bottom-1 left-1 bg-white/90 text-blue-700 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                        Make primary
                      </button>
                    )}
                    <button type="button" onClick={() => deleteExistingImage(img.id)}
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Add More Images</h3>
            <input type="file" multiple accept="image/*" onChange={handleImageUpload}
              className="border border-gray-300 rounded-md p-2 w-full" />

            {newPreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {newPreviews.map((src, index) => (
                  <div key={index} className="relative group">
                    <img src={src} alt={`New ${index}`}
                      className="w-full h-32 object-cover rounded-lg border shadow-sm" />
                    <button type="button" onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition duration-200 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditVehicle;