import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaSearch, FaTrash , FaEdit } from "react-icons/fa";

export default function CustomersList() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      const res = await API.get("/customers");
      setCustomers(res.data || []);
    } catch (err) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this customer?")) return;
    try {
      await API.delete(`/customers/${id}`);
      toast.success("Customer deactivated");
      fetchCustomers();
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-sm text-slate-500">{customers.length} total customers</p>
        </div>
        <button
          onClick={() => navigate("/admin/customers/new")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          <FaPlus size={12} /> Add Customer
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 max-w-sm">
            <FaSearch className="text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm text-slate-700 w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["#", "Name", "Phone", "Email", "Address", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No customers found</td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm text-slate-500">{i + 1}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                        {c.name[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">{c.phone || "—"}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{c.email || "—"}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{c.address || "—"}</td>
                  <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/admin/customers/edit/${c.id}`)}
                      className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition"
                    >
                      <FaEdit size={13} />
                    </button>

                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition"
                    >
                      <FaTrash size={13} />
                    </button>
                  </div>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}