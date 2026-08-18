import {
  createDeductionType,
  getDeductionTypes,
  getDeductionTypeById,
  updateDeductionType,
  deleteDeductionType,
} from "../models/deductionTypeModel.js";

// ======================================
// Create
// ======================================

export const addDeductionType = async (req, res) => {
  try {
    const deductionType = await createDeductionType(req.body);

    res.status(201).json(deductionType);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to create deduction type.",
    });

  }
};

// ======================================
// Get All
// ======================================

export const listDeductionTypes = async (req, res) => {
  try {
    const deductionTypes = await getDeductionTypes();

    res.json(deductionTypes);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to load deduction types.",
    });

  }
};

// ======================================
// Get One
// ======================================

export const fetchDeductionType = async (req, res) => {
  try {
    const deductionType = await getDeductionTypeById(req.params.id);

    if (!deductionType) {
      return res.status(404).json({
        message: "Deduction type not found.",
      });
    }

    res.json(deductionType);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to load deduction type.",
    });

  }
};

// ======================================
// Update
// ======================================

export const editDeductionType = async (req, res) => {
  try {
    const deductionType = await updateDeductionType(
      req.params.id,
      req.body
    );

    res.json(deductionType);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to update deduction type.",
    });

  }
};

// ======================================
// Delete
// ======================================

export const removeDeductionType = async (req, res) => {
  try {
    const deductionType = await deleteDeductionType(req.params.id);

    res.json({
      message: "Deduction type deleted successfully.",
      deductionType,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to delete deduction type.",
    });

  }
};