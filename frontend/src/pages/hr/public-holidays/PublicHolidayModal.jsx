import { useEffect, useState } from "react";

export default function PublicHolidayModal({
  holiday,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    holiday_name: "",
    holiday_date: "",
    is_recurring: true,
  });

  useEffect(() => {
    if (holiday) {
      setForm({
        holiday_name: holiday.holiday_name || "",
        holiday_date: holiday.holiday_date
          ? holiday.holiday_date.substring(0, 10)
          : "",
        is_recurring: holiday.is_recurring,
      });
    } else {
      setForm({
        holiday_name: "",
        holiday_date: "",
        is_recurring: true,
      });
    }
  }, [holiday]);

  // ==========================================
  // Handle Input Change
  // ==========================================

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

  // ==========================================
  // Submit
  // ==========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.holiday_name.trim() ||
      !form.holiday_date
    ) {
      alert("Please complete all required fields.");
      return;
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">

        {/* Header */}

        <div className="border-b px-6 py-4 flex items-center justify-between">

          <h2 className="text-xl font-bold text-slate-800">
            {holiday
              ? "Edit Public Holiday"
              : "Add Public Holiday"}
          </h2>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-600 text-2xl"
          >
            ×
          </button>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5"
        >

          {/* Holiday Name */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Holiday Name *
            </label>

            <input
              type="text"
              name="holiday_name"
              value={form.holiday_name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Example: Mashujaa Day"
              required
            />

          </div>

          {/* Holiday Date */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Holiday Date *
            </label>

            <input
              type="date"
              name="holiday_date"
              value={form.holiday_date}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />

          </div>

          {/* Recurring */}

          <div className="flex items-center gap-3">

            <input
              id="is_recurring"
              type="checkbox"
              name="is_recurring"
              checked={form.is_recurring}
              onChange={handleChange}
              className="w-4 h-4"
            />

            <label
              htmlFor="is_recurring"
              className="text-sm text-slate-700"
            >
              Repeat every year
            </label>

          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
            <strong>Recurring</strong> means this holiday occurs every
            year on the same date (for example, Christmas Day). Disable
            this option for one-time holidays declared for a specific
            year.
          </div>

          {/* Footer */}

          <div className="flex justify-end gap-3 pt-4 border-t">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              {holiday
                ? "Update Holiday"
                : "Save Holiday"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}