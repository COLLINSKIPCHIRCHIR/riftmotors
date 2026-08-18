import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

export default function LeaveTypeModal({
  leaveType,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: "",
    default_days_per_year: "",
    is_paid: true,
  });

  useEffect(() => {
    if (leaveType) {
      setForm({
        name: leaveType.name || "",
        default_days_per_year:
          leaveType.default_days_per_year ?? "",
        is_paid: leaveType.is_paid,
      });
    }
  }, [leaveType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      return alert("Leave type name is required.");
    }

    onSave({
      ...form,
      default_days_per_year:
        form.default_days_per_year === ""
          ? null
          : Number(form.default_days_per_year),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">

        {/* Header */}

        <div className="flex items-center justify-between border-b px-6 py-4">

          <h2 className="text-xl font-bold text-slate-800">
            {leaveType ? "Edit Leave Type" : "Add Leave Type"}
          </h2>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-500"
          >
            <FaTimes />
          </button>

        </div>

        {/* Form */}

        <form onSubmit={handleSubmit}>

          <div className="p-6 space-y-5">

            {/* Name */}

            <div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Leave Type
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Annual Leave"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Days */}

            <div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Days Per Year
              </label>

              <input
                type="number"
                step="0.5"
                min="0"
                name="default_days_per_year"
                value={form.default_days_per_year}
                onChange={handleChange}
                placeholder="21"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Paid */}

            <label className="flex items-center gap-3">

              <input
                type="checkbox"
                name="is_paid"
                checked={form.is_paid}
                onChange={handleChange}
                className="w-5 h-5"
              />

              <span className="text-slate-700">
                Paid Leave
              </span>

            </label>

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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              {leaveType ? "Update Leave Type" : "Save Leave Type"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}