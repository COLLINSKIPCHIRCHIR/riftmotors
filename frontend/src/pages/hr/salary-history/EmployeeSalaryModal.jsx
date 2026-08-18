import { useEffect, useState } from "react";

export default function EmployeeSalaryModal({
  salary,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    basic_salary: "",
    effective_from: "",
    effective_to: "",
    reason: "",
  });

  // ======================================
  // Load Existing Salary
  // ======================================

  useEffect(() => {
    if (salary) {
      setForm({
        basic_salary: salary.basic_salary || "",
        effective_from: salary.effective_from
          ? salary.effective_from.substring(0, 10)
          : "",
        effective_to: salary.effective_to
          ? salary.effective_to.substring(0, 10)
          : "",
        reason: salary.reason || "",
      });
    } else {
      setForm({
        basic_salary: "",
        effective_from: "",
        effective_to: "",
        reason: "",
      });
    }
  }, [salary]);

  // ======================================
  // Handle Change
  // ======================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================================
  // Submit
  // ======================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.basic_salary || !form.effective_from) {
      alert("Please fill all required fields.");
      return;
    }

    if (
      form.effective_to &&
      new Date(form.effective_to) <
        new Date(form.effective_from)
    ) {
      alert(
        "Effective To cannot be earlier than Effective From."
      );
      return;
    }

    onSave(form);
  };

  // ======================================
  // Currency Formatter
  // ======================================

  const formatCurrency = (value) => {
    if (!value) return "KES 0.00";

    return Number(value).toLocaleString("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}

        <div className="border-b px-6 py-4 flex justify-between items-center">

          <h2 className="text-xl font-bold text-slate-800">
            {salary
              ? "Edit Salary Record"
              : "Add Salary Record"}
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-slate-500 hover:text-red-600"
          >
            ×
          </button>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >

          {/* Salary */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Basic Salary (KES) *
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              name="basic_salary"
              value={form.basic_salary}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Enter salary"
              required
            />

          </div>

          {/* Effective Dates */}

          <div className="grid md:grid-cols-2 gap-5">

            <div>

              <label className="block text-sm font-medium mb-1">
                Effective From *
              </label>

              <input
                type="date"
                name="effective_from"
                value={form.effective_from}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />

            </div>

            <div>

              <label className="block text-sm font-medium mb-1">
                Effective To
              </label>

              <input
                type="date"
                name="effective_to"
                value={form.effective_to}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

          </div>

          {/* Reason */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Reason
            </label>

            <textarea
              rows={4}
              name="reason"
              value={form.reason}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 resize-none"
              placeholder="Example: Annual salary review, Promotion, Performance increment..."
            />

          </div>

          {/* Summary */}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">

            <h3 className="font-semibold text-emerald-800 mb-3">
              Salary Summary
            </h3>

            <div className="grid grid-cols-2 gap-5">

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Basic Salary
                </p>

                <p className="text-xl font-bold text-emerald-700">
                  {formatCurrency(form.basic_salary)}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Effective Date
                </p>

                <p className="font-semibold text-slate-700">
                  {form.effective_from || "-"}
                </p>

              </div>

            </div>

          </div>

          {/* Information */}

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">

            <p className="font-semibold mb-2">
              Salary History
            </p>

            <ul className="list-disc ml-5 space-y-1">

              <li>
                Every salary adjustment is permanently recorded.
              </li>

              <li>
                The previous active salary is automatically closed when a new salary is created.
              </li>

              <li>
                This history can be used later for payroll, audits and reporting.
              </li>

            </ul>

          </div>

          {/* Footer */}

          <div className="flex justify-end gap-3 pt-4 border-t">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              {salary ? "Update Salary" : "Save Salary"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}