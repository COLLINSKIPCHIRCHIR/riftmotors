import express from "express";

import {
  addPayslipEarning,
  listPayslipEarnings,
  getPayslipEarning,
  listPayslipEarningsByPayslip,
  editPayslipEarning,
  removePayslipEarning,
} from "../controllers/payslipEarningController.js";

const router = express.Router();

// ==========================================
// CRUD
// ==========================================

router.post("/", addPayslipEarning);

router.get("/", listPayslipEarnings);

router.get(
  "/payslip/:payslipId",
  listPayslipEarningsByPayslip
);

router.get("/:id", getPayslipEarning);

router.put("/:id", editPayslipEarning);

router.delete("/:id", removePayslipEarning);

export default router;