import React, { useState, useEffect } from "react";
import API from "../../api/api";

export default function AddSparePart() {
  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    part_number: "",
    name: "",
    category: "",
    supplier_id: "",
    quantity: "",
    buying_price: "",
    selling_price: "",
    discount: "",
  });

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

  const fetchSuppliers = async () => {
    try {
      const res = await API.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      console.error("❌ Error fetching suppliers:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/spareparts/add", formData);
      alert("Spare part added successfully!");

      setFormData({
        part_number: "",
        name: "",
        category: "",
        supplier_id: "",
        quantity: "",
        buying_price: "",
        selling_price: "",
        discount: "",
      });
    } catch (err) {
      console.error("❌ Error adding spare part:", err);
      alert("Error adding spare part");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-5xl bg-white p-6 rounded-2xl shadow-md"
      >
        <h1 className="text-2xl font-bold mb-6">Add Spare Part</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left */}
          <div className="space-y-4">

            <input
              type="text"
              name="part_number"
              placeholder="Part Number"
              value={formData.part_number}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
            />

            <input
              type="text"
              name="name"
              placeholder="Part Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
            />

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* 🔥 SUPPLIER DROPDOWN */}
            <select
              name="supplier_id"
              value={formData.supplier_id}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

          </div>

          {/* Right */}
          <div className="space-y-4">

            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
            />

            <input
              type="number"
              name="buying_price"
              placeholder="Buying Price"
              value={formData.buying_price}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
            />

            <input
              type="number"
              name="selling_price"
              placeholder="Selling Price"
              value={formData.selling_price}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
            />

            <input
              type="number"
              name="discount"
              placeholder="Discount %"
              value={formData.discount}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
            />

          </div>
        </div>

        <button
          type="submit"
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl"
        >
          Save Spare Part
        </button>
      </form>
    </div>
  );
}
