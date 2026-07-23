import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import RequirePermission from "./components/RequirePermission";
import AdminLayout from "./layouts/AdminLayout";

// ✅ Import admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AddVehicle from "./pages/AddVehicle";
import VehicleInventory from "./pages/VehicleInventory";
import SellVehicle from "./pages/SellVehicle";
import SpareParts from "./pages/SpareParts";
import Services from "./pages/Services";
import CarWash from "./pages/Carwash";
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
          {/* Dashboard has no permission gate - everyone with admin access lands here */}
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* ✅ Vehicle Sales Dropdown Pages */}
          <Route path="vehicles/add" element={<RequirePermission permission="vehicles.create"><AddVehicle /></RequirePermission>} />
          <Route path="vehicles" element={<RequirePermission permission="vehicles.view"><VehicleInventory /></RequirePermission>} />
          <Route path="vehicles/sell" element={<RequirePermission permission="vehicles.sell"><SellVehicle /></RequirePermission>} />

          {/* ✅ Customers */}
          <Route path="customers" element={<RequirePermission permission="customers.view"><CustomersList /></RequirePermission>} />
          <Route path="customers/new" element={<RequirePermission permission="customers.create"><AddCustomer /></RequirePermission>} />

          {/* ✅ Unified Inventory */}
          <Route path="inventory" element={<RequirePermission permission="inventory.view"><Inventory /></RequirePermission>} />

          {/* ✅ Spare Parts */}
          <Route path="spare-parts" element={<RequirePermission permission="spareparts.view"><SpareParts /></RequirePermission>} />
          <Route path="spare-parts/add" element={<RequirePermission permission="spareparts.create"><AddSparePart /></RequirePermission>} />
          <Route path="spare-parts/inventory" element={<RequirePermission permission="spareparts.view"><SparepartsInventory /></RequirePermission>} />
          <Route path="spare-parts/edit/:id" element={<RequirePermission permission="spareparts.edit"><EditSparePart /></RequirePermission>} />
          <Route path="spare-parts/sell" element={<RequirePermission permission="spareparts.sell"><SellSpareParts /></RequirePermission>} />
          <Route path="spare-parts/suppliers" element={<RequirePermission permission="suppliers.view"><Suppliers /></RequirePermission>} />
          <Route path="spare-parts/estimates" element={<RequirePermission permission="spareparts.estimates"><SpareEstimates /></RequirePermission>} />
          <Route path="spare-parts/estimates/create" element={<RequirePermission permission="spareparts.estimates"><CreateEstimate /></RequirePermission>} />
          <Route path="spare-parts/estimates/:id" element={<RequirePermission permission="spareparts.estimates"><EstimateDetails /></RequirePermission>} />
          <Route path="spare-parts/estimates/:id/edit" element={<RequirePermission permission="spareparts.estimates"><EditEstimate /></RequirePermission>} />
          <Route path="spare-parts/history/:id" element={<RequirePermission permission="spareparts.stock.view"><StockHistory /></RequirePermission>} />
          <Route path="spare-parts/purchases/create" element={<RequirePermission permission="spareparts.purchase"><CreatePurchase /></RequirePermission>} />
          <Route path="spare-parts/invoices" element={<RequirePermission permission="spareparts.invoices"><SpareInvoices /></RequirePermission>} />
          <Route path="spare-parts/invoices/:id" element={<RequirePermission permission="spareparts.invoices"><InvoiceDetails /></RequirePermission>} />
          <Route path="spare-parts/receipts" element={<RequirePermission permission="spareparts.receipts"><SpareReceipts /></RequirePermission>} />
          <Route path="spare-parts/receipts/:id" element={<RequirePermission permission="spareparts.receipts"><ViewReceipt /></RequirePermission>} />

          {/* ✅ Services */}
          <Route path="services" element={<RequirePermission permission="services.view"><ServiceDashboard /></RequirePermission>} />
          <Route path="services/jobs" element={<RequirePermission permission="services.jobs"><ServiceJobs /></RequirePermission>} />
          <Route path="services/jobs/create" element={<RequirePermission permission="services.jobs"><CreateJob /></RequirePermission>} />
          <Route path="services/jobs/:id" element={<RequirePermission permission="services.jobs"><JobDetails /></RequirePermission>} />
          <Route path="services/vehicles" element={<RequirePermission permission="services.vehicles"><CustomerVehicles /></RequirePermission>} />
          <Route path="services/vehicles/:id" element={<RequirePermission permission="services.vehicles"><VehicleDetails /></RequirePermission>} />
          <Route path="services/catalog" element={<RequirePermission permission="services.catalog"><ServiceCatalog /></RequirePermission>} />
          <Route path="services/mechanics" element={<RequirePermission permission="services.mechanics"><Mechanics /></RequirePermission>} />
          <Route path="services/estimates" element={<RequirePermission permission="services.estimates"><ServiceEstimates /></RequirePermission>} />
          <Route path="services/estimates/:id" element={<RequirePermission permission="services.estimates"><ServiceEstimateDetails /></RequirePermission>} />
          <Route path="services/invoices" element={<RequirePermission permission="services.invoices"><ServiceInvoices /></RequirePermission>} />
          <Route path="services/invoices/:id" element={<RequirePermission permission="services.invoices"><ServiceInvoiceDetails /></RequirePermission>} />
          <Route path="services/receipts" element={<RequirePermission permission="services.receipts"><ServiceReceipts /></RequirePermission>} />
          <Route path="services/receipts/:id" element={<RequirePermission permission="services.receipts"><ServiceReceiptDetails /></RequirePermission>} />

          {/* ✅ Administration */}
          <Route path="roles" element={<RequirePermission permission="roles.view"><RolesPermissions /></RequirePermission>} />
          <Route path="users" element={<RequirePermission permission="users.view"><Users /></RequirePermission>} />

          {/* ✅ Misc */}
          <Route path="car-wash" element={<RequirePermission permission="carwash.view"><CarWash /></RequirePermission>} />
          <Route path="sales" element={<RequirePermission permission="sales.view"><SalesTransactions /></RequirePermission>} />
          <Route path="employees" element={<Employees />} />
          <Route path="reports" element={<RequirePermission permission="reports.view"><Reports /></RequirePermission>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;