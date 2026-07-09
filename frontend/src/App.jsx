import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

// ✅ Import admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AddVehicle from "./pages/AddVehicle";
import VehicleInventory from "./pages/VehicleInventory";
import SellVehicle from "./pages/SellVehicle";
import SpareParts from "./pages/SpareParts";
import Services from "./pages/Services";
import CarWash from "./pages/CarWash";
import SalesTransactions from "./pages/SalesTransactions";
import Employees from "./pages/Employees";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";

import AddSparePart from "./pages/spareparts/AddSparePart";
import SparepartsInventory from "./pages/spareparts/SparePartsInventory";
import SellSpareParts from "./pages/spareparts/SellSpareParts";
import CreateEstimate from "./pages/spareparts/CreateEstimate";
import EstimateDetails from "./pages/spareparts/EstimateDetails";
import SpareEstimates from "./pages/spareparts/SpareEstimates";
import SpareReceipts from "./pages/spareparts/SpareReceipts";
import ViewReceipt from "./pages/spareparts/ViewReceipts";
import SpareInvoices from "./pages/spareparts/SpareInvoices";
import InvoiceDetails from "./pages/spareparts/InvoiceDetails";
import EditEstimate from "./pages/spareparts/EditEstimate";
import Suppliers from "./pages/spareparts/Suppliers";
import StockHistory from "./pages/spareparts/StockHistory";
import CreatePurchase from "./pages/spareparts/CreatePurchase";
import EditSparePart from "./pages/spareparts/EditSparePart";

import ServiceDashboard from "./pages/services/ServiceDashboard";
import ServiceJobs from "./pages/services/ServiceJobs";
import CustomerVehicles from "./pages/services/CustomerVehicles";
import ServiceCatalog from "./pages/services/ServiceCatalog";
import JobDetails from "./pages/services/JobDetails";
import VehicleDetails from "./pages/services/VehicleDetails";
import CreateJob from "./pages/services/CreateJob";
import Mechanics from "./pages/services/Mechanics";
import ServiceEstimateDetails from "./pages/services/ServiceEstimateDetails";
import ServiceEstimates from "./pages/services/ServiceEstimates";
import ServiceInvoices from "./pages/services/ServiceInvoices";
import ServiceInvoiceDetails from "./pages/services/ServiceInvoiceDetails";
import ServiceReceipts from "./pages/services/ServiceReceipts";
import ServiceReceiptDetails from "./pages/services/ServiceReceiptDetails";
import RolesPermissions from "./pages/admin/RolesPermissions";
import Users from "./pages/admin/Users";

import CustomersList from "./pages/customers/CustomersList";
import AddCustomer from "./pages/customers/AddCustomer";



function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Admin routes with layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role={[
                "Boss",
                "Manager",
                "admin",
                "Sales Manager",
                "Service Advisor",
                "Accountant"
            ]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          {/* ✅ Vehicle Sales Dropdown Pages */}
          <Route path="vehicles/add" element={<AddVehicle />} />
          <Route path="vehicles" element={<VehicleInventory />} />
          <Route path="vehicles/sell" element={<SellVehicle />} />
          <Route path="customers" element={<CustomersList />} />
          <Route path="customers/new" element={<AddCustomer />} />

          {/* ✅ Unified Inventory */}
          <Route path="inventory" element={<Inventory />} />
          {/* ✅ Other Admin Pages */}
          <Route path="spare-parts" element={<SpareParts />} />
          <Route 
          path="services"
          element={<ServiceDashboard/>}
          />


          <Route
          path="services/jobs"
          element={<ServiceJobs/>}
          />


          <Route
          path="services/vehicles"
          element={<CustomerVehicles/>}
          />


          <Route
          path="services/catalog"
          element={<ServiceCatalog/>}
          />

          <Route 
          path="services/jobs/create"
          element={<CreateJob/>}
          />

          <Route
          path="services/jobs/:id"
          element={<JobDetails/>}
          />

          <Route
          path="services/vehicles/:id"
          element={<VehicleDetails />}
          />

          <Route
          path="services/mechanics"
          element={<Mechanics/>}
          />

          <Route
          path="services/estimates/:id"
          element={<ServiceEstimateDetails/>}
          />

          <Route
          path="services/estimates"
          element={<ServiceEstimates/>}
          />

          <Route
          path="services/invoices"
          element={<ServiceInvoices/>}
          />


          <Route
          path="services/invoices/:id"
          element={<ServiceInvoiceDetails/>}
          />

          <Route
          path="services/receipts"
          element={<ServiceReceipts/>}
          />


          <Route
          path="services/receipts/:id"
          element={<ServiceReceiptDetails/>}
          />

          <Route
              path="roles"
              element={<RolesPermissions />}
          />


          <Route
              path="users"
              element={<Users />}
          />
          




          <Route path="car-wash" element={<CarWash />} />
          <Route path="sales" element={<SalesTransactions />} />
          <Route path="employees" element={<Employees />} />
          <Route path="reports" element={<Reports />} />

          <Route path="spare-parts/add" element={<AddSparePart />} />
          <Route path="spare-parts/inventory" element={<SparepartsInventory />} />
          <Route path="spare-parts/sell" element={<SellSpareParts />} />
          <Route path="spare-parts/suppliers" element={<Suppliers />} />
          <Route path="spare-parts/estimates" element={<SpareEstimates />} />
          <Route path="spare-parts/estimates/create" element={<CreateEstimate />} />
          <Route path="spare-parts/estimates/:id" element={<EstimateDetails />} />
          <Route path="spare-parts/edit/:id" element={<EditSparePart />} />
          <Route
            path="spare-parts/estimates/:id/edit"
            element={<EditEstimate />}
          />
          <Route
            path="spare-parts/history/:id"
            element={<StockHistory />}
          />
          <Route
            path="spare-parts/purchases/create"
            element={<CreatePurchase />}
          />


          <Route path="spare-parts/invoices" element={<SpareInvoices />} />
          <Route path="spare-parts/invoices/:id" element={<InvoiceDetails />} />

          {/* ✅ Spare Parts Receipts */}
          <Route path="spare-parts/receipts" element={<SpareReceipts />} />
          <Route path="spare-parts/receipts/:id" element={<ViewReceipt />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
