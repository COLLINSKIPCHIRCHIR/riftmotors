import React, { useEffect, useState } from "react";
import API from "../../api/api";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await API.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/suppliers", formData);
      alert("Supplier added successfully!");

      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
      });

      fetchSuppliers();
    } catch (err) {
      console.error("Error adding supplier:", err);
      alert("Error adding supplier");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Supplier Management</h1>

      {/* Add Supplier Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input
          type="text"
          name="name"
          placeholder="Supplier Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="p-3 border rounded-lg"
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className="p-3 border rounded-lg"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="p-3 border rounded-lg"
        />

        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          className="p-3 border rounded-lg"
        />

        <button
          type="submit"
          className="col-span-1 md:col-span-2 bg-blue-600 text-white py-3 rounded-lg"
        >
          Add Supplier
        </button>
      </form>

      {/* Supplier Table */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Supplier List</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Address</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border">{s.name}</td>
                <td className="p-2 border">{s.phone}</td>
                <td className="p-2 border">{s.email}</td>
                <td className="p-2 border">{s.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
