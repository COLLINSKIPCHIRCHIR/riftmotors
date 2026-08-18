import {
  createPayePersonalRelief,
  getPayePersonalReliefs,
  getPayePersonalReliefById,
  updatePayePersonalRelief,
  deletePayePersonalRelief,
  getCurrentPayePersonalRelief,
  getPayePersonalReliefByDate,
} from "../models/payePersonalReliefModel.js";

// =============================================
// Create
// =============================================

export const addPayePersonalRelief = async (req, res) => {
  try {
    const relief = await createPayePersonalRelief(req.body);

    res.status(201).json(relief);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to create PAYE personal relief.",
    });
  }
};

// =============================================
// Get All
// =============================================

export const listPayePersonalReliefs = async (req, res) => {
  try {
    const reliefs = await getPayePersonalReliefs();

    res.json(reliefs);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch PAYE personal relief records.",
    });
  }
};

// =============================================
// Get One
// =============================================

export const fetchPayePersonalRelief = async (req, res) => {
  try {
    const relief = await getPayePersonalReliefById(req.params.id);

    if (!relief) {
      return res.status(404).json({
        message: "PAYE personal relief not found.",
      });
    }

    res.json(relief);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch PAYE personal relief.",
    });
  }
};

// =============================================
// Update
// =============================================

export const editPayePersonalRelief = async (req, res) => {
  try {
    const relief = await updatePayePersonalRelief(
      req.params.id,
      req.body
    );

    res.json(relief);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to update PAYE personal relief.",
    });
  }
};

// =============================================
// Delete
// =============================================

export const removePayePersonalRelief = async (req, res) => {
  try {
    const relief = await deletePayePersonalRelief(req.params.id);

    res.json({
      message: "PAYE personal relief deleted successfully.",
      relief,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete PAYE personal relief.",
    });
  }
};

// =============================================
// Current Relief
// =============================================

export const currentPayePersonalRelief = async (req, res) => {
  try {
    const relief = await getCurrentPayePersonalRelief();

    res.json(relief);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch current PAYE personal relief.",
    });
  }
};

// =============================================
// Relief By Date
// =============================================

export const payePersonalReliefByDate = async (req, res) => {
  try {
    const relief = await getPayePersonalReliefByDate(req.params.date);

    res.json(relief);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch PAYE personal relief.",
    });
  }
};