// src/pages/Customers.jsx
import React, { useEffect, useState } from "react";
import API from "../api/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingCustomer, setEditingCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    kra_pin: "",
  }); 


  const handleEdit = (customer) => {
  setEditingCustomer(customer);

  setFormData({
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
    kra_pin: customer.kra_pin || "",
  });
};


const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value,
  });
};

const handleUpdate = async () => {
  try {
    await API.put(`/customers/${editingCustomer.id}`, formData);

    setEditingCustomer(null);

    fetchCustomers();
  } catch (err) {
    console.error(err);
    alert("Failed to update customer");
  }
};

  const fetchCustomers = async () => {
    try {
      const res = await API.get("/customers");
      setCustomers(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  return (
    <div className="p-6">
      <h3 className="text-2xl font-semibold mb-4">Customers</h3>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="p-4">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="5" className="p-4">No customers yet.</td></tr>
            ) : customers.map((c, i) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2">{i+1}</td>
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.phone}</td>
                <td className="px-4 py-2">{c.email}</td>
                <td className="px-4 py-2">{c.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
