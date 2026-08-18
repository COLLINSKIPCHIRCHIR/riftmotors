import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaFileInvoice } from "react-icons/fa";
import {
  getPayslips,
  getPayslipsByPayrollPeriod,
  markPayslipPaid,
} from "../../../api/hrApi";

const statusStyles = {
  Draft: "bg-slate-100 text-slate-600",
  Approved: "bg-amber-100 text-amber-700",
  Paid: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const currency = (n) =>
  Number(n || 0).toLocaleString("en-KE", { style: "currency", currency: "KES" });

const PayslipsList = () => {
  const [searchParams] = useSearchParams();
  const periodId = searchParams.get("period");
  const navigate = useNavigate();

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = periodId
        ? await getPayslipsByPayrollPeriod(periodId)
        : await getPayslips();

      setPayslips(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load payslips.");
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkPaid = async (e, id) => {
    e.stopPropagation();
    setPayingId(id);

    try {
      await markPayslipPaid(id);
      await load();
    } catch (err) {
      console.error(err);
      setError("Failed to mark payslip as paid.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Payslips</h1>
        <p className="text-sm text-slate-500">
          {periodId ? "Payslips for the selected payroll period." : "All payslips."}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Employee</th>
              <th className="text-left px-4 py-3">Period</th>
              <th className="text-right px-4 py-3">Gross Pay</th>
              <th className="text-right px-4 py-3">Net Pay</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : payslips.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No payslips found.
                </td>
              </tr>
            ) : (
              payslips.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/admin/hr/payslips/${p.id}`)}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-slate-700 flex items-center gap-2">
                    <FaFileInvoice className="text-slate-400" size={12} />
                    {p.first_name} {p.last_name}
                    <span className="text-xs text-slate-400">
                      ({p.employee_number})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.period_label || "—"}</td>
                  <td className="px-4 py-3 text-right">{currency(p.gross_pay)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {currency(p.net_pay)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusStyles[p.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status !== "Paid" && p.status !== "Cancelled" && (
                      <button
                        onClick={(e) => handleMarkPaid(e, p.id)}
                        disabled={payingId === p.id}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white disabled:opacity-50"
                      >
                        <FaCheckCircle size={10} />
                        {payingId === p.id ? "Marking..." : "Mark Paid"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayslipsList;