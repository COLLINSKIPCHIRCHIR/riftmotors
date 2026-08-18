import { useEffect, useState } from "react";
import { getEmployeeLeaveBalance } from "../../../api/hrApi";

export default function LeaveRequestModal({
  request,
  employees,
  leaveTypes,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    employee_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [balance, setBalance] = useState(null);
  const [requestedDays, setRequestedDays] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    if (request) {
      setForm({
        employee_id: request.employee_id || "",
        leave_type_id: request.leave_type_id || "",
        start_date: request.start_date
          ? request.start_date.substring(0, 10)
          : "",
        end_date: request.end_date
          ? request.end_date.substring(0, 10)
          : "",
        reason: request.reason || "",
      });
    }
  }, [request]);

  // ===========================
  // Load Leave Balance
  // ===========================

  useEffect(() => {
    if (form.employee_id && form.leave_type_id) {
      loadBalance();
    } else {
      setBalance(null);
    }
  }, [form.employee_id, form.leave_type_id]);

  const loadBalance = async () => {
    try {
      setLoadingBalance(true);

      const year = new Date().getFullYear();

      const res = await getEmployeeLeaveBalance(
        form.employee_id,
        form.leave_type_id,
        year
      );

      setBalance(res.data);
    } catch (err) {
      console.error(err);
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  // ===========================
  // Calculate Requested Days
  // ===========================

  useEffect(() => {
    if (form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);

      if (end >= start) {
        const days =
          Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        setRequestedDays(days);
      } else {
        setRequestedDays(0);
      }
    } else {
      setRequestedDays(0);
    }
  }, [form.start_date, form.end_date]);

  // ===========================
  // Calculations
  // ===========================

const remaining = balance?.remaining || 0;

const available = balance?.available || 0;

const pending = balance?.pending || 0;

const remainingAfterApproval = available - requestedDays;

  // ===========================
  // Form Change
  // ===========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===========================
  // Submit
  // ===========================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.employee_id ||
      !form.leave_type_id ||
      !form.start_date ||
      !form.end_date
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (new Date(form.end_date) < new Date(form.start_date)) {
      alert("End date cannot be before start date.");
      return;
    }

    if (balance && available < requestedDays) {
      alert("Employee has insufficient leave balance.");
      return;
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">

        {/* Header */}

        <div className="border-b px-6 py-4 flex justify-between items-center">

          <h2 className="text-xl font-bold">
            {request ? "Edit Leave Request" : "New Leave Request"}
          </h2>

          <button
            onClick={onClose}
            className="text-xl hover:text-red-600"
          >
            ×
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5"
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

              <option value="">Select Employee</option>

              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.employee_number} -{" "}
                  {employee.first_name} {employee.last_name}
                </option>
              ))}

            </select>

          </div>

          {/* Leave Type */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Leave Type *
            </label>

            <select
              name="leave_type_id"
              value={form.leave_type_id}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
            >

              <option value="">Select Leave Type</option>

              {leaveTypes.map((type) => (
                <option
                  key={type.id}
                  value={type.id}
                >
                  {type.name}
                </option>
              ))}

            </select>

          </div>

          {/* Leave Balance */}

          {(loadingBalance || balance) && (
            <div className="rounded-xl border bg-slate-50 p-4">

              <h3 className="font-semibold mb-4">
                Leave Balance
              </h3>

              {loadingBalance ? (
                <p className="text-sm text-slate-500">
                  Loading balance...
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">

                    <div>Allocated</div>
                    <div>{balance?.allocated}</div>

                    <div>Used</div>
                    <div>{balance?.used}</div>

                    <div>Carried Forward</div>
                    <div>{balance?.carried_forward}</div>

                    <div>Remaining</div>
                    <div>{remaining}</div>

                    <div className="text-orange-600">
                        Pending Requests
                    </div>

                    <div className="text-orange-600 font-medium">
                        {pending}
                    </div>

                    <div className="font-semibold">
                        Available
                    </div>

                    <div className="font-semibold text-blue-700">
                        {available}
                    </div>

                    <div className="font-semibold">
                        This Request
                    </div>

                    <div>{requestedDays}</div>

                    <div className="font-semibold">
                        Balance After Approval
                    </div>

                    <div
                        className={
                            remainingAfterApproval >= 0
                                ? "font-bold text-green-600"
                                : "font-bold text-red-600"
                        }
                    >
                        {remainingAfterApproval}
                    </div>

                </div>
              )}

            </div>
          )}

          {/* Dates */}

          <div className="grid grid-cols-2 gap-4">

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
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Reason for leave..."
            />

          </div>

          {/* Warning */}

          {balance && available < requestedDays && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
              Employee has insufficient leave balance for this request.
            </div>
          )}

          {/* Footer */}

          <div className="flex justify-end gap-3 border-t pt-4">

            <button
              type="button"
              onClick={onClose}
              className="border rounded-lg px-5 py-2 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={balance && available < requestedDays}
              className={`px-5 py-2 rounded-lg text-white ${
                balance && available < requestedDays
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {request ? "Update Request" : "Create Request"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}