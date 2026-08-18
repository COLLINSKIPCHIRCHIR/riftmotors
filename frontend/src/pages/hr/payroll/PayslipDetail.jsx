import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPrint } from "react-icons/fa";
import {
  getPayslip,
  getPayslipEarningsByPayslip,
  getPayslipDeductionsByPayslip,
} from "../../../api/hrApi";

const currency = (n) =>
  Number(n || 0).toLocaleString("en-KE", { style: "currency", currency: "KES" });

const PayslipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payslip, setPayslip] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [payslipRes, earningsRes, deductionsRes] = await Promise.all([
          getPayslip(id),
          getPayslipEarningsByPayslip(id),
          getPayslipDeductionsByPayslip(id),
        ]);

        setPayslip(payslipRes.data);
        setEarnings(earningsRes.data);
        setDeductions(deductionsRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load payslip.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) return <p className="text-sm text-slate-400">Loading payslip...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!payslip) return null;

  const totalEarnings = earnings.reduce((t, e) => t + Number(e.amount || 0), 0);
  const totalDeductions = deductions.reduce((t, d) => t + Number(d.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <FaArrowLeft size={12} /> Back
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg"
        >
          <FaPrint size={12} /> Print
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl mx-auto print:border-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div>
            <p className="font-bold text-slate-800">Rift Motors Ltd</p>
            <p className="text-xs text-slate-500">Payslip</p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              payslip.status === "Paid"
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {payslip.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-6">
          <div>
            <p className="text-slate-400 text-xs">Employee</p>
            <p className="font-medium text-slate-700">
              {payslip.first_name} {payslip.last_name}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Employee No.</p>
            <p className="font-medium text-slate-700">{payslip.employee_number}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Pay Period</p>
            <p className="font-medium text-slate-700">{payslip.period_label}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Paid On</p>
            <p className="font-medium text-slate-700">
              {payslip.paid_at ? payslip.paid_at.slice(0, 10) : "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Earnings
            </p>
            <table className="w-full text-sm">
              <tbody>
                {earnings.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-600">{e.description}</td>
                    <td className="py-1.5 text-right text-slate-700">
                      {currency(e.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 font-semibold">
                  <td className="py-2 text-slate-700">Total Earnings</td>
                  <td className="py-2 text-right text-slate-800">
                    {currency(totalEarnings)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Deductions
            </p>
            <table className="w-full text-sm">
              <tbody>
                {deductions.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-600">{d.description}</td>
                    <td className="py-1.5 text-right text-slate-700">
                      {currency(d.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 font-semibold">
                  <td className="py-2 text-slate-700">Total Deductions</td>
                  <td className="py-2 text-right text-slate-800">
                    {currency(totalDeductions)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
          <span className="text-sm text-slate-500">Unpaid Leave Days</span>
          <span className="text-sm text-slate-700">
            {payslip.unpaid_leave_days} ({currency(payslip.unpaid_leave_deduction)})
          </span>
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-base font-bold text-slate-800">Net Pay</span>
          <span className="text-lg font-bold text-blue-600">
            {currency(payslip.net_pay)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PayslipDetail;