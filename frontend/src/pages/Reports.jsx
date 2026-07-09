import React, { useEffect, useState } from "react";
import API from "../api/api";
import toast from "react-hot-toast";

export default function Reports() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split("T")[0];

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [summary, setSummary] = useState(null);
  const [byDay, setByDay] = useState([]);
  const [topParts, setTopParts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [sumRes, dayRes, topRes] = await Promise.all([
        API.get(`/reports/sales-summary?from=${from}&to=${to}`),
        API.get(`/reports/sales-by-day?from=${from}&to=${to}`),
        API.get(`/reports/top-parts?from=${from}&to=${to}&limit=10`),
      ]);
      setSummary(sumRes.data);
      setByDay(dayRes.data);
      setTopParts(topRes.data);
    } catch {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const money = (v) =>
    Number(v || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Reports</h1>
          <p className="text-sm text-slate-500">Spare parts revenue analytics</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchReports}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
        </div>
      </div>

      {summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: `Ksh ${money(summary.revenue)}` },
              { label: "Total Sales", value: summary.total_sales },
              { label: "Total Discounts", value: `Ksh ${money(summary.total_discounts)}` },
              { label: "Avg Sale Value", value: `Ksh ${money(summary.avg_sale_value)}` },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Sales by Day */}
          {byDay.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Sales by Day</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Sales</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {byDay.map((row) => (
                      <tr key={row.day} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm text-slate-800">
                          {new Date(row.day).toLocaleDateString("en-KE", {
                            weekday: "short", month: "short", day: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">{row.sales_count}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-slate-800">
                          Ksh {money(row.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Parts */}
          {topParts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Top Selling Parts</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["#", "Part Name", "Part No", "Units Sold", "Revenue"].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {topParts.map((part, i) => (
                      <tr key={part.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm text-slate-500">{i + 1}</td>
                        <td className="px-6 py-3 text-sm font-medium text-slate-800">{part.name}</td>
                        <td className="px-6 py-3 text-sm text-slate-500 font-mono">{part.part_number}</td>
                        <td className="px-6 py-3 text-sm text-slate-600">{part.total_sold}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-slate-800">
                          Ksh {money(part.total_revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}