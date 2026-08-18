import express from "express";

import {
  addPayeTaxBand,
  listPayeTaxBands,
  fetchPayeTaxBand,
  editPayeTaxBand,
  removePayeTaxBand,
  currentPayeBands,
  payeBandsByDate,
} from "../controllers/payeTaxBandController.js";

const router = express.Router();

// ====================================
// Special Routes
// ====================================

router.get("/current", currentPayeBands);

router.get("/date/:date", payeBandsByDate);

// ====================================
// CRUD
// ====================================

router.post("/", addPayeTaxBand);

router.get("/", listPayeTaxBands);

router.get("/:id", fetchPayeTaxBand);

router.put("/:id", editPayeTaxBand);

router.delete("/:id", removePayeTaxBand);

export default router;