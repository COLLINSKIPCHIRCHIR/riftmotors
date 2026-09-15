import React, { useState, useEffect } from "react";
import API from "../api/api";
import toast from "react-hot-toast";

const AddVehicle = () => {
  const [vehicle, setVehicle] = useState({
    consignor_id: "",
    make: "",
    model: "",
    model_code: "",
    year: "",
    condition: "used",
    catalogOnly: false, // only relevant when condition === "new"
    chassis_no: "",
    engine_no: "",
    registration_no: "",
    mileage: "",
    color: "",
    transmission: "",
    fuel_type: "",
    bestPrice: "",
    sellingPrice: "",
    dutyFreePrice: "",
    dutyPaidPrice: "",
    negotiable: false,
    visible: true,
    description: "",
    stockQuantity: "1",
    engineRating: "",
    maxPower: "",
    maxTorque: "",
    braking: "",
    seatingCapacity: "",
    fuelTankLitres: "",
    suspension: "",
    tyreSize: "",
    warrantyText: "",
    freeServiceText: "",
    images: [],
  });

  const [previewImages, setPreviewImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [consignors, setConsignors] = useState([]);

  const makes = ["Toyota", "Nissan", "Subaru", "Ford", "Mazda", "Isuzu", "GWM", "Suzuki", "Haval", "Ora"];

  useEffect(() => {
    API.get("/consignors").then((res) => setConsignors(res.data));
  }, []);

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
    setVehicle({ ...vehicle, images: files });
    setPreviewImages(files.map((file) => URL.createObjectURL(file)));
  };

  const removeImage = (index) => {
    setVehicle({ ...vehicle, images: vehicle.images.filter((_, i) => i !== index) });
    setPreviewImages(previewImages.filter((_, i) => i !== index));
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
    formData.append("best_price", vehicle.bestPrice);
    formData.append("selling_price", vehicle.sellingPrice);
    formData.append("duty_free_price", vehicle.dutyFreePrice);
    formData.append("duty_paid_price", vehicle.dutyPaidPrice);
    formData.append("is_negotiable", vehicle.negotiable);
    formData.append("visible_in_inventory", vehicle.visible);
    formData.append("description", vehicle.description);
    formData.append("stock_quantity", vehicle.stockQuantity);
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

    vehicle.images.forEach((img) => formData.append("images", img));

    try {
      await API.post("/vehicles/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("✅ Vehicle added successfully!");

      setVehicle({
        consignor_id: "", make: "", model: "", model_code: "", year: "",
        condition: "used", catalogOnly: false, chassis_no: "", engine_no: "",
        registration_no: "", mileage: "", color: "", transmission: "", fuel_type: "",
        bestPrice: "", sellingPrice: "", dutyFreePrice: "", dutyPaidPrice: "",
        negotiable: false, visible: true, description: "", stockQuantity: "1",
        engineRating: "", maxPower: "", maxTorque: "", braking: "",
        seatingCapacity: "", fuelTankLitres: "", suspension: "", tyreSize: "",
        warrantyText: "", freeServiceText: "", images: [],
      });
      setPreviewImages([]);
    } catch (err) {
      console.error("❌ Error adding vehicle:", err);
      toast.error(err.response?.data?.error || "Error adding vehicle!");
    } finally {
      setSaving(false);
    }
  };

  const isNew = vehicle.condition === "new";
  const isCatalogOnly = isNew && vehicle.catalogOnly;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">🚗 Add New Vehicle</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  <strong>Catalog only</strong> — we don't have this physical unit yet, but we can order it (stock starts at 0)
                </span>
              </label>
            )}
          </div>

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
                {makes.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>

              <input name="model" placeholder="Model (e.g. Patrol Y62 LE+)" value={vehicle.model}
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

              {isCatalogOnly && (
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Stock Quantity</label>
                  <input name="stockQuantity" type="number" min="0" value={vehicle.stockQuantity}
                    onChange={handleChange} className="border border-gray-300 rounded-md p-2 w-32" />
                </div>
              )}

              <input name="transmission" placeholder="Transmission (e.g. 7 Speed Automatic)" value={vehicle.transmission}
                onChange={handleChange} className="border border-gray-300 rounded-md p-2" />

              <input name="fuel_type" placeholder="Fuel Type" value={vehicle.fuel_type}
                onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
            </div>
          </div>

          {isNew && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="engineRating" placeholder="Engine Rating (e.g. 5600cc, 8 cyl, 32V, DOHC)"
                  value={vehicle.engineRating} onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="maxPower" placeholder="Max Power (e.g. 400hp/5800rpm)"
                  value={vehicle.maxPower} onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="maxTorque" placeholder="Max Torque (e.g. 560Nm/4000rpm)"
                  value={vehicle.maxTorque} onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="braking" placeholder="Braking (e.g. All Discs, ABS, EBD, VDC)"
                  value={vehicle.braking} onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="seatingCapacity" placeholder="Seating Capacity (e.g. 8 seats)"
                  value={vehicle.seatingCapacity} onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="fuelTankLitres" type="number" placeholder="Fuel Tank (Litres)"
                  value={vehicle.fuelTankLitres} onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="suspension" placeholder="Suspension (e.g. Body Motion Control, Double wishbone)"
                  value={vehicle.suspension} onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="tyreSize" placeholder="Tyre Size (e.g. 265/70R18)"
                  value={vehicle.tyreSize} onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
                <input name="warrantyText" placeholder="Warranty (e.g. 3 year or 100,000kms warranty)"
                  value={vehicle.warrantyText} onChange={handleChange} className="border border-gray-300 rounded-md p-2 md:col-span-2" />
                <input name="freeServiceText" placeholder="Free Service Plan (e.g. 2 year or 50,000kms FREE Service)"
                  value={vehicle.freeServiceText} onChange={handleChange} className="border border-gray-300 rounded-md p-2 md:col-span-2" />
              </div>
            </div>
          )}

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

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Upload Vehicle Images {isNew && <span className="text-sm text-gray-400">(one photo represents this model/color)</span>}
            </h3>
            <input type="file" multiple accept="image/*" onChange={handleImageUpload}
              className="border border-gray-300 rounded-md p-2 w-full" />

            {previewImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previewImages.map((src, index) => (
                  <div key={index} className="relative group">
                    <img src={src} alt={`Preview ${index}`}
                      className="w-full h-32 object-cover rounded-lg border shadow-sm" />
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                    <button type="button" onClick={() => removeImage(index)}
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
            {saving ? "Saving..." : "Add Vehicle"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;