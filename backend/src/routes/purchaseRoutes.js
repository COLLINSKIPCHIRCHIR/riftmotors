import express from "express";
import {
  createPurchase,
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

router.patch("/:id/send", sendPurchase);
router.patch("/:id/cancel", cancelPurchase);
router.post("/:id/receive", validateReceipt, validateRequest, receiveGoods);

// ⚠️ Keep this LAST — the generic :id catch-all would otherwise
// swallow /send, /cancel and /receive above.
router.get("/:id", fetchPurchaseById);

export default router;