import {
  createAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
} from "../models/employeeAttendanceModel.js";

// ==========================================
// Helper
// ==========================================
const calculateHours = (data) => {
  if (data.clock_in && data.clock_out) {
    const start = new Date(data.clock_in);
    const end = new Date(data.clock_out);

    const hours = (end - start) / (1000 * 60 * 60);

    data.worked_hours = Number(hours.toFixed(2));

    data.overtime_hours =
      hours > 8 ? Number((hours - 8).toFixed(2)) : 0;
  } else {
    data.worked_hours = 0;
    data.overtime_hours = 0;
  }

  return data;
};

// ==========================================
// Create
// ==========================================
export const addAttendance = async (req, res) => {
  try {
    const data = calculateHours({ ...req.body });

    const attendance = await createAttendance(data);

    res.status(201).json(attendance);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// List
// ==========================================
export const listAttendance = async (req, res) => {
  try {
    const attendance = await getAllAttendance();

    res.json(attendance);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Single
// ==========================================
export const fetchAttendance = async (req, res) => {
  try {
    const attendance = await getAttendanceById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance record not found",
      });
    }

    res.json(attendance);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Update
// ==========================================
export const editAttendance = async (req, res) => {
  try {
    const data = calculateHours({ ...req.body });

    const attendance = await updateAttendance(
      req.params.id,
      data
    );

    res.json(attendance);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Delete
// ==========================================
export const removeAttendance = async (req, res) => {
  try {
    await deleteAttendance(req.params.id);

    res.json({
      message: "Attendance deleted successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};