import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxOpen, FaShoppingCart, FaUsers,
  FaExclamationTriangle, FaFileInvoice,
  FaArrowUp, FaArrowRight
} from "react-icons/fa";
import API from "../api/api";
import { hasPermission } from "../utils/permissions";

const StatCard = ({ title, value, sub, icon, color, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 
      ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, lowStockRes] = await Promise.all([
          API.get("/reports/dashboard"),
          API.get("/reports/low-stock"),
        ]);
        setStats(statsRes.data);
        setLowStock(lowStockRes.data);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString("en-KE", {
              weekday: "long", year: "numeric",
              month: "long", day: "numeric"
            })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={`Ksh ${Number(stats?.today_revenue || 0).toLocaleString()}`}
          sub={`${stats?.today_sales || 0} sales today`}
          icon={<FaShoppingCart className="text-green-600" size={18} />}
          color="bg-green-50"
          onClick={() => navigate("/admin/spare-parts/receipts")}
        />
        <StatCard
          title="Pending Invoices"
          value={stats?.pending_invoices || 0}
          sub="Awaiting payment"
          icon={<FaFileInvoice className="text-blue-600" size={18} />}
          color="bg-blue-50"
          onClick={() => navigate("/admin/spare-parts/invoices")}
        />
        <StatCard
          title="Total Parts"
          value={stats?.total_parts || 0}
          sub="In inventory"
          icon={<FaBoxOpen className="text-purple-600" size={18} />}
          color="bg-purple-50"
          onClick={() => navigate("/admin/spare-parts/inventory")}
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats?.low_stock_count || 0}
          sub="Need restocking"
          icon={<FaExclamationTriangle className="text-red-500" size={18} />}
          color="bg-red-50"
        />
      </div>

      {/* Low Stock Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500" size={14} />
            <h2 className="font-semibold text-slate-800">Low Stock Alerts</h2>
          </div>
          <button
            onClick={() => navigate("/admin/spare-parts/inventory")}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            View All <FaArrowRight size={10} />
          </button>
        </div>

        {lowStock.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-slate-400 text-sm">✅ All parts are well stocked</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Part</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Part No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lowStock.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{item.part_number}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{item.supplier_name || "—"}</td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-red-600">{item.quantity}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                        ${item.quantity === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"}`}>
                        {item.quantity === 0 ? "Out of Stock" : "Low Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {["spareparts.estimates","spareparts.sell","spareparts.create","spareparts.purchase"].some(hasPermission) && (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "New Estimate", path: "/admin/spare-parts/estimates/create", color: "bg-blue-600", permission: "spareparts.estimates" },
          { label: "Sell Parts", path: "/admin/spare-parts/sell", color: "bg-green-600", permission: "spareparts.sell" },
          { label: "Add Part", path: "/admin/spare-parts/add", color: "bg-purple-600", permission: "spareparts.create" },
          { label: "New Purchase", path: "/admin/spare-parts/purchases/create", color: "bg-orange-500", permission: "spareparts.purchase" },
        ]
          .filter((action) => !action.permission || hasPermission(action.permission))
          .map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`${action.color} text-white rounded-xl py-3 px-4 text-sm font-medium hover:opacity-90 transition-opacity`}
            >
              {action.label}
            </button>
          ))}
      </div>
      )}

    </div>
  );
}