import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function AddCustomer() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    kra_pin: "",
  });

  useEffect(() => {
    if (!isEditing) return;

    const fetchCustomer = async () => {
      try {
        const res = await API.get(`/customers/${id}`);

        setForm({
          name: res.data.name || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
          address: res.data.address || "",
          kra_pin: res.data.kra_pin || "",
        });
      } catch (err) {
        toast.error("Failed to load customer");
        navigate("/admin/customers");
      }
    };

    fetchCustomer();
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      return toast.error("Name is required");
    }

    setLoading(true);

    try {
      if (isEditing) {
        await API.put(`/customers/${id}`, form);
        toast.success("Customer updated successfully");
      } else {
        await API.post("/customers", form);
        toast.success("Customer created successfully");
      }

      navigate("/admin/customers");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} customer`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEditing ? "Edit Customer" : "Add Customer"}
        </h1>

        <p className="text-sm text-slate-500">
          {isEditing
            ? "Update customer information"
            : "Create a new customer record"}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            {
              name: "name",
              label: "Full Name",
              type: "text",
              required: true,
            },
            {
              name: "phone",
              label: "Phone Number",
              type: "text",
            },
            {
              name: "email",
              label: "Email Address",
              type: "email",
            },
            {
              name: "kra_pin",
              label: "KRA Pin",
              type: "text",
            },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {field.label}
                {field.required && (
                  <span className="text-red-500"> *</span>
                )}
              </label>

              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                required={field.required}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Address
            </label>

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/admin/customers")}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Customer"
                : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}