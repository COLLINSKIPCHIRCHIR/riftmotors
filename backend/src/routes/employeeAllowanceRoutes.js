import express from "express";

import {
  addEmployeeAllowance,
  listEmployeeAllowances,
  fetchEmployeeAllowances,
  fetchEmployeeAllowance,
  editEmployeeAllowance,
  removeEmployeeAllowance,
} from "../controllers/employeeAllowanceController.js";

const router = express.Router();

// Create
router.post("/", addEmployeeAllowance);

// Get All
router.get("/", listEmployeeAllowances);

// Get Employee Allowances
router.get(
  "/employee/:employeeId",
  fetchEmployeeAllowances
);

// Get One
router.get("/:id", fetchEmployeeAllowance);

// Update
router.put("/:id", editEmployeeAllowance);

// Delete
router.delete("/:id", removeEmployeeAllowance);

export default router;