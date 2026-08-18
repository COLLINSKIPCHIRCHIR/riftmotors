import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaMoneyCheckAlt } from "react-icons/fa";
import { getPayrollPeriods, createPayrollPeriod } from "../../../api/hrApi";

const statusStyles = {
  Open: "bg-blue-100 text-blue-700",
  Processed: "bg-green-100 text-green-700",
  Closed: "bg-slate-200 text-slate-600",
};

const PayrollPeriods = () => {
  const navigate = useNavigate();

  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    period_label: "",
    start_date: "",
    end_date: "",
  });

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const res = await getPayrollPeriods();
      setPeriods(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load payroll periods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await createPayrollPeriod(form);
      setForm({ period_label: "", start_date: "", end_date: "" });
      setShowForm(false);
      await loadPeriods();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Failed to create payroll period."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Payroll Periods</h1>
          <p className="text-sm text-slate-500">
            Create and run payroll for each pay period.
          </p>
        </div>

        <button
          onClick={() => setShowForm((p) => !p)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <FaPlus size={12} /> New Period
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Period Label
            </label>
            <input
              required
              name="period_label"
              value={form.period_label}
              onChange={handleChange}
              placeholder="e.g. July 2026"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Start Date
            </label>
            <input
              required
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              End Date
            </label>
            <input
              required
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <p className="sm:col-span-3 text-sm text-red-600">{error}</p>
          )}

          <div className="sm:col-span-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Create Period"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Period</th>
              <th className="text-left px-4 py-3">Start</th>
              <th className="text-left px-4 py-3">End</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Processed By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : periods.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No payroll periods yet.
                </td>
              </tr>
            ) : (
              periods.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/admin/hr/payroll/${p.id}`)}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-slate-700 flex items-center gap-2">
                    <FaMoneyCheckAlt className="text-slate-400" size={12} />
                    {p.period_label}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.start_date?.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.end_date?.slice(0, 10)}
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
                  <td className="px-4 py-3 text-slate-500">
                    {p.processed_by_name || "—"}
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

export default PayrollPeriods;