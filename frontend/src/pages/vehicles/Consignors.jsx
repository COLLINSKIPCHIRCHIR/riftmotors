import React, { useEffect, useState } from "react";
import API from "../../api/api";
import toast from "react-hot-toast";
import { hasPermission } from "../../utils/permissions";

const Consignors = () => {
  const [consignors, setConsignors] = useState([]);
  const [form, setForm] = useState({ name: "", contact_person: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  const fetchConsignors = () => API.get("/consignors").then((res) => setConsignors(res.data));

  useEffect(() => { fetchConsignors(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post("/consignors", form);
      toast.success("✅ Consignor added");
      setForm({ name: "", contact_person: "", phone: "", email: "" });
      fetchConsignors();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error adding consignor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this consignor?")) return;
    await API.delete(`/consignors/${id}`);
    fetchConsignors();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">🏢 Consignors</h2>

        {hasPermission("consignors.create") && (
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 mb-6">
            <input name="name" placeholder="Consignor Name" value={form.name}
              onChange={handleChange} className="border rounded-md p-2 col-span-2" required />
            <input name="contact_person" placeholder="Contact Person" value={form.contact_person}
              onChange={handleChange} className="border rounded-md p-2" />
            <input name="phone" placeholder="Phone" value={form.phone}
              onChange={handleChange} className="border rounded-md p-2" />
            <input name="email" placeholder="Email" value={form.email}
              onChange={handleChange} className="border rounded-md p-2 col-span-2" />
            <button type="submit" disabled={saving}
              className="col-span-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Add Consignor"}
            </button>
          </form>
        )}

        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Contact</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {consignors.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.contact_person || "—"}</td>
                <td className="p-2">{c.phone || "—"}</td>
                <td className="p-2">
                  {hasPermission("consignors.delete") && (
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Consignors;