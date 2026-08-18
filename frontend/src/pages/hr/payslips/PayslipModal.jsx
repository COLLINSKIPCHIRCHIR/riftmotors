import { useEffect, useState } from "react";
import {
  getEmployees,
  getPayrollPeriods,
} from "../../../api/hrApi";

export default function PayslipModal({
  payslip,
  onClose,
  onSave,
}) {

  const [employees, setEmployees] = useState([]);
  const [periods, setPeriods] = useState([]);

  const [form, setForm] = useState({
    payroll_period_id: "",
    employee_id: "",
    basic_salary: "",
    total_allowances: "",
    gross_pay: "",
    unpaid_leave_days: "",
    unpaid_leave_deduction: "",
    taxable_pay: "",
    paye_amount: "",
    total_statutory_deductions: "",
    total_other_deductions: "",
    net_pay: "",
    status: "Draft",
    paid_at: "",
  });

  // ==========================================
  // Load Dropdown Data
  // ==========================================

  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [employeesRes, periodsRes] = await Promise.all([
        getEmployees(),
        getPayrollPeriods(),
      ]);

      setEmployees(employeesRes.data || []);
      setPeriods(periodsRes.data || []);
    } catch (err) {
      console.error("Failed to load dropdowns", err);
    }
  };

  // ==========================================
  // Load Existing Payslip
  // ==========================================

  useEffect(() => {
    if (payslip) {
      setForm({
        payroll_period_id: payslip.payroll_period_id || "",
        employee_id: payslip.employee_id || "",
        basic_salary: payslip.basic_salary || "",
        total_allowances: payslip.total_allowances || "",
        gross_pay: payslip.gross_pay || "",
        unpaid_leave_days: payslip.unpaid_leave_days || "",
        unpaid_leave_deduction:
          payslip.unpaid_leave_deduction || "",
        taxable_pay: payslip.taxable_pay || "",
        paye_amount: payslip.paye_amount || "",
        total_statutory_deductions:
          payslip.total_statutory_deductions || "",
        total_other_deductions:
          payslip.total_other_deductions || "",
        net_pay: payslip.net_pay || "",
        status: payslip.status || "Draft",
        paid_at: payslip.paid_at
          ? payslip.paid_at.substring(0, 10)
          : "",
      });
    } else {
      setForm({
        payroll_period_id: "",
        employee_id: "",
        basic_salary: "",
        total_allowances: "",
        gross_pay: "",
        unpaid_leave_days: "",
        unpaid_leave_deduction: "",
        taxable_pay: "",
        paye_amount: "",
        total_statutory_deductions: "",
        total_other_deductions: "",
        net_pay: "",
        status: "Draft",
        paid_at: "",
      });
    }
  }, [payslip]);

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

    if (!form.payroll_period_id) {
      alert("Payroll Period is required.");
      return;
    }

    if (!form.employee_id) {
      alert("Employee is required.");
      return;
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">

        {/* Header */}

        <div className="border-b px-6 py-4 flex justify-between items-center">

          <h2 className="text-xl font-bold">
            {payslip ? "Edit Payslip" : "New Payslip"}
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-slate-500 hover:text-red-600"
          >
            ×
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >

          {/* Basic Information */}

          <div className="grid md:grid-cols-2 gap-4">

            {/* Payroll Period */}

            <div>

              <label className="block mb-1 text-sm font-medium">
                Payroll Period *
              </label>

              <select
                name="payroll_period_id"
                value={form.payroll_period_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">
                  Select Payroll Period
                </option>

                {periods.map((period) => (
                  <option
                    key={period.id}
                    value={period.id}
                  >
                    {period.period_label}
                  </option>
                ))}

              </select>

            </div>

            {/* Employee */}

            <div>

              <label className="block mb-1 text-sm font-medium">
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
                    {employee.employee_number} - {employee.first_name} {employee.last_name}
                  </option>
                ))}

              </select>

            </div>

          </div>

                    {/* Salary Figures */}

          <div className="grid md:grid-cols-3 gap-4">

            <div>
              <label className="block text-sm mb-1">
                Basic Salary
              </label>

              <input
                type="number"
                step="0.01"
                name="basic_salary"
                value={form.basic_salary}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">
                Total Allowances
              </label>

              <input
                type="number"
                step="0.01"
                name="total_allowances"
                value={form.total_allowances}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">
                Gross Pay
              </label>

              <input
                type="number"
                step="0.01"
                name="gross_pay"
                value={form.gross_pay}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

          </div>

          {/* Leave */}

          <div className="grid md:grid-cols-2 gap-4">

            <div>

              <label className="block text-sm mb-1">
                Unpaid Leave Days
              </label>

              <input
                type="number"
                step="0.5"
                name="unpaid_leave_days"
                value={form.unpaid_leave_days}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

            <div>

              <label className="block text-sm mb-1">
                Leave Deduction
              </label>

              <input
                type="number"
                step="0.01"
                name="unpaid_leave_deduction"
                value={form.unpaid_leave_deduction}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

          </div>

          {/* Tax */}

          <div className="grid md:grid-cols-2 gap-4">

            <div>

              <label className="block text-sm mb-1">
                Taxable Pay
              </label>

              <input
                type="number"
                step="0.01"
                name="taxable_pay"
                value={form.taxable_pay}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

            <div>

              <label className="block text-sm mb-1">
                PAYE
              </label>

              <input
                type="number"
                step="0.01"
                name="paye_amount"
                value={form.paye_amount}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

          </div>

          {/* Deductions */}

          <div className="grid md:grid-cols-2 gap-4">

            <div>

              <label className="block text-sm mb-1">
                Statutory Deductions
              </label>

              <input
                type="number"
                step="0.01"
                name="total_statutory_deductions"
                value={form.total_statutory_deductions}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

            <div>

              <label className="block text-sm mb-1">
                Other Deductions
              </label>

              <input
                type="number"
                step="0.01"
                name="total_other_deductions"
                value={form.total_other_deductions}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

          </div>

          {/* Net Pay */}

          <div className="grid md:grid-cols-3 gap-4">

            <div>

              <label className="block text-sm mb-1">
                Net Pay
              </label>

              <input
                type="number"
                step="0.01"
                name="net_pay"
                value={form.net_pay}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

            <div>

              <label className="block text-sm mb-1">
                Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Draft">
                  Draft
                </option>

                <option value="Paid">
                  Paid
                </option>

              </select>

            </div>

            <div>

              <label className="block text-sm mb-1">
                Paid Date
              </label>

              <input
                type="date"
                name="paid_at"
                value={form.paid_at}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

          </div>

          {/* Summary */}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">

            <h3 className="font-semibold text-blue-800 mb-3">
              Payslip Summary
            </h3>

            <div className="grid md:grid-cols-4 gap-4">

              <div>
                <p className="text-xs uppercase text-slate-500">
                  Employee
                </p>
                <p className="font-semibold">
                  {employees.find(
                    (e) => Number(e.id) === Number(form.employee_id)
                  )
                    ? `${employees.find(
                        (e) => Number(e.id) === Number(form.employee_id)
                      ).first_name} ${
                        employees.find(
                          (e) => Number(e.id) === Number(form.employee_id)
                        ).last_name
                      }`
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase text-slate-500">
                  Gross Pay
                </p>
                <p className="font-bold">
                  {form.gross_pay || "0.00"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase text-slate-500">
                  PAYE
                </p>
                <p className="font-bold text-red-600">
                  {form.paye_amount || "0.00"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase text-slate-500">
                  Net Pay
                </p>
                <p className="font-bold text-green-700">
                  {form.net_pay || "0.00"}
                </p>
              </div>

            </div>

          </div>

          {/* Footer */}

          <div className="border-t pt-4 flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="border px-5 py-2 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              {payslip
                ? "Update Payslip"
                : "Save Payslip"}
            </button>

          </div>

        </form>

      </div>

    </div>

  );

}