import {
  createLeaveBalance,
  getAllLeaveBalances,
  getLeaveBalanceById,
  getEmployeeLeaveBalances,
  updateLeaveBalance,
  deleteLeaveBalance,
  getEmployeeLeaveBalance, 
} from "../models/leaveBalanceModel.js";

// Create
export const addLeaveBalance = async (req, res) => {
  try {
    const balance = await createLeaveBalance(req.body);

    res.status(201).json(balance);
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(409).json({
        message:
          "Leave balance already exists for this employee, leave type and year.",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get All
export const listLeaveBalances = async (req, res) => {
  try {
    const balances = await getAllLeaveBalances();

    res.json(balances);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get One
export const fetchLeaveBalance = async (req, res) => {
  try {
    const balance = await getLeaveBalanceById(req.params.id);

    if (!balance) {
      return res.status(404).json({
        message: "Leave balance not found",
      });
    }

    res.json(balance);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get Employee Balances
export const fetchEmployeeLeaveBalances = async (req, res) => {
  try {
    const balances = await getEmployeeLeaveBalances(
      req.params.employeeId
    );

    res.json(balances);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Update
export const editLeaveBalance = async (req, res) => {
  try {
    const balance = await updateLeaveBalance(
      req.params.id,
      req.body
    );

    res.json(balance);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Delete
export const removeLeaveBalance = async (req, res) => {
  try {
    const balance = await deleteLeaveBalance(req.params.id);

    res.json({
      message: "Leave balance deleted",
      balance,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const fetchEmployeeLeaveBalance = async (req, res) => {
  try {
    const balance = await getEmployeeLeaveBalance(
      req.params.employeeId,
      req.params.leaveTypeId,
      req.params.year
    );

    if (!balance) {
      return res.status(404).json({
        message: "Leave balance not found",
      });
    }

    const remaining = Number(balance.remaining);

    const pending = Number(balance.pending);

    const available = remaining - pending;

    res.json({
      employee_id: balance.employee_id,

      employee_name: balance.employee_name,

      leave_type_id: balance.leave_type_id,

      leave_type_name: balance.leave_type_name,

      year: balance.year,

      allocated: Number(balance.allocated),

      used: Number(balance.used),

      carried_forward: Number(balance.carried_forward),

      remaining,

      pending,

      available,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};