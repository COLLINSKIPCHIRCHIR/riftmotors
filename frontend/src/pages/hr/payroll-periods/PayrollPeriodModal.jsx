import { useEffect, useState } from "react";

export default function PayrollPeriodModal({
  payrollPeriod,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    period_label: "",
    start_date: "",
    end_date: "",
    status: "Open",
  });

  // ==========================================
  // Load Existing Data
  // ==========================================

  useEffect(() => {
    if (payrollPeriod) {
      setForm({
        period_label:
          payrollPeriod.period_label || "",
        start_date: payrollPeriod.start_date
          ? payrollPeriod.start_date.substring(0, 10)
          : "",
        end_date: payrollPeriod.end_date
          ? payrollPeriod.end_date.substring(0, 10)
          : "",
        status:
          payrollPeriod.status || "Open",
      });
    } else {
      setForm({
        period_label: "",
        start_date: "",
        end_date: "",
        status: "Open",
      });
    }
  }, [payrollPeriod]);

  // ==========================================
  // Handle Change
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // Submit
  // ==========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.period_label.trim()) {
      alert("Payroll Period Label is required.");
      return;
    }

    if (!form.start_date) {
      alert("Start Date is required.");
      return;
    }

    if (!form.end_date) {
      alert("End Date is required.");
      return;
    }

    if (
      new Date(form.end_date) <
      new Date(form.start_date)
    ) {
      alert(
        "End Date cannot be earlier than Start Date."
      );
      return;
    }

    onSave(form);
  };

  // ==========================================
  // Calculate Period Days
  // ==========================================

  const calculateDays = () => {
    if (
      !form.start_date ||
      !form.end_date
    )
      return 0;

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);

    return (
      Math.floor(
        (end - start) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}

        <div className="border-b px-6 py-4 flex justify-between items-center">

          <h2 className="text-xl font-bold text-slate-800">

            {payrollPeriod
              ? "Edit Payroll Period"
              : "New Payroll Period"}

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

          {/* Payroll Label */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Payroll Period Label *
            </label>

            <input
              type="text"
              name="period_label"
              value={form.period_label}
              onChange={handleChange}
              placeholder="Example: January 2026 Payroll"
              className="w-full border rounded-lg px-3 py-2"
              required
            />

          </div>

          {/* Dates */}

          <div className="grid md:grid-cols-2 gap-4">

            <div>

              <label className="block text-sm font-medium mb-1">
                Start Date *
              </label>

              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />

            </div>

            <div>

              <label className="block text-sm font-medium mb-1">
                End Date *
              </label>

              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />

            </div>

          </div>

          {/* Status */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            >

              <option value="Open">
                Open
              </option>

              <option value="Processed">
                Processed
              </option>

              <option value="Closed">
                Closed
              </option>

            </select>

          </div>

          {/* Summary */}

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">

            <h3 className="font-semibold text-blue-800 mb-4">
              Payroll Summary
            </h3>

            <div className="grid md:grid-cols-2 gap-4">

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Period
                </p>

                <p className="font-semibold">
                  {form.period_label || "-"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Status
                </p>

                <p className="font-semibold">
                  {form.status}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Start Date
                </p>

                <p className="font-semibold">
                  {form.start_date || "-"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  End Date
                </p>

                <p className="font-semibold">
                  {form.end_date || "-"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Payroll Days
                </p>

                <p className="font-bold text-lg text-blue-700">
                  {calculateDays()} Days
                </p>

              </div>

            </div>

          </div>

          {/* Information */}

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">

            <h3 className="font-semibold text-amber-800 mb-2">
              Payroll Information
            </h3>

            <ul className="list-disc ml-5 text-sm text-amber-700 space-y-1">

              <li>
                A payroll period represents one payroll cycle.
              </li>

              <li>
                Payroll can only be processed for an open period.
              </li>

              <li>
                Once payroll has been processed, the status should change to <strong>Processed</strong>.
              </li>

              <li>
                Closed payroll periods cannot be modified or processed again.
              </li>

              <li>
                Normally there should only be one payroll period with an <strong>Open</strong> status at a time.
              </li>

            </ul>

          </div>

          {/* Footer */}

          <div className="border-t pt-4 flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              {payrollPeriod
                ? "Update Payroll Period"
                : "Save Payroll Period"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}