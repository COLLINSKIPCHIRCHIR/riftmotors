
import React, { useState, useEffect } from "react";
import API from "../../api/api";
import toast from "react-hot-toast";
import { getApiErrorMessage, getFieldErrors } from "../../utils/apiError";

export default function AddSparePart() {
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const initialFormData = {
    part_number: "",
    name: "",
    category: "",
    supplier_id: "",
    quantity: "",
    buying_price: "",
    selling_price: "",
    discount: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const categories = [
    "Engine",
    "Suspension",
    "Brakes",
    "Electrical",
    "Body",
    "Transmission",
    "Exhaust",
    "Other",
  ];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const res = await API.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load suppliers"));
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setFieldErrors((prev) => ({
      ...prev,
      [e.target.name]: undefined,
    }));
  };

  // Submit spare part
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setFieldErrors({});

    try {
      await API.post("/spareparts/add", formData);

      toast.success("Spare part added successfully!");

      setFormData({ ...initialFormData });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));

      toast.error(
        getApiErrorMessage(err, "Could not add the spare part")
      );
    } finally {
      setSaving(false);
    }
  };

  // Reusable input error display
  const getInputClass = (name) =>
    `w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
      fieldErrors[name] ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-5xl bg-white p-6 rounded-2xl shadow-md"
      >
        <h1 className="text-2xl font-bold mb-6">
          Add Spare Part
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left */}
          <div className="space-y-4">

            {/* Part Number */}
            <div>
              <input
                type="text"
                name="part_number"
                placeholder="Part Number"
                value={formData.part_number}
                onChange={handleChange}
                className={getInputClass("part_number")}
              />

              {fieldErrors.part_number && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.part_number}
                </p>
              )}
            </div>

            {/* Part Name */}
            <div>
              <input
                type="text"
                name="name"
                placeholder="Part Name"
                value={formData.name}
                onChange={handleChange}
                className={getInputClass("name")}
              />

              {fieldErrors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={getInputClass("category")}
              >
                <option value="">Select Category</option>

                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {fieldErrors.category && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.category}
                </p>
              )}
            </div>

            {/* Supplier */}
            <div>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                className={getInputClass("supplier_id")}
              >
                <option value="">Select Supplier</option>

                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {fieldErrors.supplier_id && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.supplier_id}
                </p>
              )}
            </div>

          </div>

          {/* Right */}
          <div className="space-y-4">

            {/* Quantity */}
            <div>
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={getInputClass("quantity")}
              />

              {fieldErrors.quantity && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.quantity}
                </p>
              )}
            </div>

            {/* Buying Price */}
            <div>
              <input
                type="number"
                name="buying_price"
                placeholder="Buying Price"
                value={formData.buying_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={getInputClass("buying_price")}
              />

              {fieldErrors.buying_price && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.buying_price}
                </p>
              )}
            </div>

            {/* Selling Price */}
            <div>
              <input
                type="number"
                name="selling_price"
                placeholder="Selling Price"
                value={formData.selling_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={getInputClass("selling_price")}
              />

              {fieldErrors.selling_price && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.selling_price}
                </p>
              )}
            </div>

            {/* Discount */}
            <div>
              <input
                type="number"
                name="discount"
                placeholder="Discount %"
                value={formData.discount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={getInputClass("discount")}
              />

              {fieldErrors.discount && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.discount}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Spare Part"}
        </button>

      </form>
    </div>
  );
}
