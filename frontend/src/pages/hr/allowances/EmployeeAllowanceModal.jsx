import { useEffect, useState } from "react";

export default function EmployeeAllowanceModal({
  allowance,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: "",
    amount: "",
    is_taxable: true,
    is_active: true,
  });

  useEffect(() => {
    if (allowance) {
      setForm({
        name: allowance.name || "",
        amount: allowance.amount || "",
        is_taxable: allowance.is_taxable,
        is_active: allowance.is_active,
      });
    } else {
      setForm({
        name: "",
        amount: "",
        is_taxable: true,
        is_active: true,
      });
    }
  }, [allowance]);

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
      alert("Allowance name is required.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Enter a valid allowance amount.");
      return;
    }

    onSave(form);
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString(
      "en-KE",
      {
        style: "currency",
        currency: "KES",
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}

        <div className="border-b px-6 py-4 flex justify-between items-center">

          <h2 className="text-xl font-bold text-slate-800">
            {allowance
              ? "Edit Allowance"
              : "Add Allowance"}
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

          {/* Allowance Name */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Allowance Name *
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g House Allowance"
              className="w-full border rounded-lg px-3 py-2"
              required
            />

          </div>

          {/* Amount */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Amount (KES) *
            </label>

            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2"
              required
            />

          </div>

          {/* Taxable */}

          <div className="flex items-center justify-between border rounded-lg p-4">

            <div>

              <h3 className="font-medium">
                Taxable Allowance
              </h3>

              <p className="text-sm text-slate-500">
                Include this allowance in taxable income.
              </p>

            </div>

            <input
              type="checkbox"
              name="is_taxable"
              checked={form.is_taxable}
              onChange={handleChange}
              className="w-5 h-5"
            />

          </div>

          {/* Active */}

          <div className="flex items-center justify-between border rounded-lg p-4">

            <div>

              <h3 className="font-medium">
                Active Allowance
              </h3>

              <p className="text-sm text-slate-500">
                Only active allowances are used in payroll.
              </p>

            </div>

            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="w-5 h-5"
            />

          </div>

          {/* Summary */}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">

            <h3 className="font-semibold text-emerald-800 mb-3">
              Allowance Summary
            </h3>

            <div className="grid grid-cols-2 gap-4">

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Amount
                </p>

                <p className="text-xl font-bold text-emerald-700">
                  {formatCurrency(form.amount)}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Taxable
                </p>

                <p className="font-semibold">
                  {form.is_taxable
                    ? "Yes"
                    : "No"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Status
                </p>

                <p className="font-semibold">
                  {form.is_active
                    ? "Active"
                    : "Inactive"}
                </p>

              </div>

            </div>

          </div>

          {/* Information */}

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">

            <p className="font-semibold mb-2">
              Payroll Information
            </p>

            <ul className="list-disc ml-5 space-y-1">

              <li>
                Active allowances will automatically be included during payroll processing.
              </li>

              <li>
                Taxable allowances contribute to taxable earnings.
              </li>

              <li>
                Inactive allowances are retained for historical purposes but excluded from future payroll runs.
              </li>

            </ul>

          </div>

          {/* Footer */}

          <div className="border-t pt-4 flex justify-end gap-3">

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
              {allowance
                ? "Update Allowance"
                : "Save Allowance"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}