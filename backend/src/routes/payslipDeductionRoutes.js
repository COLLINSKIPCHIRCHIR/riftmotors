import express from "express";

import {
  addPayslipDeduction,
  listPayslipDeductions,
  getPayslipDeduction,
  listPayslipDeductionsByPayslip,
  editPayslipDeduction,
  removePayslipDeduction,
} from "../controllers/payslipDeductionController.js";

const router = express.Router();

// ==========================================
// CRUD
// ==========================================

router.post("/", addPayslipDeduction);

router.get("/", listPayslipDeductions);

router.get(
  "/payslip/:payslipId",
  listPayslipDeductionsByPayslip
);

router.get("/:id", getPayslipDeduction);

router.put("/:id", editPayslipDeduction);

router.delete("/:id", removePayslipDeduction);

export default router;