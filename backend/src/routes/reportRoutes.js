import express from "express";
import {
  fetchDashboardStats,
  fetchSalesSummary,
  fetchSalesByDay,
  fetchTopSellingParts,
  fetchLowStockAlert,
  fetchBusinessInvoiceReport   
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, fetchDashboardStats);
router.get("/sales-summary", protect, fetchSalesSummary);
router.get("/sales-by-day", protect, fetchSalesByDay);
router.get("/top-parts", protect, fetchTopSellingParts);
router.get("/low-stock", protect, fetchLowStockAlert);
router.get("/invoices", protect, fetchBusinessInvoiceReport);   

export default router;