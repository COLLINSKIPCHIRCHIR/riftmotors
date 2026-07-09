import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";
import toast from "react-hot-toast";

const categories = [
  "Engine", "Suspension", "Brakes", "Electrical",
  "Body", "Transmission", "Exhaust", "Other"
];

export default function EditSparePart() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  const [form, setForm] = useState({
    part_number: "", name: "", category: "",
    supplier_id: "", quantity: "",
    buying_price: "", selling_price: "", discount: ""
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [partRes, suppRes] = await Promise.all([
          API.get(`/spareparts/${id}`),
          API.get("/suppliers"),
        ]);
        const p = partRes.data;
        setForm({
          part_number: p.part_number || "",
          name: p.name || "",
          category: p.category || "",
          supplier_id: p.supplier_id || "",
          quantity: p.quantity || "",
          buying_price: p.buying_price || "",
          selling_price: p.selling_price || "",
          discount: p.discount || "",
        });
        setSuppliers(suppRes.data);
      } catch {
        toast.error("Failed to load spare part");
        navigate("/admin/spare-parts/inventory");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put(`/spareparts/${id}`, form);
      toast.success("Spare part updated");
      navigate("/admin/spare-parts/inventory");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Edit Spare Part</h1>
        <p className="text-sm text-slate-500">Update part details</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "part_number", label: "Part Number", type: "text" },
            { name: "name", label: "Part Name", type: "text" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Supplier</label>
            <select
              name="supplier_id"
              value={form.supplier_id}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {[
            { name: "quantity", label: "Quantity" },
            { name: "buying_price", label: "Buying Price (Ksh)" },
            { name: "selling_price", label: "Selling Price (Ksh)" },
            { name: "discount", label: "Discount %" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
              <input
                type="number"
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/admin/spare-parts/inventory")}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}