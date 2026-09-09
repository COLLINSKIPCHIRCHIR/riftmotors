import express from "express";
import {
  createPurchase,
  updatePurchase,
  fetchPurchases,
  fetchPurchaseById,
  sendPurchase,
  cancelPurchase,
  receiveGoods,
} from "../controllers/purchaseController.js";

import { validatePurchase } from "../validators/purchaseValidators.js";
import { validateReceipt } from "../validators/receiptValidators.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.post("/", validatePurchase, validateRequest, createPurchase);
router.get("/", fetchPurchases);

// NOTE: validatePurchase is reused here for the update body (same shape:
// supplier_id + items[], plus optional expected_delivery_date/notes/tax_rate).
// I don't have the validator's source — confirm it doesn't require fields
// that only make sense on create (e.g. anything status-related), and that
// it doesn't reject the new `tax_rate` field if it uses a strict/whitelist
// schema (Joi/Zod .strict(), express-validator with .not().exists(), etc).
router.put("/:id", validatePurchase, validateRequest, updatePurchase);

router.patch("/:id/send", sendPurchase);
router.patch("/:id/cancel", cancelPurchase);
router.post("/:id/receive", validateReceipt, validateRequest, receiveGoods);

// ⚠️ Keep this LAST — the generic :id catch-all would otherwise
// swallow /send, /cancel, /receive and PUT /:id above.
router.get("/:id", fetchPurchaseById);

export default router;