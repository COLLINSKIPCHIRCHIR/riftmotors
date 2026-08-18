import { useEffect, useState } from "react";

export default function EmployeeAttendanceModal({
  attendance,
  employees,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    employee_id: "",
    attendance_date: "",
    clock_in: "",
    clock_out: "",
    status: "Present",
    remarks: "",
  });

  const [workedHours, setWorkedHours] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);

  // ==========================================
  // Load Existing Attendance
  // ==========================================

  useEffect(() => {
    if (attendance) {
      setForm({
        employee_id: attendance.employee_id || "",
        attendance_date: attendance.attendance_date
          ? attendance.attendance_date.substring(0, 10)
          : "",
        clock_in: attendance.clock_in
          ? new Date(attendance.clock_in)
              .toISOString()
              .slice(0, 16)
          : "",
        clock_out: attendance.clock_out
          ? new Date(attendance.clock_out)
              .toISOString()
              .slice(0, 16)
          : "",
        status: attendance.status || "Present",
        remarks: attendance.remarks || "",
      });

      setWorkedHours(Number(attendance.worked_hours || 0));
      setOvertimeHours(Number(attendance.overtime_hours || 0));
    } else {
      setForm({
        employee_id: "",
        attendance_date: "",
        clock_in: "",
        clock_out: "",
        status: "Present",
        remarks: "",
      });

      setWorkedHours(0);
      setOvertimeHours(0);
    }
  }, [attendance]);

  // ==========================================
  // Calculate Hours
  // ==========================================

  useEffect(() => {
    if (form.clock_in && form.clock_out) {
      const start = new Date(form.clock_in);
      const end = new Date(form.clock_out);

      if (end > start) {
        const hours =
          (end - start) / (1000 * 60 * 60);

        setWorkedHours(Number(hours.toFixed(2)));

        setOvertimeHours(
          hours > 8
            ? Number((hours - 8).toFixed(2))
            : 0
        );
      } else {
        setWorkedHours(0);
        setOvertimeHours(0);
      }
    } else {
      setWorkedHours(0);
      setOvertimeHours(0);
    }
  }, [form.clock_in, form.clock_out]);

  // ==========================================
  // Handle Changes
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

    if (
      !form.employee_id ||
      !form.attendance_date ||
      !form.status
    ) {
      alert("Please complete all required fields.");
      return;
    }

    if (
      form.clock_in &&
      form.clock_out &&
      new Date(form.clock_out) <= new Date(form.clock_in)
    ) {
      alert("Clock Out must be after Clock In.");
      return;
    }

    onSave({
      ...form,
      worked_hours: workedHours,
      overtime_hours: overtimeHours,
    });
  };

    return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}

        <div className="border-b px-6 py-4 flex items-center justify-between">

          <h2 className="text-xl font-bold text-slate-800">
            {attendance
              ? "Edit Attendance"
              : "Record Attendance"}
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

          {/* Employee & Date */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

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

            <div>

              <label className="block text-sm font-medium mb-1">
                Attendance Date *
              </label>

              <input
                type="date"
                name="attendance_date"
                value={form.attendance_date}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />

            </div>

          </div>

          {/* Clock In / Clock Out */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>

              <label className="block text-sm font-medium mb-1">
                Clock In
              </label>

              <input
                type="datetime-local"
                name="clock_in"
                value={form.clock_in}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

            <div>

              <label className="block text-sm font-medium mb-1">
                Clock Out
              </label>

              <input
                type="datetime-local"
                name="clock_out"
                value={form.clock_out}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

          </div>

          {/* Hours Summary */}

          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-xl border bg-green-50 border-green-200 p-4">

              <p className="text-sm text-slate-500">
                Worked Hours
              </p>

              <p className="text-2xl font-bold text-green-700 mt-1">
                {workedHours.toFixed(2)}
              </p>

            </div>

            <div className="rounded-xl border bg-orange-50 border-orange-200 p-4">

              <p className="text-sm text-slate-500">
                Overtime Hours
              </p>

              <p className="text-2xl font-bold text-orange-700 mt-1">
                {overtimeHours.toFixed(2)}
              </p>

            </div>

          </div>

          {/* Status */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Attendance Status *
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            >

              <option value="Present">
                Present
              </option>

              <option value="Absent">
                Absent
              </option>

              <option value="Late">
                Late
              </option>

              <option value="Half Day">
                Half Day
              </option>

              <option value="Leave">
                Leave
              </option>

              <option value="Holiday">
                Holiday
              </option>

              <option value="Weekend">
                Weekend
              </option>

            </select>

          </div>

          {/* Remarks */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Remarks
            </label>

            <textarea
              rows={4}
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="Optional remarks..."
              className="w-full border rounded-lg px-3 py-2 resize-none"
            />

          </div>

          {/* Information */}

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">

            <p className="font-medium">
              Attendance Summary
            </p>

            <ul className="list-disc ml-5 mt-2 space-y-1">

              <li>
                Worked hours are calculated automatically.
              </li>

              <li>
                Overtime is calculated after 8 working hours.
              </li>

              <li>
                You may record attendance even without clock-in/out
                times (for example, Leave, Holiday or Absent).
              </li>

            </ul>

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
              {attendance
                ? "Update Attendance"
                : "Save Attendance"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}