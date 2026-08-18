import express from "express";

import {
  addAttendance,
  listAttendance,
  fetchAttendance,
  editAttendance,
  removeAttendance,
} from "../controllers/employeeAttendanceController.js";

const router = express.Router();

router.post("/", addAttendance);

router.get("/", listAttendance);

router.get("/:id", fetchAttendance);

router.put("/:id", editAttendance);

router.delete("/:id", removeAttendance);

export default router;