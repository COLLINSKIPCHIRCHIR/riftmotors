import express from "express";

import {
  addDeductionType,
  listDeductionTypes,
  fetchDeductionType,
  editDeductionType,
  removeDeductionType,
} from "../controllers/deductionTypeController.js";

const router = express.Router();

// Create
router.post("/", addDeductionType);

// Get All
router.get("/", listDeductionTypes);

// Get One
router.get("/:id", fetchDeductionType);

// Update
router.put("/:id", editDeductionType);

// Delete
router.delete("/:id", removeDeductionType);

export default router;