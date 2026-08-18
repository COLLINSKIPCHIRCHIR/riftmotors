import express from "express";

import {
  addPayslip,
  listPayslips,
  fetchPayslip,
  fetchEmployeePayslips,
  fetchPayrollPayslips,
  editPayslip,
  payPayslip,
  removePayslip,
} from "../controllers/payslipController.js";

const router = express.Router();

// ==========================================
// Special Routes
// ==========================================

router.get(
  "/employee/:employeeId",
  fetchEmployeePayslips
);

router.get(
  "/payroll/:payrollPeriodId",
  fetchPayrollPayslips
);

router.put(
  "/:id/pay",
  payPayslip
);

// ==========================================
// CRUD
// ==========================================

router.post(
  "/",
  addPayslip
);

router.get(
  "/",
  listPayslips
);

router.get(
  "/:id",
  fetchPayslip
);

router.put(
  "/:id",
  editPayslip
);

router.delete(
  "/:id",
  removePayslip
);

export default router;