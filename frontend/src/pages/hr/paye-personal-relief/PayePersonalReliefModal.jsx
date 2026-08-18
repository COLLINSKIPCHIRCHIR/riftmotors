import { useEffect, useState } from "react";

export default function PayePersonalReliefModal({
  relief,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    effective_from: "",
    effective_to: "",
    monthly_relief_amount: "",
  });

  // ==========================================
  // Load Existing Record
  // ==========================================

  useEffect(() => {
    if (relief) {
      setForm({
        effective_from: relief.effective_from
          ? relief.effective_from.substring(0, 10)
          : "",
        effective_to: relief.effective_to
          ? relief.effective_to.substring(0, 10)
          : "",
        monthly_relief_amount:
          relief.monthly_relief_amount ?? "",
      });
    } else {
      setForm({
        effective_from: "",
        effective_to: "",
        monthly_relief_amount: "",
      });
    }
  }, [relief]);

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

    if (!form.effective_from) {
      alert("Effective From is required.");
      return;
    }

    if (!form.monthly_relief_amount) {
      alert("Monthly Relief Amount is required.");
      return;
    }

    if (
      Number(form.monthly_relief_amount) <= 0
    ) {
      alert(
        "Monthly Relief Amount must be greater than zero."
      );
      return;
    }

    if (
      form.effective_to &&
      new Date(form.effective_to) <
        new Date(form.effective_from)
    ) {
      alert(
        "Effective To cannot be before Effective From."
      );
      return;
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}

        <div className="border-b px-6 py-4 flex items-center justify-between">

          <h2 className="text-xl font-bold text-slate-800">
            {relief
              ? "Edit PAYE Personal Relief"
              : "New PAYE Personal Relief"}
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
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >

          {/* Effective Dates */}

          <div className="grid md:grid-cols-2 gap-4">

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

              <p className="text-xs text-slate-500 mt-1">
                Leave blank if this relief is currently active.
              </p>

            </div>

          </div>

          {/* Monthly Relief */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Monthly Relief Amount (KES) *
            </label>

            <input
              type="number"
              step="0.01"
              min="0"
              name="monthly_relief_amount"
              value={form.monthly_relief_amount}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="2400.00"
              required
            />

          </div>

          {/* Summary */}

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">

            <h3 className="font-semibold text-blue-800 mb-4">
              Personal Relief Summary
            </h3>

            <div className="grid md:grid-cols-2 gap-4">

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Monthly Relief
                </p>

                <p className="font-semibold text-lg">
                  KES{" "}
                  {form.monthly_relief_amount
                    ? Number(
                        form.monthly_relief_amount
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0.00"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Effective Period
                </p>

                <p className="font-semibold">

                  {form.effective_from || "-"}

                  {form.effective_to
                    ? ` → ${form.effective_to}`
                    : " → Current"}

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
                Personal Relief is deducted from the employee's PAYE after tax has been calculated.
              </li>

              <li>
                Only one Personal Relief should be active for a given period.
              </li>

              <li>
                When KRA revises the relief amount, create a new record instead of editing historical records.
              </li>

              <li>
                Historical payroll calculations will continue using the applicable relief for that payroll period.
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
              {relief
                ? "Update Personal Relief"
                : "Save Personal Relief"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}