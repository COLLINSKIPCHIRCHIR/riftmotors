import {
  createLeaveType,
  getAllLeaveTypes,
  getLeaveTypeById,
  updateLeaveType,
  deleteLeaveType,
} from "../models/leaveTypeModel.js";

// ===============================
// Create
// ===============================
export const addLeaveType = async (req, res) => {
  try {
    const leaveType = await createLeaveType(req.body);

    res.status(201).json(leaveType);
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(409).json({
        message: "Leave type already exists.",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// List
// ===============================
export const listLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await getAllLeaveTypes();

    res.json(leaveTypes);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// Single
// ===============================
export const fetchLeaveType = async (req, res) => {
  try {
    const leaveType = await getLeaveTypeById(req.params.id);

    if (!leaveType) {
      return res.status(404).json({
        message: "Leave type not found",
      });
    }

    res.json(leaveType);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// Update
// ===============================
export const editLeaveType = async (req, res) => {
  try {
    const leaveType = await updateLeaveType(
      req.params.id,
      req.body
    );

    res.json(leaveType);
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(409).json({
        message: "Leave type already exists.",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// Delete
// ===============================
export const removeLeaveType = async (req, res) => {
  try {
    const leaveType = await deleteLeaveType(req.params.id);

    res.json({
      message: "Leave type deleted",
      leaveType,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};