// routes/spareInvoiceRoutes.js
import express from "express";
import {
  convertEstimate,
  payInvoice,
  getInvoices,
  getInvoice,
  voidInvoice 
} from "../controllers/spareInvoiceController.js";

const router = express.Router();

router.get("/", getInvoices);
router.get("/:id", getInvoice);

// Convert estimate to invoice
router.post("/:id/convert-from-estimate", convertEstimate);

// Pay invoice (convert to sale)
router.post("/:id/pay", payInvoice);

router.patch("/:id/cancel", voidInvoice);

export default router;
