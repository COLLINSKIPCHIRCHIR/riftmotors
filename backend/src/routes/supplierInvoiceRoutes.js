import express from "express";
import {
  createInvoice,
  fetchInvoices,
  fetchInvoiceById,
  cancelInvoice,
  fetchOutstandingForSupplier,
} from "../controllers/supplierInvoiceController.js";

const router = express.Router();

router.post("/", createInvoice);
router.get("/", fetchInvoices);
router.get("/outstanding/:supplierId", fetchOutstandingForSupplier);
router.patch("/:id/cancel", cancelInvoice);

// ⚠️ Keep this LAST — the generic :id catch-all would otherwise
// swallow /outstanding/:supplierId above.
router.get("/:id", fetchInvoiceById);

export default router;