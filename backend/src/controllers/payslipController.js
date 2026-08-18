import {
  createPayslip,
  getPayslips,
  getPayslipById,
  getPayslipsByPayrollPeriod,
  getEmployeePayslips,
  updatePayslip,
  markPayslipPaid,
  deletePayslip,
} from "../models/payslipModel.js";

// ==========================================
// Create
// ==========================================

export const addPayslip = async (req, res) => {
  try {
    const payslip = await createPayslip(req.body);

    res.status(201).json(payslip);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to create payslip.",
    });
  }
};

// ==========================================
// Get All
// ==========================================

export const listPayslips = async (req, res) => {
  try {
    const payslips = await getPayslips();

    res.json(payslips);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch payslips.",
    });
  }
};

// ==========================================
// Get One
// ==========================================

export const fetchPayslip = async (req, res) => {
  try {
    const payslip = await getPayslipById(req.params.id);

    if (!payslip) {
      return res.status(404).json({
        message: "Payslip not found.",
      });
    }

    res.json(payslip);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch payslip.",
    });
  }
};

// ==========================================
// Employee Payslips
// ==========================================

export const fetchEmployeePayslips = async (
  req,
  res
) => {
  try {
    const payslips = await getEmployeePayslips(
      req.params.employeeId
    );

    res.json(payslips);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Failed to fetch employee payslips.",
    });
  }
};

// ==========================================
// Payroll Period Payslips
// ==========================================

export const fetchPayrollPayslips = async (
  req,
  res
) => {
  try {
    const payslips =
      await getPayslipsByPayrollPeriod(
        req.params.payrollPeriodId
      );

    res.json(payslips);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Failed to fetch payroll payslips.",
    });
  }
};

// ==========================================
// Update
// ==========================================

export const editPayslip = async (req, res) => {
  try {
    const payslip = await updatePayslip(
      req.params.id,
      req.body
    );

    res.json(payslip);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to update payslip.",
    });
  }
};

// ==========================================
// Mark Paid
// ==========================================

export const payPayslip = async (req, res) => {
  try {
    const payslip = await markPayslipPaid(
      req.params.id
    );

    res.json(payslip);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to mark payslip as paid.",
    });
  }
};

// ==========================================
// Delete
// ==========================================

export const removePayslip = async (
  req,
  res
) => {
  try {
    const payslip = await deletePayslip(
      req.params.id
    );

    res.json({
      message: "Payslip deleted successfully.",
      payslip,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete payslip.",
    });
  }
};