import express from "express";

import {
  addLeaveBalance,
  listLeaveBalances,
  fetchLeaveBalance,
  fetchEmployeeLeaveBalances,
  editLeaveBalance,
  removeLeaveBalance,
  fetchEmployeeLeaveBalance
} from "../controllers/leaveBalanceController.js";

const router = express.Router();

router.post("/", addLeaveBalance);

router.get("/", listLeaveBalances);

router.get("/employee/:employeeId", fetchEmployeeLeaveBalances);

router.get("/:id", fetchLeaveBalance);

router.put("/:id", editLeaveBalance);

router.delete("/:id", removeLeaveBalance);

router.get(
    "/employee/:employeeId/:leaveTypeId/:year",
    fetchEmployeeLeaveBalance
);

export default router;