import express from "express";

import {
  addEmployeeSalary,
  listEmployeeSalaries,
  fetchSalaryHistory,
  fetchEmployeeSalary,
  editEmployeeSalary,
  removeEmployeeSalary,
} from "../controllers/employeeSalaryHistoryController.js";

const router = express.Router();

// Create
router.post("/", addEmployeeSalary);

// Get All
router.get("/", listEmployeeSalaries);

// Get Employee Salary History
router.get(
  "/employee/:employeeId",
  fetchSalaryHistory
);

// Get One Record
router.get("/:id", fetchEmployeeSalary);

// Update
router.put("/:id", editEmployeeSalary);

// Delete
router.delete("/:id", removeEmployeeSalary);

export default router;