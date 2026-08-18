import express from "express";

import {
  addPayrollPeriod,
  listPayrollPeriods,
  fetchPayrollPeriod,
  fetchOpenPayrollPeriod,
  editPayrollPeriod,
  markPayrollProcessed,
  markPayrollClosed,
  removePayrollPeriod,
} from "../controllers/payrollPeriodController.js";

const router = express.Router();

// ==========================================
// Special Routes
// ==========================================

router.get(
  "/open",
  fetchOpenPayrollPeriod
);

router.put(
  "/:id/process",
  markPayrollProcessed
);

router.put(
  "/:id/close",
  markPayrollClosed
);

// ==========================================
// CRUD
// ==========================================

router.post(
  "/",
  addPayrollPeriod
);

router.get(
  "/",
  listPayrollPeriods
);

router.get(
  "/:id",
  fetchPayrollPeriod
);

router.put(
  "/:id",
  editPayrollPeriod
);

router.delete(
  "/:id",
  removePayrollPeriod
);

export default router;