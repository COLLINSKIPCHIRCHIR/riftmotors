import express from "express";

import {
  addDeductionRateVersion,
  listDeductionRateVersions,
  fetchDeductionRateVersion,
  editDeductionRateVersion,
  removeDeductionRateVersion,
  fetchByDeductionType,
} from "../controllers/deductionRateVersionController.js";

const router = express.Router();

// =====================================
// CRUD
// =====================================

router.post("/", addDeductionRateVersion);

router.get("/", listDeductionRateVersions);

// =====================================
// Get Versions for one Deduction Type
// =====================================

router.get(
  "/deduction-type/:deductionTypeId",
  fetchByDeductionType
);

router.get("/:id", fetchDeductionRateVersion);

router.put("/:id", editDeductionRateVersion);

router.delete("/:id", removeDeductionRateVersion);



export default router;