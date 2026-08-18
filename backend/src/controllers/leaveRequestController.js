import {
  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  getEmployeeLeaveRequests,
  updateLeaveRequest,
  deleteLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "../models/leaveRequestModel.js";

/* ==========================================
   CREATE
========================================== */

export const addLeaveRequest = async (req, res) => {
  try {
    const request = await createLeaveRequest(req.body);

    res.status(201).json(request);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message || "Server error",
    });
  }
};

/* ==========================================
   GET ALL
========================================== */

export const listLeaveRequests = async (req, res) => {
  try {
    const requests = await getAllLeaveRequests();

    res.json(requests);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

/* ==========================================
   GET ONE
========================================== */

export const fetchLeaveRequest = async (req, res) => {
  try {
    const request = await getLeaveRequestById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Leave request not found",
      });
    }

    res.json(request);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

/* ==========================================
   EMPLOYEE REQUESTS
========================================== */

export const fetchEmployeeLeaveRequests = async (req, res) => {
  try {
    const requests = await getEmployeeLeaveRequests(
      req.params.employeeId
    );

    res.json(requests);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

/* ==========================================
   UPDATE
========================================== */

export const editLeaveRequest = async (req, res) => {
  try {
    const request = await updateLeaveRequest(
      req.params.id,
      req.body
    );

    res.json(request);
  } catch (err) {
    console.error(err);

    res.status(400).json({
      message: err.message,
    });
  }
};

/* ==========================================
   DELETE
========================================== */

export const removeLeaveRequest = async (req, res) => {
  try {
    await deleteLeaveRequest(req.params.id);

    res.json({
      message: "Leave request deleted successfully.",
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      message: err.message,
    });
  }
};

/* ==========================================
   APPROVE
========================================== */

export const approveRequest = async (req, res) => {
  try {
    const request = await approveLeaveRequest(
      req.params.id,
      req.user.id
    );

    res.json({
      message: "Leave request approved successfully.",
      request,
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      message: err.message,
    });
  }
};

/* ==========================================
   REJECT
========================================== */

export const rejectRequest = async (req, res) => {
  try {
    const request = await rejectLeaveRequest(
      req.params.id,
      req.user.id
    );

    res.json({
      message: "Leave request rejected.",
      request,
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      message: err.message,
    });
  }
};