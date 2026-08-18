import { useEffect, useState } from "react";
import {
  getPayslips,
  getDeductionTypes,
} from "../../../api/hrApi";


export default function PayslipDeductionsModal({
  deduction,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    payslip_id: "",
    deduction_type_id: "",
    description: "",
    amount: "",
  });

  const [payslips, setPayslips] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);

  // ==========================================
  // Load Existing Data
  // ==========================================

  useEffect(() => {
    if (deduction) {
      setForm({
        payslip_id: deduction.payslip_id || "",
        deduction_type_id:
          deduction.deduction_type_id || "",
        description: deduction.description || "",
        amount: deduction.amount || "",
      });
    } else {
      setForm({
        payslip_id: "",
        deduction_type_id: "",
        description: "",
        amount: "",
      });
    }
  }, [deduction]);


  useEffect(() => {
  loadDropdowns();
}, []);

const loadDropdowns = async () => {
  try {
    const [payslipsRes, deductionTypesRes] =
      await Promise.all([
        getPayslips(),
        getDeductionTypes(),
      ]);

    setPayslips(payslipsRes.data);
    setDeductionTypes(deductionTypesRes.data);
  } catch (error) {
    console.error(error);
  }
};

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

    if (!form.payslip_id) {
      alert("Please enter a Payslip ID.");
      return;
    }

    if (!form.deduction_type_id) {
      alert("Please enter a Deduction Type ID.");
      return;
    }

    if (!form.description.trim()) {
      alert("Please enter a description.");
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
            {deduction
              ? "Edit Payslip Deduction"
              : "New Payslip Deduction"}
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

          {/* Deduction Type */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Deduction Type ID *
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

          {/* Description */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Description *
            </label>

            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Example: PAYE Tax"
              required
            />

          </div>

          {/* Amount */}

          <div>

            <label className="block text-sm font-medium mb-1">
              Deduction Amount *
            </label>

            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="0.00"
              required
            />

          </div>

          {/* Summary */}

          <div className="rounded-xl bg-red-50 border border-red-200 p-5">

            <h3 className="font-semibold text-red-800 mb-3">
              Deduction Summary
            </h3>

            <div className="grid md:grid-cols-2 gap-4">

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
                  Deduction Type
                </p>

                <p className="font-semibold">
                {deductionTypes.find(
                    (d) => Number(d.id) === Number(form.deduction_type_id)
                )
                    ? `${
                        deductionTypes.find(
                        (d) => Number(d.id) === Number(form.deduction_type_id)
                        ).code
                    } - ${
                        deductionTypes.find(
                        (d) => Number(d.id) === Number(form.deduction_type_id)
                        ).name
                    }`
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

                <p className="font-bold text-red-700">
                  {formatMoney(form.amount)}
                </p>

              </div>

            </div>

          </div>

          {/* Information */}

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">

            <p className="font-semibold mb-2">
              Payslip Deduction Information
            </p>

            <ul className="list-disc ml-5 space-y-1">

              <li>
                Deductions reduce an employee's gross pay to determine the final net pay.
              </li>

              <li>
                Typical deductions include PAYE, NSSF, SHA, SACCO contributions and loan repayments.
              </li>

              <li>
                Each deduction is linked to a deduction type for payroll reporting.
              </li>

              <li>
                During payroll processing these records will normally be generated automatically.
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