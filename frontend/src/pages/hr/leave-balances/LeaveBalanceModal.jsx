import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

export default function LeaveBalanceModal({
  balance,
  employees,
  leaveTypes,
  onClose,
  onSave,
}) {
  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState({
    employee_id: "",
    leave_type_id: "",
    year: currentYear,
    days_allocated: "",
    days_used: 0,
    days_carried_forward: 0,
  });

  useEffect(() => {
    if (balance) {
      setForm({
        employee_id: balance.employee_id,
        leave_type_id: balance.leave_type_id,
        year: balance.year,
        days_allocated: balance.days_allocated,
        days_used: balance.days_used,
        days_carried_forward: balance.days_carried_forward,
      });
    }
  }, [balance]);

  // ==========================================
  // Handle Change
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-fill allocated days when leave type changes
    if (name === "leave_type_id") {
      const selected = leaveTypes.find(
        (lt) => lt.id === Number(value)
      );

      setForm((prev) => ({
        ...prev,
        leave_type_id: value,
        days_allocated:
          selected?.default_days_per_year ?? prev.days_allocated,
      }));

      return;
    }

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

    if (!form.employee_id)
      return alert("Please select an employee.");

    if (!form.leave_type_id)
      return alert("Please select a leave type.");

    onSave({
      ...form,
      employee_id: Number(form.employee_id),
      leave_type_id: Number(form.leave_type_id),
      year: Number(form.year),
      days_allocated: Number(form.days_allocated),
      days_used: Number(form.days_used),
      days_carried_forward: Number(form.days_carried_forward),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">

        {/* Header */}

        <div className="flex justify-between items-center border-b px-6 py-4">

          <h2 className="text-xl font-bold text-slate-800">
            {balance ? "Edit Leave Balance" : "Add Leave Balance"}
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

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Employee */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Employee
              </label>

              <select
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
                required
              >
                <option value="">Select Employee</option>

                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employee_number} - {emp.first_name} {emp.last_name}
                  </option>
                ))}

              </select>

            </div>

            {/* Leave Type */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Leave Type
              </label>

              <select
                name="leave_type_id"
                value={form.leave_type_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
                required
              >
                <option value="">Select Leave Type</option>

                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}

              </select>

            </div>

            {/* Year */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Year
              </label>

              <input
                type="number"
                name="year"
                value={form.year}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              />

            </div>

            {/* Allocated */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Days Allocated
              </label>

              <input
                type="number"
                step="0.5"
                name="days_allocated"
                value={form.days_allocated}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              />

            </div>

            {/* Used */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Days Used
              </label>

              <input
                type="number"
                step="0.5"
                name="days_used"
                value={form.days_used}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              />

            </div>

            {/* Carried */}

            <div>

              <label className="block text-sm font-medium mb-2">
                Days Carried Forward
              </label>

              <input
                type="number"
                step="0.5"
                name="days_carried_forward"
                value={form.days_carried_forward}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
              />

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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              {balance ? "Update Balance" : "Save Balance"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}