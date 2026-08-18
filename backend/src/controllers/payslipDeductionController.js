import {
  createPayslipDeduction,
  getPayslipDeductions,
  getPayslipDeductionById,
  getPayslipDeductionsByPayslip,
  updatePayslipDeduction,
  deletePayslipDeduction,
} from "../models/payslipDeductionModel.js";

// ==========================================
// Create
// ==========================================

export const addPayslipDeduction = async (req, res) => {
  try {
    const deduction = await createPayslipDeduction(req.body);

    res.status(201).json(deduction);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create payslip deduction.",
    });
  }
};

// ==========================================
// Get All
// ==========================================

export const listPayslipDeductions = async (req, res) => {
  try {
    const deductions = await getPayslipDeductions();

    res.json(deductions);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch payslip deductions.",
    });
  }
};

// ==========================================
// Get One
// ==========================================

export const getPayslipDeduction = async (req, res) => {
  try {
    const deduction = await getPayslipDeductionById(req.params.id);

    if (!deduction) {
      return res.status(404).json({
        message: "Payslip deduction not found.",
      });
    }

    res.json(deduction);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch payslip deduction.",
    });
  }
};

// ==========================================
// Get By Payslip
// ==========================================

export const listPayslipDeductionsByPayslip = async (
  req,
  res
) => {
  try {
    const deductions =
      await getPayslipDeductionsByPayslip(
        req.params.payslipId
      );

    res.json(deductions);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message:
        "Failed to fetch payslip deductions.",
    });
  }
};

// ==========================================
// Update
// ==========================================

export const editPayslipDeduction = async (
  req,
  res
) => {
  try {
    const deduction =
      await updatePayslipDeduction(
        req.params.id,
        req.body
      );

    if (!deduction) {
      return res.status(404).json({
        message: "Payslip deduction not found.",
      });
    }

    res.json(deduction);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message:
        "Failed to update payslip deduction.",
    });
  }
};

// ==========================================
// Delete
// ==========================================

export const removePayslipDeduction = async (
  req,
  res
) => {
  try {
    const deduction =
      await deletePayslipDeduction(
        req.params.id
      );

    if (!deduction) {
      return res.status(404).json({
        message: "Payslip deduction not found.",
      });
    }

    res.json({
      message:
        "Payslip deduction deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message:
        "Failed to delete payslip deduction.",
    });
  }
};