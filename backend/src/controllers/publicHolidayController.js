import {
  createPublicHoliday,
  getAllPublicHolidays,
  getPublicHolidayById,
  updatePublicHoliday,
  deletePublicHoliday,
} from "../models/publicHolidayModel.js";

// ======================================
// Create
// ======================================

export const addPublicHoliday = async (req, res) => {
  try {
    const holiday = await createPublicHoliday(req.body);

    res.status(201).json(holiday);
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(409).json({
        message: "This holiday already exists.",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================
// Get All
// ======================================

export const listPublicHolidays = async (req, res) => {
  try {
    const holidays = await getAllPublicHolidays();

    res.json(holidays);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================
// Get One
// ======================================

export const fetchPublicHoliday = async (req, res) => {
  try {
    const holiday = await getPublicHolidayById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        message: "Holiday not found",
      });
    }

    res.json(holiday);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================
// Update
// ======================================

export const editPublicHoliday = async (req, res) => {
  try {
    const holiday = await updatePublicHoliday(
      req.params.id,
      req.body
    );

    res.json(holiday);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================
// Delete
// ======================================

export const removePublicHoliday = async (req, res) => {
  try {
    const holiday = await deletePublicHoliday(req.params.id);

    res.json({
      message: "Holiday deleted successfully.",
      holiday,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};