import {
  createEmployeeSalary,
  getEmployeeSalaries,
  getSalaryHistoryByEmployee,
  getEmployeeSalaryById,
  updateEmployeeSalary,
  deleteEmployeeSalary,
} from "../models/employeeSalaryHistoryModel.js";

// ======================================
// Create Salary Record
// ======================================

export const addEmployeeSalary = async (req, res) => {
  try {
    const data = {
      ...req.body,
      changed_by: req.user?.id || null,
    };

    const salary = await createEmployeeSalary(data);

    res.status(201).json(salary);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create salary record.",
    });
  }
};

// ======================================
// Get All Salary Records
// ======================================

export const listEmployeeSalaries = async (req, res) => {
  try {
    const salaries = await getEmployeeSalaries();

    res.json(salaries);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to load salary records.",
    });
  }
};

// ======================================
// Get Salary History For Employee
// ======================================

export const fetchSalaryHistory = async (req, res) => {
  try {
    const salaries = await getSalaryHistoryByEmployee(
      req.params.employeeId
    );

    res.json(salaries);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to load salary history.",
    });
  }
};

// ======================================
// Get Single Salary Record
// ======================================

export const fetchEmployeeSalary = async (req, res) => {
  try {
    const salary = await getEmployeeSalaryById(
      req.params.id
    );

    if (!salary) {
      return res.status(404).json({
        message: "Salary record not found.",
      });
    }

    res.json(salary);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to load salary record.",
    });
  }
};

// ======================================
// Update Salary
// ======================================

export const editEmployeeSalary = async (req, res) => {
  try {
    const salary = await updateEmployeeSalary(
      req.params.id,
      req.body
    );

    res.json(salary);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to update salary record.",
    });
  }
};

// ======================================
// Delete Salary
// ======================================

export const removeEmployeeSalary = async (req, res) => {
  try {
    const salary = await deleteEmployeeSalary(
      req.params.id
    );

    res.json({
      message: "Salary record deleted successfully.",
      salary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to delete salary record.",
    });
  }
};