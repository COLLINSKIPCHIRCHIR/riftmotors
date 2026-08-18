import { useEffect, useState } from "react";

export default function EmployeeRecurringDeductionModal({
  deduction,
  employees,
  deductionTypes,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    employee_id: "",
    deduction_type_id: "",
    name: "",
    amount: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  // ==========================================
  // Load Existing Data
  // ==========================================

  useEffect(() => {
    if (deduction) {
      setForm({
        employee_id: deduction.employee_id || "",
        deduction_type_id:
          deduction.deduction_type_id || "",
        name: deduction.name || "",
        amount: deduction.amount || "",
        start_date: deduction.start_date
          ? deduction.start_date.substring(0, 10)
          : "",
        end_date: deduction.end_date
          ? deduction.end_date.substring(0, 10)
          : "",
        is_active: deduction.is_active,
      });
    } else {
      setForm({
        employee_id: "",
        deduction_type_id: "",
        name: "",
        amount: "",
        start_date: "",
        end_date: "",
        is_active: true,
      });
    }
  }, [deduction]);

  // ==========================================
  // Handle Change
  // ==========================================

  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;

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

    if (!form.employee_id) {
      alert("Please select an employee.");
      return;
    }

    if (!form.deduction_type_id) {
      alert("Please select a deduction type.");
      return;
    }

    if (!form.name.trim()) {
      alert("Deduction name is required.");
      return;
    }

    if (
      form.amount === "" ||
      form.amount === null ||
      form.amount === undefined ||
      Number(form.amount) < 0
    ) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!form.start_date) {
      alert("Start Date is required.");
      return;
    }

    if (
      form.end_date &&
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

  const selectedEmployee = employees.find(
    (e) =>
      Number(e.id) ===
      Number(form.employee_id)
  );

  const selectedType = deductionTypes.find(
    (d) =>
      Number(d.id) ===
      Number(form.deduction_type_id)
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}

        <div className="border-b px-6 py-4 flex items-center justify-between">

          <h2 className="text-xl font-bold text-slate-800">

            {deduction
              ? "Edit Recurring Deduction"
              : "New Recurring Deduction"}

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

          {/* Employee */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Employee *
            </label>

            <select
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
            >

              <option value="">
                Select Employee
              </option>

              {employees.map((employee) => (

                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.employee_number} -{" "}
                  {employee.first_name}{" "}
                  {employee.last_name}
                </option>

              ))}

            </select>

          </div>

          {/* Deduction Type */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Deduction Type *
            </label>

            <select
              name="deduction_type_id"
              value={form.deduction_type_id}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
            >

              <option value="">
                Select Deduction Type
              </option>

              {deductionTypes.map((type) => (

                <option
                  key={type.id}
                  value={type.id}
                >
                  {type.code} - {type.name}
                </option>

              ))}

            </select>

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
              placeholder="Example: Staff SACCO Contribution"
              className="w-full border rounded-lg px-3 py-2"
              required
            />

          </div>

          {/* Amount */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Monthly Amount (KES) *
            </label>

            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="5000"
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
                End Date
              </label>

              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

              <p className="text-xs text-slate-500 mt-1">
                Leave blank for ongoing deductions.
              </p>

            </div>

          </div>

          {/* Active */}

          <div className="flex justify-between items-center border rounded-lg p-4">

            <div>

              <h3 className="font-medium">
                Active Deduction
              </h3>

              <p className="text-sm text-slate-500">
                Active deductions will automatically be
                included in payroll processing.
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

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">

            <h3 className="font-semibold text-blue-800 mb-4">
              Deduction Summary
            </h3>

            <div className="grid md:grid-cols-2 gap-4">

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Employee
                </p>

                <p className="font-semibold">

                  {selectedEmployee
                    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                    : "-"}

                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Deduction Type
                </p>

                <p className="font-semibold">

                  {selectedType
                    ? selectedType.name
                    : "-"}

                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Monthly Amount
                </p>

                <p className="font-semibold text-lg">

                  KES{" "}
                  {form.amount
                    ? Number(form.amount).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )
                    : "0.00"}

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

          {/* Payroll Info */}

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">

            <h3 className="font-semibold text-amber-800 mb-2">
              Payroll Information
            </h3>

            <ul className="list-disc ml-5 text-sm text-amber-700 space-y-1">

              <li>
                Recurring deductions are automatically
                applied during payroll processing.
              </li>

              <li>
                Typical deductions include SACCO,
                Loans, Welfare, Pension and Insurance.
              </li>

              <li>
                Expired or inactive deductions are
                ignored during payroll calculation.
              </li>

              <li>
                Leave the End Date blank if the
                deduction has no planned end date.
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
              {deduction
                ? "Update Deduction"
                : "Save Deduction"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}