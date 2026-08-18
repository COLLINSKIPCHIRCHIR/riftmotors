import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

export default function EmployeeContactModal({
  contact,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: "",
    relationship: "",
    phone: "",
    email: "",
    address: "",
    is_primary: false,
  });

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name || "",
        relationship: contact.relationship || "",
        phone: contact.phone || "",
        email: contact.email || "",
        address: contact.address || "",
        is_primary: contact.is_primary || false,
      });
    }
  }, [contact]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      return alert("Contact name is required.");
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b px-6 py-4">

          <h2 className="text-xl font-bold text-slate-800">

            {contact ? "Edit Contact" : "Add Emergency Contact"}

          </h2>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-500"
          >
            <FaTimes size={18} />
          </button>

        </div>

        {/* Body */}

        <form onSubmit={handleSubmit}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6">

            {/* Name */}

            <div>

              <label className="block mb-1 text-sm font-medium">
                Contact Name *
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />

            </div>

            {/* Relationship */}

            <div>

              <label className="block mb-1 text-sm font-medium">
                Relationship
              </label>

              <input
                type="text"
                name="relationship"
                value={form.relationship}
                onChange={handleChange}
                placeholder="Brother, Sister, Parent..."
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Phone */}

            <div>

              <label className="block mb-1 text-sm font-medium">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Email */}

            <div>

              <label className="block mb-1 text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Address */}

            <div className="md:col-span-2">

              <label className="block mb-1 text-sm font-medium">
                Address
              </label>

              <textarea
                rows={3}
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Primary */}

            <div className="md:col-span-2">

              <label className="flex items-center gap-3 cursor-pointer">

                <input
                  type="checkbox"
                  name="is_primary"
                  checked={form.is_primary}
                  onChange={handleChange}
                  className="h-4 w-4"
                />

                <span className="text-sm font-medium text-slate-700">
                  Set as Primary Emergency Contact
                </span>

              </label>

            </div>

          </div>

          {/* Footer */}

          <div className="border-t px-6 py-4 flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {contact ? "Update Contact" : "Save Contact"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}