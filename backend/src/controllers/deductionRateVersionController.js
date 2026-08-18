import {
  createDeductionRateVersion,
  getDeductionRateVersions,
  getDeductionRateVersionById,
  updateDeductionRateVersion,
  deleteDeductionRateVersion,
  getRateVersionsByDeductionType,
} from "../models/deductionRateVersionModel.js";

// ============================================
// Create
// ============================================

export const addDeductionRateVersion = async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_by: req.user?.id || null,
    };

    const rate = await createDeductionRateVersion(data);

    res.status(201).json(rate);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to create deduction rate version.",
    });

  }
};

// ============================================
// Get All
// ============================================

export const listDeductionRateVersions = async (req, res) => {
  try {

    const rates = await getDeductionRateVersions();

    res.json(rates);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to fetch deduction rate versions.",
    });

  }
};

// ============================================
// Get One
// ============================================

export const fetchDeductionRateVersion = async (req, res) => {
  try {

    const rate = await getDeductionRateVersionById(
      req.params.id
    );

    if (!rate) {
      return res.status(404).json({
        message: "Deduction rate version not found.",
      });
    }

    res.json(rate);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to fetch deduction rate version.",
    });

  }
};

// ============================================
// Update
// ============================================

export const editDeductionRateVersion = async (req, res) => {
  try {

    const rate = await updateDeductionRateVersion(
      req.params.id,
      req.body
    );

    res.json(rate);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to update deduction rate version.",
    });

  }
};

// ============================================
// Delete
// ============================================

export const removeDeductionRateVersion = async (req, res) => {
  try {

    const rate = await deleteDeductionRateVersion(
      req.params.id
    );

    res.json({
      message: "Deduction rate version deleted successfully.",
      rate,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to delete deduction rate version.",
    });

  }
};

// ============================================
// Get By Deduction Type
// ============================================

export const fetchByDeductionType = async (req, res) => {
  try {

    const rates =
      await getRateVersionsByDeductionType(
        req.params.deductionTypeId
      );

    res.json(rates);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to fetch deduction rate versions.",
    });

  }
};