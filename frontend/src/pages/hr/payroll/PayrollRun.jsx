import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaPlayCircle,
  FaExclamationTriangle,
  FaLock,
} from "react-icons/fa";
import {
  getPayrollPeriod,
  previewPayrollPeriod,
  runPayrollPeriod,
  getPayrollPeriodResult,
  closePayrollPeriod,
} from "../../../api/hrApi";

const currency = (n) =>
  Number(n || 0).toLocaleString("en-KE", { style: "currency", currency: "KES" });

const SummaryCard = ({ label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-lg font-bold text-slate-800">{value}</p>
  </div>
);

const PayrollRun = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [period, setPeriod] = useState(null);
  const [calculations, setCalculations] = useState([]);
  const [errors, setErrors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [payslips, setPayslips] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const load = useCallback(async () => {
    setLoading(true);
    setActionError("");

    try {
      const periodRes = await getPayrollPeriod(id);
      const periodData = periodRes.data;
      setPeriod(periodData);

      if (periodData.status === "Open") {
        const previewRes = await previewPayrollPeriod(id);
        setCalculations(previewRes.data.data.calculations);
        setErrors(previewRes.data.data.errors);
      } else {
        const resultRes = await getPayrollPeriodResult(id);
        setSummary(resultRes.data.data.summary);
        setPayslips(resultRes.data.data.payslips);
      }
    } catch (err) {
      console.error(err);
      setActionError("Failed to load payroll period.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleProcess = async () => {
    setProcessing(true);
    setActionError("");

    try {
      await runPayrollPeriod(id, user?.id);
      navigate(`/admin/hr/payslips?period=${id}`);
    } catch (err) {
      console.error(err);
      setActionError(
        err?.response?.data?.message || "Failed to process payroll."
      );
      await load();
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm("Close this payroll period? This cannot be undone.")) {
      return;
    }

    try {
      await closePayrollPeriod(id);
      await load();
    } catch (err) {
      console.error(err);
      setActionError("Failed to close payroll period.");
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400">Loading payroll period...</p>;
  }

  if (!period) {
    return <p className="text-sm text-red-500">Payroll period not found.</p>;
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate("/admin/hr/payroll-periods")}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <FaArrowLeft size={12} /> Back to Payroll Periods
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            {period.period_label}
          </h1>
          <p className="text-sm text-slate-500">
            {period.start_date?.slice(0, 10)} — {period.end_date?.slice(0, 10)} ·
            Status: <span className="font-medium">{period.status}</span>
          </p>
        </div>

        <div className="flex gap-2">
          {period.status === "Open" && (
            <button
              onClick={handleProcess}
              disabled={processing || errors.length > 0 || calculations.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50"
            >
              <FaPlayCircle size={14} />
              {processing ? "Processing..." : "Process Payroll"}
            </button>
          )}

          {period.status === "Processed" && (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm rounded-lg"
            >
              <FaLock size={12} /> Close Period
            </button>
          )}
        </div>
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {period.status === "Open" && (
        <>
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-red-700 mb-2">
                <FaExclamationTriangle size={14} />
                {errors.length} employee(s) have calculation errors — fix these
                before processing.
              </p>
              <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
                {errors.map((e) => (
                  <li key={e.employee_id}>
                    {e.employee_name} ({e.employee_number}): {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Employee</th>
                  <th className="text-right px-4 py-3">Gross Pay</th>
                  <th className="text-right px-4 py-3">Statutory</th>
                  <th className="text-right px-4 py-3">Other Deductions</th>
                  <th className="text-right px-4 py-3">PAYE</th>
                  <th className="text-right px-4 py-3">Net Pay</th>
                </tr>
              </thead>
              <tbody>
                {calculations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No eligible employees for this period.
                    </td>
                  </tr>
                ) : (
                  calculations.map((c) => (
                    <tr key={c.employee.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {c.employee.first_name} {c.employee.last_name}
                        <span className="block text-xs text-slate-400">
                          {c.employee.employee_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{currency(c.gross_pay)}</td>
                      <td className="px-4 py-3 text-right">
                        {currency(c.total_statutory_deductions)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {currency(c.total_other_deductions)}
                      </td>
                      <td className="px-4 py-3 text-right">{currency(c.paye_amount)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {currency(c.net_pay)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {period.status !== "Open" && (
        <>
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SummaryCard label="Employees" value={summary.employee_count} />
              <SummaryCard label="Gross Pay" value={currency(summary.gross_pay)} />
              <SummaryCard
                label="Total Deductions"
                value={currency(
                  Number(summary.statutory_deductions) +
                    Number(summary.other_deductions)
                )}
              />
              <SummaryCard label="Net Pay" value={currency(summary.net_pay)} />
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => navigate(`/admin/hr/payslips?period=${id}`)}
              className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-white"
            >
              View Payslips ({payslips.length})
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PayrollRun;