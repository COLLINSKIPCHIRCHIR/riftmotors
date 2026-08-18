import express from "express";

import {
  addLeaveRequest,
  listLeaveRequests,
  fetchLeaveRequest,
  fetchEmployeeLeaveRequests,
  editLeaveRequest,
  removeLeaveRequest,
  approveRequest,
  rejectRequest,
} from "../controllers/leaveRequestController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ==========================================
   CRUD
========================================== */

router.post("/", protect, addLeaveRequest);

router.get("/", protect, listLeaveRequests);

router.get("/employee/:employeeId", protect, fetchEmployeeLeaveRequests);

router.get("/:id", protect, fetchLeaveRequest);

router.put("/:id", protect, editLeaveRequest);

router.delete("/:id", protect, removeLeaveRequest);

/* ==========================================
   APPROVALS
========================================== */

router.put("/:id/approve", protect, approveRequest);

router.put("/:id/reject", protect, rejectRequest);

export default router;