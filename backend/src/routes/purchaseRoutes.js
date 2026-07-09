import express from "express";
import {
  createPurchase,
  fetchPurchases,
  fetchPurchaseById,
} from "../controllers/purchaseController.js";

import { validatePurchase } from "../validators/purchaseValidators.js";
import { validateRequest } from "../middleware/validateRequest.js";


const router = express.Router();

router.post("/", validatePurchase, validateRequest, createPurchase);
router.get("/", fetchPurchases);

// ⚠️ Keep this LAST
router.get("/:id", fetchPurchaseById);

export default router;
