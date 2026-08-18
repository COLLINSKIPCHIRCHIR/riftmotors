import {
  createEmployeeRecurringDeduction,
  getEmployeeRecurringDeductions,
  getEmployeeRecurringDeductionById,
  getRecurringDeductionsByEmployee,
  getActiveRecurringDeductions,
  updateEmployeeRecurringDeduction,
  deleteEmployeeRecurringDeduction,
} from "../models/employeeRecurringDeductionModel.js";

// =============================================
// Create
// =============================================

export const addEmployeeRecurringDeduction = async (
  req,
  res
) => {
  try {
    const deduction =
      await createEmployeeRecurringDeduction(req.body);

    res.status(201).json(deduction);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Failed to create recurring deduction.",
    });
  }
};

// =============================================
// Get All
// =============================================

export const listEmployeeRecurringDeductions =
  async (req, res) => {
    try {
      const deductions =
        await getEmployeeRecurringDeductions();

      res.json(deductions);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch recurring deductions.",
      });
    }
  };

// =============================================
// Get One
// =============================================

export const fetchEmployeeRecurringDeduction =
  async (req, res) => {
    try {
      const deduction =
        await getEmployeeRecurringDeductionById(
          req.params.id
        );

      if (!deduction) {
        return res.status(404).json({
          message:
            "Recurring deduction not found.",
        });
      }

      res.json(deduction);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch recurring deduction.",
      });
    }
  };

// =============================================
// Employee Deductions
// =============================================

export const employeeRecurringDeductions =
  async (req, res) => {
    try {
      const deductions =
        await getRecurringDeductionsByEmployee(
          req.params.employeeId
        );

      res.json(deductions);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch employee deductions.",
      });
    }
  };

// =============================================
// Active Deductions
// =============================================

export const activeRecurringDeductions =
  async (req, res) => {
    try {
      const deductions =
        await getActiveRecurringDeductions(
          req.params.employeeId,
          req.params.payrollDate
        );

      res.json(deductions);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch active deductions.",
      });
    }
  };

// =============================================
// Update
// =============================================

export const editEmployeeRecurringDeduction =
  async (req, res) => {
    try {
      const deduction =
        await updateEmployeeRecurringDeduction(
          req.params.id,
          req.body
        );

      res.json(deduction);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to update recurring deduction.",
      });
    }
  };

// =============================================
// Delete
// =============================================

export const removeEmployeeRecurringDeduction =
  async (req, res) => {
    try {
      const deduction =
        await deleteEmployeeRecurringDeduction(
          req.params.id
        );

      res.json({
        message:
          "Recurring deduction deleted successfully.",
        deduction,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to delete recurring deduction.",
      });
    }
  };