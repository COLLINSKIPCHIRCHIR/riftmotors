// src/routes/sparePartRoutes.js
import express from "express";
import {
  createSparePart,
  fetchSpareParts,
  fetchSparePart,
  editSparePart,
  removeSparePart,
  fetchLowStockParts,
  fetchInventoryStats,
} from "../controllers/sparePartController.js";
import { validateSparePart } from "../validators/sparePartValidators.js";
import { validateRequest } from "../middleware/validateRequest.js";


const router = express.Router();

router.post("/add", validateSparePart, validateRequest, createSparePart);
router.get("/", fetchSpareParts);

router.get("/stats", fetchInventoryStats);
router.get("/low-stock", fetchLowStockParts);
router.get("/:id", fetchSparePart);
router.put("/:id", validateSparePart, validateRequest, editSparePart);
router.delete("/:id", removeSparePart);

export default router;
