import express from "express";

import {
  addLeaveType,
  listLeaveTypes,
  fetchLeaveType,
  editLeaveType,
  removeLeaveType,
} from "../controllers/leaveTypeController.js";

const router = express.Router();

router.post("/", addLeaveType);

router.get("/", listLeaveTypes);

router.get("/:id", fetchLeaveType);

router.put("/:id", editLeaveType);

router.delete("/:id", removeLeaveType);

export default router;