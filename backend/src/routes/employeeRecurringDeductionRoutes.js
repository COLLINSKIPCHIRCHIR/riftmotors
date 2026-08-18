import express from "express";

import {
  addEmployeeRecurringDeduction,
  listEmployeeRecurringDeductions,
  fetchEmployeeRecurringDeduction,
  employeeRecurringDeductions,
  activeRecurringDeductions,
  editEmployeeRecurringDeduction,
  removeEmployeeRecurringDeduction,
} from "../controllers/employeeRecurringDeductionController.js";

const router = express.Router();

// =============================================
// Special Routes
// =============================================

router.get(
  "/employee/:employeeId",
  employeeRecurringDeductions
);

router.get(
  "/active/:employeeId/:payrollDate",
  activeRecurringDeductions
);

// =============================================
// CRUD
// =============================================

router.post(
  "/",
  addEmployeeRecurringDeduction
);

router.get(
  "/",
  listEmployeeRecurringDeductions
);

router.get(
  "/:id",
  fetchEmployeeRecurringDeduction
);

router.put(
  "/:id",
  editEmployeeRecurringDeduction
);

router.delete(
  "/:id",
  removeEmployeeRecurringDeduction
);

export default router;