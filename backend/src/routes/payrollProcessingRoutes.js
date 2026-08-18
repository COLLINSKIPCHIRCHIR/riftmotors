import express from "express";

import {
  previewPayrollController,
  processPayrollController,
  getPayrollSummaryController,
  getPayrollProcessingResultController,
} from "../controllers/payrollProcessingController.js";

const router = express.Router();

// ============================================================
// PREVIEW PAYROLL
// ============================================================

router.get(
  "/preview/:payrollPeriodId",
  previewPayrollController
);

// ============================================================
// PROCESS PAYROLL
// ============================================================

router.post(
  "/process/:payrollPeriodId",
  processPayrollController
);

// ============================================================
// PAYROLL SUMMARY
// ============================================================

router.get(
  "/summary/:payrollPeriodId",
  getPayrollSummaryController
);

// ============================================================
// PROCESSING RESULT
// ============================================================

router.get(
  "/result/:payrollPeriodId",
  getPayrollProcessingResultController
);

export default router;