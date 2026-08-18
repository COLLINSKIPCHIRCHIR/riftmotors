import {
  createPayrollPeriod,
  getPayrollPeriods,
  getPayrollPeriodById,
  getOpenPayrollPeriod,
  updatePayrollPeriod,
  processPayrollPeriod,
  closePayrollPeriod,
  deletePayrollPeriod,
} from "../models/payrollPeriodModel.js";

// ==========================================
// Create
// ==========================================

export const addPayrollPeriod = async (req, res) => {
  try {
    const period = await createPayrollPeriod(req.body);

    res.status(201).json(period);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to create payroll period.",
    });
  }
};

// ==========================================
// Get All
// ==========================================

export const listPayrollPeriods = async (req, res) => {
  try {
    const periods = await getPayrollPeriods();

    res.json(periods);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch payroll periods.",
    });
  }
};

// ==========================================
// Get One
// ==========================================

export const fetchPayrollPeriod = async (req, res) => {
  try {
    const period = await getPayrollPeriodById(req.params.id);

    if (!period) {
      return res.status(404).json({
        message: "Payroll period not found.",
      });
    }

    res.json(period);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch payroll period.",
    });
  }
};

// ==========================================
// Get Open Payroll Period
// ==========================================

export const fetchOpenPayrollPeriod = async (
  req,
  res
) => {
  try {
    const period = await getOpenPayrollPeriod();

    res.json(period);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch open payroll period.",
    });
  }
};

// ==========================================
// Update
// ==========================================

export const editPayrollPeriod = async (req, res) => {
  try {
    const period = await updatePayrollPeriod(
      req.params.id,
      req.body
    );

    res.json(period);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to update payroll period.",
    });
  }
};

// ==========================================
// Process Payroll
// ==========================================

export const markPayrollProcessed = async (
  req,
  res
) => {
  try {
    const period = await processPayrollPeriod(
      req.params.id,
      req.body.processed_by
    );

    res.json(period);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to process payroll.",
    });
  }
};

// ==========================================
// Close Payroll
// ==========================================

export const markPayrollClosed = async (
  req,
  res
) => {
  try {
    const period = await closePayrollPeriod(
      req.params.id
    );

    res.json(period);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to close payroll period.",
    });
  }
};

// ==========================================
// Delete
// ==========================================

export const removePayrollPeriod = async (
  req,
  res
) => {
  try {
    const period = await deletePayrollPeriod(
      req.params.id
    );

    res.json({
      message:
        "Payroll period deleted successfully.",
      period,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete payroll period.",
    });
  }
};