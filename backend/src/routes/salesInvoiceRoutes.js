// src/routes/salesInvoiceRoutes.js
import express from "express";
import {
  createSalesInvoice,
  fetchAllInvoices,
  fetchInvoiceById,
  changePaymentStatus,
} from "../controllers/salesInvoiceController.js";

const router = express.Router();

router.post("/", createSalesInvoice);
router.get("/", fetchAllInvoices);
router.get("/:id", fetchInvoiceById);
router.patch("/:id/payment-status", changePaymentStatus);

export default router;