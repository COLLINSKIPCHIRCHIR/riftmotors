import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome, FaCar, FaCogs, FaTools, FaTint,
  FaUsers, FaReceipt, FaBoxOpen, FaChartBar,
  FaCog, FaSignOutAlt, FaBars, FaTimes,
  FaChevronDown, FaChevronUp, FaBell, FaUserTie
} from "react-icons/fa";
import { hasPermission } from "../utils/permissions";


const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (location.pathname.startsWith("/admin/vehicles")) {
      setOpenMenus((p) => ({ ...p, vehicleSales: true }));
    }
    if (location.pathname.startsWith("/admin/spare-parts")) {
      setOpenMenus((p) => ({ ...p, spareParts: true }));
    }
    if(location.pathname.startsWith("/admin/services")){
    setOpenMenus(p=>({
      ...p,
      services:true
    }))
    }
    if (location.pathname.startsWith("/admin/customers")) {
      setOpenMenus((p) => ({ ...p, customers: true }));
    }
    if (location.pathname.startsWith("/admin/hr")) {
      setOpenMenus((p) => ({
        ...p,
        hr: true,
      }));
    }
  }, [location.pathname]);

  const toggleMenu = (key) =>
    setOpenMenus((p) => ({ ...p, [key]: !p[key] }));

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  const isParentActive = (path) => location.pathname.startsWith(path);

  const menuItems = [
    {
      name: "Dashboard",
      icon: <FaHome size={16} />,
      path: "/admin/dashboard",
    },
    {
      name: "Vehicle Sales",
      icon: <FaCar size={16} />,
      key: "vehicleSales",
      permission: "vehicles.view",

      subMenu: [
        {
          name: "All Vehicles",
          path: "/admin/vehicles",
          permission: "vehicles.view",
        },
        {
          name: "Add Vehicle",
          path: "/admin/vehicles/add",
          permission: "vehicles.create",
        },
        {
          name: "Sell Vehicle",
          path: "/admin/vehicles/sell",
          permission: "vehicles.sell",
        },
      ],
    },
    {
      name: "Customers",
      icon: <FaUsers size={16} />,
      key: "customers",
      permission: "customers.view",

      subMenu: [
        {
          name: "All Customers",
          path: "/admin/customers",
          permission: "customers.view",
        },
        {
          name: "Add Customer",
          path: "/admin/customers/new",
          permission: "customers.create",
        },
      ],
    },
    {
      name: "Spare Parts",
      icon: <FaCogs size={16} />,
      key: "spareParts",
      permission: "spareparts.view",

      subMenu: [
        {
          name: "Inventory",
          path: "/admin/spare-parts/inventory",
          permission: "spareparts.view",
        },
        {
          name: "Add Part",
          path: "/admin/spare-parts/add",
          permission: "spareparts.create",
        },
        {
          name: "Sell Parts",
          path: "/admin/spare-parts/sell",
          permission: "spareparts.sell",
        },
        {
          name: "Estimates",
          path: "/admin/spare-parts/estimates",
          permission: "spareparts.estimates",
        },
        {
          name: "Invoices",
          path: "/admin/spare-parts/invoices",
          permission: "spareparts.invoices",
        },
        {
          name: "Receipts",
          path: "/admin/spare-parts/receipts",
          permission: "spareparts.receipts",
        },
        {
          name: "Purchase Orders",
          path: "/admin/spare-parts/purchases",
          permission: "spareparts.purchase",
        },
        {
          name: "Create LPO",
          path: "/admin/spare-parts/purchases/create",
          permission: "spareparts.purchase",
        },
        {
          name: "Suppliers",
          path: "/admin/spare-parts/suppliers",
          permission: "spareparts.view",
        },
      ],
    },
    {
    name: "Service & Repairs",
    icon: <FaTools size={16} />,
    key: "services",
    permission: "services.view",

    subMenu:[
        {
            name:"Workshop Dashboard",
            path:"/admin/services",
            permission:"services.view"
        },
        {
            name:"Service Jobs",
            path:"/admin/services/jobs",
            permission:"services.jobs"
        },
        {
            name:"Customer Vehicles",
            path:"/admin/services/vehicles",
            permission:"services.vehicles"
        },
        {
            name:"Service Catalog",
            path:"/admin/services/catalog",
            permission:"services.catalog"
        },
        {
            name:"Mechanics",
            path:"/admin/services/mechanics",
            permission:"services.mechanics"
        },
        {
            name:"Estimates",
            path:"/admin/services/estimates",
            permission:"services.estimates"
        },
        {
            name:"Invoices",
            path:"/admin/services/invoices",
            permission:"services.invoices"
        },
        {
            name:"Receipts",
            path:"/admin/services/receipts",
            permission:"services.receipts"
        },
        {
            name:"Credit Notes",
            path:"/admin/services/credit-notes",
            permission:"services.creditnotes"
        },
        {
          name: "Daily Job Report",
          path: "/admin/services/reports/daily",
          permission: "services.jobs"
        },
        ]
    },

   {
  name: "Human Resource",
  icon: <FaUserTie size={16} />,
  key: "hr",
  permission: "employees.view", 

  subMenu: [
    { name: "Departments", path: "/admin/hr/departments", permission: "departments.view" },
    { name: "Branches", path: "/admin/hr/branches", permission: "branches.view" },
    { name: "Employees", path: "/admin/hr/employees", permission: "employees.view" },

    { name: "Leave Types", path: "/admin/hr/leave-types"  },
    { name: "Leave Balances", path: "/admin/hr/leave-balances" },
    { name: "Leave Requests", path: "/admin/hr/leave-requests" },
    { name: "Public Holidays", path: "/admin/hr/public-holidays" },
    { name: "Attendance", path: "/admin/hr/attendance" },

    { name: "Salary History", path: "/admin/hr/salary-history" },
    { name: "Employee Allowances", path: "/admin/hr/employee-allowances" },

    { name: "Deduction Types", path: "/admin/hr/deduction-types" },
    { name: "Deduction Rates", path: "/admin/hr/deduction-rate-versions"},
    { name: "Recurring Deductions", path: "/admin/hr/recurring-deductions"},

    { name: "PAYE Tax Bands", path: "/admin/hr/paye-tax-bands" },
    { name: "PAYE Personal Relief", path: "/admin/hr/paye-personal-relief"},

    { name: "Payroll Periods", path: "/admin/hr/payroll-periods" },
    { name: "Payslips", path: "/admin/hr/payslips"},
  ],
},

    {
        name: "Administration",
        icon: <FaCog size={16} />,
        key: "administration",
        permission: "settings.view",

        subMenu: [
            {
                name: "Users",
                path: "/admin/users",
                permission: "users.view"
            },
            {
                name: "Roles & Permissions",
                path: "/admin/roles",
                permission: "roles.view"
            },
            {
                name: "Settings",
                path: "/admin/settings",
                permission: "settings.view"
            }
        ]
    },

    { name: "Car Wash", icon: <FaTint size={16} />, path: "/admin/car-wash" , permission: "carwash.view",},
    { name: "Sales & Transactions", icon: <FaReceipt size={16} />, path: "/admin/sales" ,  permission: "sales.view",},
    { name: "Inventory", icon: <FaBoxOpen size={16} />, path: "/admin/inventory", permission: "inventory.view", },
    { name: "Reports", icon: <FaChartBar size={16} />, path: "/admin/reports", permission: "reports.view", },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden ">

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed md:static z-20 top-0 left-0 h-screen w-64 print:hidden bg-slate-900 text-slate-100
          flex flex-col transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <FaCar size={14} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Rift Motors</p>
              <p className="text-slate-400 text-xs">Management System</p>
            </div>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <FaTimes size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems
          .filter((item) => {
            if (!item.permission) return true;

            return hasPermission(item.permission);
          })
          .map((item, i) => (
            <div key={i}>
              {item.subMenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors
                      ${isParentActive(
                        `/admin/${
                          item.key === "vehicleSales"
                            ? "vehicles"
                            : item.key === "spareParts"
                            ? "spare-parts"
                            : item.key === "services"
                            ? "services"
                            : item.key
                        }`
                      )
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </span>
                    <span className="text-slate-400">
                      {openMenus[item.key] ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                    </span>
                  </button>

                  {openMenus[item.key] && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-700 pl-3">
                      {item.subMenu
                        .filter((sub) => {
                          if (!sub.permission) return true;

                          return hasPermission(sub.permission);
                        })
                        .map((sub, j) => (
                        <button
                          key={j}
                          onClick={() => { navigate(sub.path); setSidebarOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors
                            ${isActive(sub.path)
                              ? "bg-blue-600/20 text-blue-400 font-medium"
                              : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors
                    ${isActive(item.path)
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-slate-700 p-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{user?.username || "Admin"}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role || "admin"}</p>
            </div>
          </div>
          {/*{
            hasPermission("settings.view") && (

            <button
            onClick={()=>navigate("/admin/settings")}
            className="..."
            >

            <FaCog size={14}/>
            Settings

            </button>

            )
            }*/}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:text-white hover:bg-red-600/20"
          >
            <FaSignOutAlt size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-600" onClick={() => setSidebarOpen(true)}>
              <FaBars size={20} />
            </button>
            {/* Breadcrumb */}
            <div className="hidden sm:block">
              <p className="text-sm text-slate-500">
                {location.pathname
                  .split("/")
                  .filter(Boolean)
                  .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "))
                  .join(" › ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
              <FaBell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {user?.username?.[0]?.toUpperCase() || "A"}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700">
                {user?.username || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;