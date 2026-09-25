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
  exportSpareParts, 
} from "../controllers/sparePartController.js";
import { validateSparePart } from "../validators/sparePartValidators.js";
import { validateRequest } from "../middleware/validateRequest.js";


const router = express.Router();

router.post("/add", validateSparePart, validateRequest, createSparePart);
router.get("/", fetchSpareParts);

router.get("/stats", fetchInventoryStats);
router.get("/low-stock", fetchLowStockParts);
router.get("/export", exportSpareParts); // ← added, must stay above "/:id"
router.get("/:id", fetchSparePart);
router.put("/:id", validateSparePart, validateRequest, editSparePart);
router.delete("/:id", removeSparePart);

export default router;