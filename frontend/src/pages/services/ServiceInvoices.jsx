import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getServiceInvoices } from "../../api/serviceApi";
import toast from "react-hot-toast";

const DATE_PRESETS = [
  { key: "all", label: "All Time" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

const STATUSES = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "unpaid", label: "Unpaid" },
];

const money = (v) =>
  Number(v || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 });

const getPresetRange = (preset) => {
  const now = new Date();

  if (preset === "week") {
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const start = new Date(now);
    start.setDate(now.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }

  return null;
};

const statusBadge = (status) => {
  const styles = {
    paid: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    unpaid: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-500",
  };
  const s = (status || "").toLowerCase();
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[s] || "bg-slate-100 text-slate-600"}`}>
      {status || "unknown"}
    </span>
  );
};

const toCSV = (rows) => {
  const headers = ["Invoice #", "Date", "Customer", "Total", "Status"];
  const escape = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.invoice_number, r.created_at, r.customer_name, r.total, r.status]
        .map(escape)
        .join(",")
    ),
  ];
  return lines.join("\n");
};

const ServiceInvoices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [datePreset, setDatePreset] = useState(searchParams.get("period") || "all");
  const [customFrom, setCustomFrom] = useState(searchParams.get("from") || "");
  const [customTo, setCustomTo] = useState(searchParams.get("to") || "");

  const dateError =
    customFrom && customTo && new Date(customTo) < new Date(customFrom)
      ? "'To' date can't be before 'From' date"
      : null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getServiceInvoices();
      setInvoices(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load invoices. Please try again.");
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // keep filters reflected in the URL so the view is shareable/refreshable
  useEffect(() => {
    const params = {};
    if (searchTerm) params.q = searchTerm;
    if (statusFilter !== "all") params.status = statusFilter;
    if (datePreset !== "all") params.period = datePreset;
    if (customFrom) params.from = customFrom;
    if (customTo) params.to = customTo;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, datePreset, customFrom, customTo]);

  const handlePresetClick = (key) => {
    setDatePreset(key);
    setCustomFrom("");
    setCustomTo("");
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDatePreset("all");
    setCustomFrom("");
    setCustomTo("");
  };

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let range = null;
    if (datePreset === "week" || datePreset === "month") {
      range = getPresetRange(datePreset);
    } else if (customFrom && customTo && !dateError) {
      const start = new Date(customFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customTo);
      end.setHours(23, 59, 59, 999);
      range = { start, end };
    }

    return invoices.filter((invoice) => {
      const matchesTerm =
        !term ||
        (invoice.invoice_number || "").toLowerCase().includes(term) ||
        (invoice.customer_name || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (invoice.status || "").toLowerCase() === statusFilter;

      let matchesDate = true;
      if (range && invoice.created_at) {
        const created = new Date(invoice.created_at);
        matchesDate = created >= range.start && created < range.end;
      }

      return matchesTerm && matchesStatus && matchesDate;
    });
  }, [invoices, searchTerm, statusFilter, datePreset, customFrom, customTo, dateError]);

  const summary = useMemo(() => {
    const count = filteredInvoices.length;
    const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + Number(i.total || 0), 0);
    const paid = filteredInvoices.filter((i) => (i.status || "").toLowerCase() === "paid");
    const unpaid = filteredInvoices.filter((i) => (i.status || "").toLowerCase() !== "paid");
    const totalPaid = paid.reduce((sum, i) => sum + Number(i.total || 0), 0);
    const totalOutstanding = unpaid.reduce((sum, i) => sum + Number(i.total || 0), 0);
    return { count, totalInvoiced, totalPaid, totalOutstanding };
  }, [filteredInvoices]);

  const handleExport = () => {
    if (!filteredInvoices.length) return;
    const blob = new Blob([toCSV(filteredInvoices)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `service-invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || datePreset !== "all" || customFrom || customTo;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Service Invoices</h1>
          <p className="text-sm text-slate-500">
            Browse, filter, and export service invoices
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={!filteredInvoices.length || loading}
          className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date presets">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePresetClick(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
                ${!customFrom && !customTo && datePreset === p.key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="from-date" className="block text-xs font-medium text-slate-600 mb-1.5">
              From (custom)
            </label>
            <input
              id="from-date"
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="to-date" className="block text-xs font-medium text-slate-600 mb-1.5">
              To (custom)
            </label>
            <input
              id="to-date"
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatusFilter(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${statusFilter === s.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[220px]">
            <label htmlFor="search" className="block text-xs font-medium text-slate-600 mb-1.5">
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Invoice #, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 pb-2.5"
            >
              Clear filters
            </button>
          )}
        </div>

        {dateError && <p className="text-xs text-red-600">{dateError}</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {!error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Invoice Count", value: summary.count },
            { label: "Total Invoiced", value: `KES ${money(summary.totalInvoiced)}` },
            { label: "Total Paid", value: `KES ${money(summary.totalPaid)}` },
            { label: "Outstanding", value: `KES ${money(summary.totalOutstanding)}` },
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

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <p className="px-6 py-10 text-sm text-slate-400 text-center">
            No invoices match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Invoice", "Date", "Customer", "Total", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {invoice.created_at
                        ? new Date(invoice.created_at).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{invoice.customer_name || "N/A"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                      KES {money(invoice.total)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(invoice.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/services/invoices/${invoice.id}`)}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceInvoices;