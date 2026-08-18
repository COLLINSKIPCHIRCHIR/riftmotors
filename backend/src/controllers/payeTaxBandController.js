import {
  createPayeTaxBand,
  getPayeTaxBands,
  getPayeTaxBandById,
  updatePayeTaxBand,
  deletePayeTaxBand,
  getCurrentPayeBands,
  getPayeBandsByDate,
} from "../models/payeTaxBandModel.js";

// ======================================
// Create
// ======================================

export const addPayeTaxBand = async (req, res) => {
  try {
    const band = await createPayeTaxBand(req.body);

    res.status(201).json(band);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to create PAYE tax band.",
    });
  }
};

// ======================================
// Get All
// ======================================

export const listPayeTaxBands = async (req, res) => {
  try {
    const bands = await getPayeTaxBands();

    res.json(bands);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch PAYE tax bands.",
    });
  }
};

// ======================================
// Get One
// ======================================

export const fetchPayeTaxBand = async (req, res) => {
  try {
    const band = await getPayeTaxBandById(req.params.id);

    if (!band) {
      return res.status(404).json({
        message: "PAYE tax band not found.",
      });
    }

    res.json(band);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch PAYE tax band.",
    });
  }
};

// ======================================
// Update
// ======================================

export const editPayeTaxBand = async (req, res) => {
  try {
    const band = await updatePayeTaxBand(
      req.params.id,
      req.body
    );

    res.json(band);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to update PAYE tax band.",
    });
  }
};

// ======================================
// Delete
// ======================================

export const removePayeTaxBand = async (req, res) => {
  try {
    const band = await deletePayeTaxBand(req.params.id);

    res.json({
      message: "PAYE tax band deleted successfully.",
      band,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete PAYE tax band.",
    });
  }
};

// ======================================
// Current Active Bands
// ======================================

export const currentPayeBands = async (req, res) => {
  try {
    const bands = await getCurrentPayeBands();

    res.json(bands);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch current PAYE bands.",
    });
  }
};

// ======================================
// Bands By Date
// ======================================

export const payeBandsByDate = async (req, res) => {
  try {
    const bands = await getPayeBandsByDate(req.params.date);

    res.json(bands);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch PAYE bands.",
    });
  }
};