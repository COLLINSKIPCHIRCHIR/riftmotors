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
app.use(
  cors({
    origin: "http://localhost:5173", // React frontend URL
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
    "/api/roles",
    protect,
    roleRoutes
);

app.use(
    "/api/permissions",
    permissionRoutes
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
