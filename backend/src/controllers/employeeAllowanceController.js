import {
  createEmployeeAllowance,
  getEmployeeAllowances,
  getAllowancesByEmployee,
  getEmployeeAllowanceById,
  updateEmployeeAllowance,
  deleteEmployeeAllowance,
} from "../models/employeeAllowanceModel.js";

// ======================================
// Create
// ======================================

export const addEmployeeAllowance = async (req, res) => {
  try {
    const allowance = await createEmployeeAllowance(req.body);

    res.status(201).json(allowance);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to create allowance.",
    });
  }
};

// ======================================
// Get All
// ======================================

export const listEmployeeAllowances = async (req, res) => {
  try {
    const allowances = await getEmployeeAllowances();

    res.json(allowances);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load allowances.",
    });
  }
};

// ======================================
// Get Employee Allowances
// ======================================

export const fetchEmployeeAllowances = async (req, res) => {
  try {
    const allowances = await getAllowancesByEmployee(
      req.params.employeeId
    );

    res.json(allowances);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load employee allowances.",
    });
  }
};

// ======================================
// Get One
// ======================================

export const fetchEmployeeAllowance = async (req, res) => {
  try {
    const allowance = await getEmployeeAllowanceById(
      req.params.id
    );

    if (!allowance) {
      return res.status(404).json({
        message: "Allowance not found.",
      });
    }

    res.json(allowance);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load allowance.",
    });
  }
};

// ======================================
// Update
// ======================================

export const editEmployeeAllowance = async (req, res) => {
  try {
    const allowance = await updateEmployeeAllowance(
      req.params.id,
      req.body
    );

    res.json(allowance);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to update allowance.",
    });
  }
};

// ======================================
// Delete
// ======================================

export const removeEmployeeAllowance = async (req, res) => {
  try {
    const allowance = await deleteEmployeeAllowance(
      req.params.id
    );

    res.json({
      message: "Allowance deleted successfully.",
      allowance,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete allowance.",
    });
  }
};