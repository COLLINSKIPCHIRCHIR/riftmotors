import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";
import toast from "react-hot-toast";
import {
  FaEdit, FaFileInvoiceDollar, FaCar, FaTools,
  FaHistory, FaPhone, FaEnvelope, FaMapMarkerAlt
} from "react-icons/fa";

const money = (v) =>
  Number(v || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 });

const DOC_LABELS = {
  service_invoice: "Service Invoice",
  service_payment: "Service Payment",
  spare_invoice: "Spare Parts Invoice",
  spare_payment: "Spare Parts Payment",
};

const STATUS_STYLES = {
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-amber-100 text-amber-700",
  credited: "bg-slate-100 text-slate-700",
  cancelled: "bg-slate-100 text-slate-500",
  completed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600"}`}>
    {status?.replace("_", " ") || "—"}
  </span>
);

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`/customers/${id}/360`);
        setData(res.data);
      } catch {
        toast.error("Failed to load customer");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-slate-400">Loading customer...</div>;
  if (!data) return <div className="p-6 text-slate-400">Customer not found</div>;

  const { customer, vehicles, jobs, billedJobs = [], financials, activity } = data;
  const totalOutstanding =
    Number(financials.service.outstanding) + Number(financials.spareparts.outstanding);
  const totalRevenue =
    Number(financials.service.lifetime_revenue) + Number(financials.spareparts.lifetime_revenue);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
              {customer.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                {customer.phone && <span className="flex items-center gap-1"><FaPhone size={11} />{customer.phone}</span>}
                {customer.email && <span className="flex items-center gap-1"><FaEnvelope size={11} />{customer.email}</span>}
                {customer.address && <span className="flex items-center gap-1"><FaMapMarkerAlt size={11} />{customer.address}</span>}
              </div>
              {customer.kra_pin && (
                <p className="text-xs text-slate-400 mt-1">KRA PIN: {customer.kra_pin}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/admin/customers/${id}/statement`)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700"
            >
              <FaFileInvoiceDollar size={12} /> Statement
            </button>
            <button
              onClick={() => navigate(`/admin/customers/edit/${id}`)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              <FaEdit size={12} /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* FINANCIAL SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Outstanding", value: `KES ${money(totalOutstanding)}`, accent: totalOutstanding > 0 ? "text-red-600" : "text-slate-800" },
          { label: "Lifetime Revenue", value: `KES ${money(totalRevenue)}` },
          { label: "Service Outstanding", value: `KES ${money(financials.service.outstanding)}` },
          { label: "Spare Parts Outstanding", value: `KES ${money(financials.spareparts.outstanding)}` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.accent || "text-slate-800"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* VEHICLES */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <FaCar className="text-slate-400" size={14} />
            <h2 className="font-semibold text-slate-800">Vehicles ({vehicles.length})</h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {vehicles.length === 0 ? (
              <p className="px-6 py-6 text-sm text-slate-400">No vehicles on file</p>
            ) : vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => navigate(`/admin/services/vehicles/${v.id}`)}
                className="w-full text-left px-6 py-3 hover:bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{v.registration_number}</p>
                  <p className="text-xs text-slate-500">{v.make} {v.model} {v.year ? `(${v.year})` : ""}</p>
                </div>
                <span className="text-xs text-slate-400">{v.color || ""}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SERVICE JOBS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <FaTools className="text-slate-400" size={14} />
            <h2 className="font-semibold text-slate-800">Service Jobs ({jobs.length})</h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {jobs.length === 0 ? (
              <p className="px-6 py-6 text-sm text-slate-400">No service jobs yet</p>
            ) : jobs.map((j) => (
              <button
                key={j.id}
                onClick={() => navigate(`/admin/services/jobs/${j.id}`)}
                className="w-full text-left px-6 py-3 hover:bg-slate-50 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {j.job_number} &middot; {j.registration_number}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{j.complaint}</p>
                </div>
                <StatusBadge status={j.status} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BILLED TO YOU JOBS */}
      {billedJobs && billedJobs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <FaFileInvoiceDollar className="text-emerald-600" size={14} />
            <h2 className="font-semibold text-slate-800">Billed to You ({billedJobs.length})</h2>
          </div>
          <p className="px-6 pt-3 text-xs text-slate-500">
            Work done on someone else's vehicle, where {customer.name} was set as the payer.
          </p>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto mt-1">
            {billedJobs.map((j) => (
              <button
                key={j.id}
                onClick={() => navigate(`/admin/services/jobs/${j.id}`)}
                className="w-full text-left px-6 py-3 hover:bg-slate-50 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {j.job_number} &middot; {j.registration_number}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {j.make} {j.model} — vehicle owner: {j.vehicle_owner_name}
                  </p>
                </div>
                <StatusBadge status={j.status} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <FaHistory className="text-slate-400" size={14} />
          <h2 className="font-semibold text-slate-800">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Date", "Type", "Reference", "Amount", "Status"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activity.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">No activity yet</td></tr>
              ) : activity.map((a, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm text-slate-600">
                    {new Date(a.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-800">{DOC_LABELS[a.doc_type] || a.doc_type}</td>
                  <td className="px-6 py-3 text-sm text-slate-500 font-mono">{a.reference}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-slate-800">
                    {a.doc_type.includes("payment") ? "-" : ""}KES {money(a.amount)}
                  </td>
                  <td className="px-6 py-3">{a.status && <StatusBadge status={a.status} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}