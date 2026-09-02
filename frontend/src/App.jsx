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
//import Employees from "./pages/Employees";
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
import PurchaseList from "./pages/spareparts/PurchaseList";
import PurchaseDetails from "./pages/spareparts/PurchaseDetails";
import ReceiveGoods from "./pages/spareparts/ReceiveGoods";


import ServiceDashboard from "./pages/services/ServiceDashboard";
import ServiceJobs from "./pages/services/ServiceJobs";
import CustomerVehicles from "./pages/services/CustomerVehicles";
import ServiceCatalog from "./pages/services/ServiceCatalog";
import JobDetails from "./pages/services/JobDetails";
import VehicleDetails from "./pages/services/VehicleDetails";
//import CreateJob from "./pages/services/CreateJob";
import Mechanics from "./pages/services/Mechanics";
import ServiceEstimateDetails from "./pages/services/ServiceEstimateDetails";
import ServiceEstimates from "./pages/services/ServiceEstimates";
import ServiceInvoices from "./pages/services/ServiceInvoices";
import ServiceInvoiceDetails from "./pages/services/ServiceInvoiceDetails";
import ServiceReceipts from "./pages/services/ServiceReceipts";
import ServiceReceiptDetails from "./pages/services/ServiceReceiptDetails";
import DailyJobReport from "./pages/services/DailyJobReport";
import ServiceCreditNotes from "./pages/services/ServiceCreditNotes";
import ServiceCreditNoteDetails from "./pages/services/ServiceCreditNoteDetails";
import RolesPermissions from "./pages/admin/RolesPermissions";
import Users from "./pages/admin/Users";

import CustomersList from "./pages/customers/CustomersList";
import AddCustomer from "./pages/customers/AddCustomer";
import StatementView from "./pages/customers/StatementView";


import Departments from "./pages/hr/departments/Departments";
import Branches from "./pages/hr/branches/Branches";
import Employees from "./pages/hr/employees/Employees";
import EmployeeDetails from "./pages/hr/employees/EmployeeDetails";
import LeaveTypes from "./pages/hr/leave-types/LeaveTypes";
import LeaveBalances from "./pages/hr/leave-balances/LeaveBalances";
import LeaveRequests from "./pages/hr/leave-requests/LeaveRequests";
import PublicHolidays from "./pages/hr/public-holidays/PublicHolidays";
import EmployeeAttendance from "./pages/hr/attendance/EmployeeAttendance";
import EmployeeSalaryHistory from "./pages/hr/salary-history/EmployeeSalaryHistory";
import DeductionTypes from "./pages/hr/deduction-types/DeductionTypes";
import DeductionRateVersions from "./pages/hr/deduction-rate-versions/DeductionRateVersions";
import PayeTaxBands from "./pages/hr/paye-tax-bands/PayeTaxBands";
import PayePersonalRelief from "./pages/hr/paye-personal-relief/PayePersonalRelief";
import EmployeeRecurringDeductions from "./pages/hr/recurring-deductions/EmployeeRecurringDeductions";
//import Payslips from "./pages/hr/payslips/Payslips";
import PayslipEarnings from "./pages/hr/payslip-earnings/PayslipEarnings";
import PayslipDeductions from "./pages/hr/payslip-deductions/PayslipDeductions";
import PayrollPeriods from "./pages/hr/payroll/PayrollPeriods";
import PayrollRun from "./pages/hr/payroll/PayrollRun";
import PayslipsList from "./pages/hr/payroll/PayslipsList";
import PayslipDetail from "./pages/hr/payroll/PayslipDetail";
import EmployeeAllowances from "./pages/hr/allowances/EmployeeAllowances";




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
                "Accountant",
                "Technician",
                "Service Manager"
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
          <Route path="/admin/customers/edit/:id" element={<AddCustomer />} />
          <Route path="customers/:id/statement" element={<RequirePermission permission="customers.view"><StatementView /></RequirePermission>} />

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
          <Route path="spare-parts/purchases" element={<RequirePermission permission="spareparts.purchase"><PurchaseList /></RequirePermission>} />
          <Route path="spare-parts/purchases/create" element={<RequirePermission permission="spareparts.purchase"><CreatePurchase /></RequirePermission>} />
          <Route path="spare-parts/purchases/:id" element={<RequirePermission permission="spareparts.purchase"><PurchaseDetails /></RequirePermission>} />
          <Route path="spare-parts/purchases/:id/receive" element={<RequirePermission permission="spareparts.purchase"><ReceiveGoods /></RequirePermission>} />

          {/* ✅ Services */}
          <Route path="services" element={<RequirePermission permission="services.view"><ServiceDashboard /></RequirePermission>} />
          <Route path="services/jobs" element={<RequirePermission permission="services.jobs"><ServiceJobs /></RequirePermission>} />
        
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
          <Route path="services/credit-notes" element={<RequirePermission permission="services.creditnotes"><ServiceCreditNotes /></RequirePermission>} />
          <Route path="services/credit-notes/:id" element={<RequirePermission permission="services.creditnotes"><ServiceCreditNoteDetails /></RequirePermission>} />
          <Route path="services/reports/daily" element={<RequirePermission permission="services.jobs"><DailyJobReport /></RequirePermission>} />
          
          <Route path="hr/departments" element={<Departments />} />
<Route path="hr/branches" element={<Branches />} />

<Route path="hr/employees" element={<Employees />} />
<Route path="hr/employees/:id" element={<EmployeeDetails />} />

<Route path="hr/leave-types" element={<LeaveTypes />} />
<Route path="hr/leave-balances" element={<LeaveBalances />} />
<Route path="hr/leave-requests" element={<LeaveRequests />} />
<Route path="hr/public-holidays" element={<PublicHolidays />} />
<Route path="hr/attendance" element={<EmployeeAttendance />} />

<Route path="hr/salary-history" element={<EmployeeSalaryHistory />} />

<Route path="hr/deduction-types" element={<DeductionTypes />} />
<Route path="hr/deduction-rate-versions" element={<DeductionRateVersions />} />
<Route path="hr/recurring-deductions" element={<EmployeeRecurringDeductions />} />

<Route path="hr/paye-tax-bands" element={<PayeTaxBands />} />
<Route path="hr/paye-personal-relief" element={<PayePersonalRelief />} />

<Route path="/admin/hr/payslip-earnings" element={<PayslipEarnings />} />
<Route path="/admin/hr/payslip-deductions" element={<PayslipDeductions />} />

<Route path="hr/payroll-periods" element={<PayrollPeriods />} />
<Route path="hr/payroll/:id" element={<PayrollRun />} />
<Route path="hr/payslips" element={<PayslipsList />} />
<Route path="hr/payslips/:id" element={<PayslipDetail />} />
<Route path="hr/employee-allowances" element={<EmployeeAllowances />} />

          {/* ✅ Administration */}
          <Route path="roles" element={<RequirePermission permission="roles.view"><RolesPermissions /></RequirePermission>} />
          <Route path="users" element={<RequirePermission permission="users.view"><Users /></RequirePermission>} />

          {/* ✅ Misc */}
          <Route path="car-wash" element={<RequirePermission permission="carwash.view"><CarWash /></RequirePermission>} />
          <Route path="sales" element={<RequirePermission permission="sales.view"><SalesTransactions /></RequirePermission>} />
          <Route path="reports" element={<RequirePermission permission="reports.view"><Reports /></RequirePermission>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;