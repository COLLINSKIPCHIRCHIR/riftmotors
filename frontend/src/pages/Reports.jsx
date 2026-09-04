import React, { useEffect, useState } from "react";
import { getBusinessInvoiceReport } from "../api/reports";
import toast from "react-hot-toast";

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

const TYPES = [
  { key: "both", label: "All" },
  { key: "service", label: "Services" },
  { key: "sparepart", label: "Spare Parts" },
];

export default function Reports() {
  const [preset, setPreset] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("both");

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [range, setRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(false);

  const money = (v) =>
    Number(v || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 });

  const fetchReport = async () => {
    setLoading(true);
    try {
      // explicit dates override preset — mirrors backend resolveDateRange logic
      const params = from && to ? { from, to, type } : { preset, type };
      const res = await getBusinessInvoiceReport(params);
      setRows(res.data.rows);
      setSummary(res.data.summary);
      setRange({ from: res.data.from, to: res.data.to });
    } catch (err) {
      toast.error("Failed to load invoice report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePresetClick = (p) => {
    setPreset(p);
    setFrom("");
    setTo("");
  };

  const statusBadge = (status) => {
    const styles = {
      paid: "bg-green-100 text-green-700",
      partial: "bg-amber-100 text-amber-700",
      unpaid: "bg-red-100 text-red-700",
      cancelled: "bg-slate-100 text-slate-500",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-slate-100 text-slate-600"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Invoice Reports</h1>
        <p className="text-sm text-slate-500">
          Services and spare parts invoices — filter by period or custom date range
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePresetClick(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
                ${!from && !to && preset === p.key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom range + type + submit */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">From (custom)</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">To (custom)</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${type === t.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Apply"}
          </button>
        </div>

        {range.from && (
          <p className="text-xs text-slate-400">
            Showing {range.from} to {range.to}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Invoiced", value: `Ksh ${money(summary.total_invoiced)}` },
            { label: "Total Paid", value: `Ksh ${money(summary.total_paid)}` },
            { label: "Outstanding", value: `Ksh ${money(summary.total_outstanding)}` },
            { label: "Invoice Count", value: summary.count },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Invoices</h2>
        </div>

        {rows.length === 0 && !loading ? (
          <p className="px-6 py-8 text-sm text-slate-400 text-center">
            No invoices found for this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "Type", "Invoice #", "Customer", "Date", "Total",
                    "Paid", "Balance", "Status", "Receipt #", "Payment Method"
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((r) => (
                  <tr key={`${r.type}-${r.id}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm capitalize text-slate-600">{r.type}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">{r.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.customer_name || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">Ksh {money(r.total)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">Ksh {money(r.amount_paid)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className={Number(r.balance) > 0 ? "text-red-600 font-medium" : "text-slate-400"}>
                        Ksh {money(r.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{r.receipt_number || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 capitalize whitespace-nowrap">{r.payment_method || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}