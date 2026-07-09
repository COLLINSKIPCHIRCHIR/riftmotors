import React, { useState } from "react";
import API from "../api/api";

const AddVehicle = () => {
  const [vehicle, setVehicle] = useState({
    consignor: "",
    make: "",
    model: "",
    year: "",
    bestPrice: "",
    sellingPrice: "",
    negotiable: false,
    highlight: false,
    visible: true,
    images: [],
  });

  const [previewImages, setPreviewImages] = useState([]); // ✅ image preview URLs

  const consignors = ["Rift Motors Ltd", "Nissan Kenya", "Subaru Kenya", "Ford Kenya"];
  const makes = ["Toyota", "Nissan", "Subaru", "Ford", "Mazda", "Isuzu"];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVehicle({ ...vehicle, [name]: type === "checkbox" ? checked : value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setVehicle({ ...vehicle, images: files });

    // ✅ Create preview URLs
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const removeImage = (index) => {
    const updatedImages = vehicle.images.filter((_, i) => i !== index);
    const updatedPreviews = previewImages.filter((_, i) => i !== index);
    setVehicle({ ...vehicle, images: updatedImages });
    setPreviewImages(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("make", vehicle.make);
    formData.append("model", vehicle.model);
    formData.append("selling_price", vehicle.sellingPrice);
    formData.append("best_price", vehicle.bestPrice);
    formData.append("consignor", vehicle.consignor);
    formData.append("year", vehicle.year);
    formData.append("negotiable", vehicle.negotiable);
    formData.append("highlight", vehicle.highlight);
    formData.append("visible", vehicle.visible);

    vehicle.images.forEach((img) => formData.append("images", img));

    try {
      const res = await API.post("/vehicles/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Vehicle added successfully!");
      console.log(res.data);

      // Reset form
      setVehicle({
        consignor: "",
        make: "",
        model: "",
        year: "",
        bestPrice: "",
        sellingPrice: "",
        negotiable: false,
        highlight: false,
        visible: true,
        images: [],
      });
      setPreviewImages([]);
    } catch (err) {
      console.error("❌ Error adding vehicle:", err);
      alert("Error adding vehicle!");
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          🚗 Add New Vehicle
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="consignor"
                value={vehicle.consignor}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Consignor</option>
                {consignors.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>

              <select
                name="make"
                value={vehicle.make}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Make</option>
                {makes.map((m, i) => (
                  <option key={i} value={m}>{m}</option>
                ))}
              </select>

              <input
                name="model"
                placeholder="Model (e.g. Forester)"
                value={vehicle.model}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                required
              />

              <input
                name="year"
                placeholder="Year"
                type="number"
                value={vehicle.year}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pricing Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="bestPrice"
                type="number"
                placeholder="Best Price (KES)"
                value={vehicle.bestPrice}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                name="sellingPrice"
                type="number"
                placeholder="Selling Price (KES)"
                value={vehicle.sellingPrice}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                name="negotiable"
                checked={vehicle.negotiable}
                onChange={handleChange}
                className="mr-2"
              />
              Price is negotiable
            </label>
          </div>

          {/* Visibility */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Visibility</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="visible"
                checked={vehicle.visible}
                onChange={handleChange}
                className="mr-2"
              />
              Visible in Inventory
            </label>

            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                name="highlight"
                checked={vehicle.highlight}
                onChange={handleChange}
                className="mr-2"
              />
              Highlight / Promoted
            </label>
          </div>

          {/* Image Upload */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload Vehicle Images</h3>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="border border-gray-300 rounded-md p-2 w-full"
            />

            {/* ✅ Preview Section */}
            {previewImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previewImages.map((src, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={src}
                      alt={`Preview ${index}`}
                      className="w-full h-32 object-cover rounded-lg border shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition duration-200"
          >
            Add Vehicle
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
