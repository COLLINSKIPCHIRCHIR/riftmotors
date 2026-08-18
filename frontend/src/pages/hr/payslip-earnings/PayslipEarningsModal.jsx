import { useEffect, useState } from "react";
import { getPayslips } from "../../../api/hrApi";

export default function PayslipEarningsModal({
  earning,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    payslip_id: "",
    description: "",
    amount: "",
  });

  const [payslips, setPayslips] = useState([]);

  // ==========================================
  // Load Existing Data
  // ==========================================

  useEffect(() => {
    if (earning) {
      setForm({
        payslip_id: earning.payslip_id || "",
        description: earning.description || "",
        amount: earning.amount || "",
      });
    } else {
      setForm({
        payslip_id: "",
        description: "",
        amount: "",
      });
    }
  }, [earning]);


  useEffect(() => {
  loadPayslips();
}, []);

const loadPayslips = async () => {
  try {
    const res = await getPayslips();
    setPayslips(res.data);
  } catch (error) {
    console.error("Error loading payslips:", error);
  }
};

  // ==========================================
  // Handle Change
  // ==========================================

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ==========================================
  // Submit
  // ==========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.payslip_id) {
      alert("Payslip is required.");
      return;
    }

    if (!form.description.trim()) {
      alert("Description is required.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Amount must be greater than zero.");
      return;
    }

    onSave({
      ...form,
      amount: Number(form.amount),
    });
  };

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}

        <div className="border-b px-6 py-4 flex items-center justify-between">

          <h2 className="text-xl font-bold text-slate-800">
            {earning
              ? "Edit Payslip Earning"
              : "New Payslip Earning"}
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

          {/* Payslip */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Payslip ID *
            </label>

            <select
              name="payslip_id"
              value={form.payslip_id}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">
                Select Payslip
              </option>

              {payslips.map((payslip) => (
                <option
                  key={payslip.id}
                  value={payslip.id}
                >
                  {payslip.employee_name ||
                    `Payslip #${payslip.id}`}{" "}
                  ({payslip.period_label})
                </option>
              ))}
            </select>

          </div>

          {/* Description */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Earning Description *
            </label>

            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Example: House Allowance"
              required
            />

          </div>

          {/* Amount */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Amount *
            </label>

            <input
              type="number"
              step="0.01"
              min="0"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="0.00"
              required
            />

          </div>

          {/* Summary */}

          <div className="rounded-xl bg-green-50 border border-green-200 p-5">

            <h3 className="font-semibold text-green-800 mb-3">
              Earnings Summary
            </h3>

            <div className="grid md:grid-cols-3 gap-4">

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Payslip
                </p>

                <p className="font-semibold">
                  {payslips.find(
                    (p) => Number(p.id) === Number(form.payslip_id)
                  )
                    ? `${
                        payslips.find(
                          (p) => Number(p.id) === Number(form.payslip_id)
                        ).employee_name
                      } (${
                        payslips.find(
                          (p) => Number(p.id) === Number(form.payslip_id)
                        ).period_label
                      })`
                    : "-"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Description
                </p>

                <p className="font-semibold">
                  {form.description || "-"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Amount
                </p>

                <p className="font-bold text-green-700">
                  {formatMoney(form.amount)}
                </p>

              </div>

            </div>

          </div>

          {/* Information */}

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">

            <p className="font-semibold mb-2">
              Payslip Earnings Information
            </p>

            <ul className="list-disc ml-5 space-y-1">

              <li>
                Earnings represent all income items included in an employee's payslip.
              </li>

              <li>
                Examples include Basic Salary, House Allowance, Transport Allowance, Overtime and Bonuses.
              </li>

              <li>
                The sum of all earnings contributes to the employee's Gross Pay.
              </li>

              <li>
                Payroll processing will automatically populate these records in future versions.
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
              {earning
                ? "Update Earning"
                : "Save Earning"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}