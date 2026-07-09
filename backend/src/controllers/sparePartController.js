// src/controllers/sparePartController.js
import {
  addSparePart,
  getAllSpareParts,
  getSparePartById,
  updateSparePart,
  deleteSparePart,
  getLowStockParts
} from "../models/sparePartModel.js";

// ➤ Add Spare Part
export const createSparePart = async (req, res) => {
  try {
    const part = await addSparePart(req.body);
    res.status(201).json(part);
  } catch (error) {
    next(error);
  }
};

// ➤ Get All
export const fetchSpareParts = async (req, res, next) => {
  try {
    const { search, category, page, limit } = req.query;
    const result = await getAllSpareParts({ search, category, page, limit });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ➤ Get One
export const fetchSparePart = async (req, res) => {
  try {
    const part = await getSparePartById(req.params.id);
    if (!part) return res.status(404).json({ message: "Not found" });
    res.json(part);
  } catch (error) {
    next(error);
  }
};

// ➤ Update
export const editSparePart = async (req, res) => {
  try {
    const updated = await updateSparePart(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// ➤ Delete
export const removeSparePart = async (req, res) => {
  try {
    const removed = await deleteSparePart(req.params.id);
    res.json(removed);
  } catch (error) {
    next(error);
  }
};

export const fetchLowStockParts = async (req, res) => {
  try {
    const parts = await getLowStockParts();
    res.json(parts);
  } catch (error) {
    next(error);
  }
};

