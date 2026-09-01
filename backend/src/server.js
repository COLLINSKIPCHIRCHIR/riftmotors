import dotenv from "dotenv";
dotenv.config({ path: '../.env' });
import express from "express";
import cors from "cors";
import path from "path";
import pool from "./config/db.js";
import { createUserTable } from "./models/userModel.js";
import { createVehicleTable } from "./models/vehicleModel.js";
import { createSalesTable } from "./models/salesModel.js";
import {createSpareInvoiceTables} from "./models/spareInvoiceModel.js"
import userRoutes from "./routes/userRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import sparePartRoutes from "./routes/sparePartRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import estimateRoutes from "./routes/estimateRoutes.js";
import spareSalesRoutes from "./routes/spareSalesRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import serviceVehicleRoutes from "./routes/serviceVehicleRoutes.js";
import serviceJobRoutes from "./routes/serviceJobRoutes.js";
import serviceAssignmentRoutes from "./routes/serviceAssignmentRoutes.js";
import serviceCatalogRoutes from "./routes/serviceCatalogRoutes.js";
import jobServiceRoutes from "./routes/jobServiceRoutes.js";
import jobPartRoutes from "./routes/jobPartRoutes.js";
import mechanicRoutes from "./routes/mechanicRoutes.js";
import serviceEstimateRoutes from "./routes/serviceEstimateRoutes.js";
import serviceInvoiceRoutes from "./routes/serviceInvoiceRoutes.js";
import serviceReceiptRoutes from "./routes/serviceReceiptRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import employeeContactRoutes from "./routes/employeeContactRoutes.js";
import employeeDocumentRoutes from "./routes/employeeDocumentRoutes.js";
import employeeSkillRoutes from "./routes/employeeSkillRoutes.js";
import employeeNoteRoutes from "./routes/employeeNoteRoutes.js";
import leaveTypeRoutes from "./routes/leaveTypeRoutes.js";
import leaveBalanceRoutes from "./routes/leaveBalanceRoutes.js";
import leaveRequestRoutes from "./routes/leaveRequestRoutes.js";
import publicHolidayRoutes from "./routes/publicHolidayRoutes.js";
import employeeAttendanceRoutes from "./routes/employeeAttendanceRoutes.js";
import employeeSalaryHistoryRoutes from "./routes/employeeSalaryHistoryRoutes.js";
import employeeAllowanceRoutes from "./routes/employeeAllowanceRoutes.js";
import deductionTypeRoutes from "./routes/deductionTypeRoutes.js";
import deductionRateVersionRoutes from "./routes/deductionRateVersionRoutes.js";
import payeTaxBandRoutes from "./routes/payeTaxBandRoutes.js";
import payePersonalReliefRoutes from "./routes/payePersonalReliefRoutes.js";
import employeeRecurringDeductionRoutes from "./routes/employeeRecurringDeductionRoutes.js";
import payrollPeriodRoutes from "./routes/payrollPeriodRoutes.js";
import payslipRoutes from "./routes/payslipRoutes.js";
import payslipEarningRoutes from "./routes/payslipEarningRoutes.js";
import payslipDeductionRoutes from "./routes/payslipDeductionRoutes.js";
import payrollProcessingRoutes from "./routes/payrollProcessingRoutes.js";
import serviceCreditNoteRoutes from "./routes/serviceCreditNoteRoutes.js";



import { createSpareSalesTables } from "./models/spareSalesModel.js";
import invoiceRoutes from "./routes/spareInvoiceRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import stockMovementRoutes from "./routes/stockMovementRoutes.js";

import { protect, requirePermission } from "./middleware/authMiddleware.js";

import { errorHandler } from "./middleware/errorMiddleware.js";

import { createRefundTable } from "./models/refundModel.js";
import refundRoutes from "./routes/refundRoutes.js";

import reportRoutes from "./routes/reportRoutes.js";

await createSpareSalesTables();

await createSpareInvoiceTables();

await createRefundTable();



const app = express();
const PORT = process.env.PORT || 5004;

// ✅ Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "https://app.riftmotors.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ Important for form-data parsing

// ✅ Serve uploaded images statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ✅ Test DB connection
pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL database"))
  .catch((err) => console.error("❌ Database connection error:", err));

  const result = await pool.query("SELECT current_database()");
console.log("📦 Connected DB:", result.rows[0].current_database);

// ✅ Create tables automatically on startup
(async () => {
  try {
    await createUserTable();
    await createVehicleTable();
    await createSalesTable();
    console.log("✅ All tables ready");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
  }
})();

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/vehicles", protect, vehicleRoutes);
app.use("/api/sales", protect, salesRoutes);
app.use("/api/inventory", protect, inventoryRoutes);
app.use("/api/spareparts", protect, sparePartRoutes);
app.use("/api/transactions", protect, transactionRoutes);
app.use("/api/estimates", protect, estimateRoutes);
app.use("/api/spare-sales", protect, spareSalesRoutes);
app.use("/api/spare-invoices", protect, invoiceRoutes);
app.use("/api/customers", protect, customerRoutes);
app.use("/api/suppliers", protect, supplierRoutes);
app.use("/api/stock-movements", protect, stockMovementRoutes);
app.use("/api/purchases", protect, purchaseRoutes);
app.use("/api/refunds", protect, refundRoutes);
app.use("/api/reports", reportRoutes);
app.use(
"/api/service-vehicles",
serviceVehicleRoutes
);
app.use(
"/api/service-jobs",
serviceJobRoutes
);
app.use(
"/api/service-assignments",
serviceAssignmentRoutes
);
app.use(
"/api/service-catalog",
serviceCatalogRoutes
);
app.use(
"/api/job-services",
jobServiceRoutes
);

app.use(
"/api/job-parts",
jobPartRoutes
);

app.use(
"/api/mechanics",
mechanicRoutes
);

app.use(
"/api/service-estimates",
serviceEstimateRoutes
);

app.use(
"/api/service-invoices",
serviceInvoiceRoutes
);

app.use(
"/api/service-receipts",
serviceReceiptRoutes
);

app.use(
  "/api/service-credit-notes",
  serviceCreditNoteRoutes
);

app.use(
    "/api/roles",
    protect,
    roleRoutes
);

app.use(
    "/api/permissions",
    permissionRoutes
);

app.use(
  "/api/departments",
  departmentRoutes
);

app.use(
  "/api/branches",
  branchRoutes
);

app.use("/api/employees", employeeRoutes);

app.use(
  "/api/employee-contacts",
  employeeContactRoutes
);

app.use(
  "/api/employee-documents",
  employeeDocumentRoutes
);

app.use(
  "/api/employee-skills",
  employeeSkillRoutes
);

app.use(
  "/api/employee-notes",
  employeeNoteRoutes
);

app.use(
  "/api/leave-types",
  leaveTypeRoutes
);

app.use(
  "/api/leave-balances",
  leaveBalanceRoutes
);

app.use(
  "/api/leave-requests",
  leaveRequestRoutes
);

app.use(
  "/api/public-holidays",
  publicHolidayRoutes
);

app.use(
  "/api/employee-attendance",
  employeeAttendanceRoutes
);

app.use(
  "/api/employee-salary-history",
  employeeSalaryHistoryRoutes
);

app.use(
  "/api/employee-allowances",
  employeeAllowanceRoutes
);

app.use(
  "/api/deduction-types",
  deductionTypeRoutes
);

app.use(
  "/api/deduction-rate-versions",
  deductionRateVersionRoutes
);

app.use(
  "/api/paye-tax-bands",
  payeTaxBandRoutes
);

app.use(
  "/api/paye-personal-relief",
  payePersonalReliefRoutes
);

app.use(
  "/api/employee-recurring-deductions",
  employeeRecurringDeductionRoutes
);

app.use(
  "/api/payroll-periods",
  payrollPeriodRoutes
);

app.use(
  "/api/payslips",
  payslipRoutes
);

app.use(
  "/api/payslip-earnings",
  payslipEarningRoutes
);

app.use(
  "/api/payslip-deductions",
  payslipDeductionRoutes
);

app.use(
  "/api/payroll-processing",
  payrollProcessingRoutes
);

app.use(errorHandler);


// ✅ Default route
app.get("/", (req, res) => {
  res.send("🚗 Rift Motors POS API running...");
});

// ✅ Start server
app.listen(PORT, () =>
  console.log(`🚀 Server running successfully on port ${PORT}`)
);
