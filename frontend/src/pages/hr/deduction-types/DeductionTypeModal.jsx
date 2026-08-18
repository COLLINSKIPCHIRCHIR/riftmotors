import { useEffect, useState } from "react";

export default function DeductionTypeModal({
  deductionType,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    calculation_method: "Fixed Amount",
    reduces_taxable_income: false,
    is_statutory: true,
    is_active: true,
  });

  // ===========================================
  // Load Existing Data
  // ===========================================

  useEffect(() => {
    if (deductionType) {
      setForm({
        code: deductionType.code || "",
        name: deductionType.name || "",
        calculation_method:
          deductionType.calculation_method || "Fixed Amount",
        reduces_taxable_income:
          deductionType.reduces_taxable_income,
        is_statutory: deductionType.is_statutory,
        is_active: deductionType.is_active,
      });
    } else {
      setForm({
        code: "",
        name: "",
        calculation_method: "Fixed Amount",
        reduces_taxable_income: false,
        is_statutory: true,
        is_active: true,
      });
    }
  }, [deductionType]);

  // ===========================================
  // Handle Change
  // ===========================================

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

  // ===========================================
  // Submit
  // ===========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.code.trim()) {
      alert("Deduction code is required.");
      return;
    }

    if (!form.name.trim()) {
      alert("Deduction name is required.");
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
            {deductionType
              ? "Edit Deduction Type"
              : "New Deduction Type"}
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

          {/* Code */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Deduction Code *
            </label>

            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Example: PAYE"
              required
            />

          </div>

          {/* Name */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Deduction Name *
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Example: Pay As You Earn"
              required
            />

          </div>

          {/* Calculation Method */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Calculation Method
            </label>

            <select
              name="calculation_method"
              value={form.calculation_method}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="Fixed Amount">
                Fixed Amount
              </option>

              <option value="Percentage">
                Percentage
              </option>

              <option value="Formula">
                Formula
              </option>

              <option value="Manual">
                Manual
              </option>

            </select>

          </div>

          {/* Switches */}

          <div className="space-y-4">

            <div className="flex justify-between items-center border rounded-lg p-4">

              <div>

                <h3 className="font-medium">
                  Reduces Taxable Income
                </h3>

                <p className="text-sm text-slate-500">
                  Should this deduction reduce taxable income?
                </p>

              </div>

              <input
                type="checkbox"
                name="reduces_taxable_income"
                checked={form.reduces_taxable_income}
                onChange={handleChange}
                className="w-5 h-5"
              />

            </div>

            <div className="flex justify-between items-center border rounded-lg p-4">

              <div>

                <h3 className="font-medium">
                  Statutory Deduction
                </h3>

                <p className="text-sm text-slate-500">
                  Government-required deduction.
                </p>

              </div>

              <input
                type="checkbox"
                name="is_statutory"
                checked={form.is_statutory}
                onChange={handleChange}
                className="w-5 h-5"
              />

            </div>

            <div className="flex justify-between items-center border rounded-lg p-4">

              <div>

                <h3 className="font-medium">
                  Active
                </h3>

                <p className="text-sm text-slate-500">
                  Only active deduction types are available during payroll.
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

          </div>

          {/* Summary */}

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">

            <h3 className="font-semibold text-blue-800 mb-3">
              Deduction Summary
            </h3>

            <div className="grid md:grid-cols-2 gap-4">

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Code
                </p>

                <p className="font-semibold">
                  {form.code || "-"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Method
                </p>

                <p className="font-semibold">
                  {form.calculation_method}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Statutory
                </p>

                <p className="font-semibold">
                  {form.is_statutory ? "Yes" : "No"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Reduces Taxable Income
                </p>

                <p className="font-semibold">
                  {form.reduces_taxable_income
                    ? "Yes"
                    : "No"}
                </p>

              </div>

            </div>

          </div>

          {/* Info */}

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">

            <p className="font-semibold mb-2">
              Payroll Information
            </p>

            <ul className="list-disc ml-5 space-y-1">

              <li>
                Deduction Types define deductions available throughout the payroll system.
              </li>

              <li>
                Statutory deductions include PAYE, SHA and NSSF.
              </li>

              <li>
                Non-statutory deductions include SACCO, Loans, Welfare and Pension.
              </li>

              <li>
                Inactive deduction types cannot be assigned to employees.
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
              {deductionType
                ? "Update Deduction Type"
                : "Save Deduction Type"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}