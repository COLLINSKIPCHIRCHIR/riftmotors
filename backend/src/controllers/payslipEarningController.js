import {
  createPayslipEarning,
  getPayslipEarnings,
  getPayslipEarningById,
  getPayslipEarningsByPayslip,
  updatePayslipEarning,
  deletePayslipEarning,
} from "../models/payslipEarningModel.js";

// ==========================================
// Create
// ==========================================

export const addPayslipEarning = async (req, res) => {
  try {
    const earning = await createPayslipEarning(req.body);

    res.status(201).json(earning);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create payslip earning.",
    });
  }
};

// ==========================================
// Get All
// ==========================================

export const listPayslipEarnings = async (req, res) => {
  try {
    const earnings = await getPayslipEarnings();

    res.json(earnings);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch payslip earnings.",
    });
  }
};

// ==========================================
// Get One
// ==========================================

export const getPayslipEarning = async (req, res) => {
  try {
    const earning = await getPayslipEarningById(
      req.params.id
    );

    if (!earning) {
      return res.status(404).json({
        message: "Payslip earning not found.",
      });
    }

    res.json(earning);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch payslip earning.",
    });
  }
};

// ==========================================
// Get By Payslip
// ==========================================

export const listPayslipEarningsByPayslip = async (
  req,
  res
) => {
  try {
    const earnings =
      await getPayslipEarningsByPayslip(
        req.params.payslipId
      );

    res.json(earnings);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message:
        "Failed to fetch payslip earnings.",
    });
  }
};

// ==========================================
// Update
// ==========================================

export const editPayslipEarning = async (
  req,
  res
) => {
  try {
    const earning =
      await updatePayslipEarning(
        req.params.id,
        req.body
      );

    if (!earning) {
      return res.status(404).json({
        message: "Payslip earning not found.",
      });
    }

    res.json(earning);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update payslip earning.",
    });
  }
};

// ==========================================
// Delete
// ==========================================

export const removePayslipEarning = async (
  req,
  res
) => {
  try {
    const earning =
      await deletePayslipEarning(
        req.params.id
      );

    if (!earning) {
      return res.status(404).json({
        message: "Payslip earning not found.",
      });
    }

    res.json({
      message:
        "Payslip earning deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete payslip earning.",
    });
  }
};