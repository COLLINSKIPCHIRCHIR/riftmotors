import express from "express";
import {
  createPayment,
  fetchPayments,
  fetchPaymentById,
  fetchStatement,
} from "../controllers/supplierPaymentController.js";

const router = express.Router();

router.post("/", createPayment);
router.get("/", fetchPayments);
router.get("/statement/:supplierId", fetchStatement);

// ⚠️ Keep this LAST — the generic :id catch-all would otherwise
// swallow /statement/:supplierId above.
router.get("/:id", fetchPaymentById);

export default router;