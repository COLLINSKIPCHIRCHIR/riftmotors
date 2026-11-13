// src/controllers/sparePartController.js
import {
  addSparePart,
  getAllSpareParts,
  getAllSparePartsForExport,
  getSparePartById,
  updateSparePart,
  deleteSparePart,
  getLowStockParts,
  getInventoryStats,
} from "../models/sparePartModel.js";

// ➤ Add Spare Part
export const createSparePart = async (req, res, next) => {
  try {
    const part = await addSparePart(req.body);
    res.status(201).json(part);
  } catch (error) {
    if (error.code === "23505")
      return res.status(409).json({ message: "Another spare part already uses this part number" });
    if (error.code === "23503")
      return res.status(400).json({ message: "The selected supplier does not exist" });
    if (error.code === "22001")
      return res.status(400).json({ message: "One of the text values is too long" });
    next(error);
  }
};

// ➤ Get All
export const fetchSpareParts = async (req, res, next) => {
  try {
    const { search, category, page, limit, sortField, sortOrder } = req.query;
    const result = await getAllSpareParts({ search, category, page, limit, sortField, sortOrder });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// ➤ Export (all rows, no pagination)
export const exportSpareParts = async (req, res, next) => {
  try {
    const { search, category, sortField, sortOrder } = req.query;
    const parts = await getAllSparePartsForExport({ search, category, sortField, sortOrder });
    res.json(parts);
  } catch (error) {
    next(error);
  }
};

// ➤ Get One
export const fetchSparePart = async (req, res, next) => {
  try {
    const part = await getSparePartById(req.params.id);
    if (!part) return res.status(404).json({ message: "Not found" });
    res.json(part);
  } catch (error) {
    next(error);
  }
};

// ➤ Update
export const editSparePart = async (req, res, next) => {
  try {
    const updated = await updateSparePart(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Spare part not found or already deleted" });
    res.json(updated);
  } catch (error) {
    if (error.code === "23505")
      return res.status(409).json({ message: "Another spare part already uses this part number" });
    if (error.code === "23503")
      return res.status(400).json({ message: "The selected supplier does not exist" });
    if (error.code === "22001")
      return res.status(400).json({ message: "One of the text values is too long" });
    next(error);
  }
};

// ➤ Delete
export const removeSparePart = async (req, res, next) => {
  try {
    const removed = await deleteSparePart(req.params.id);
    res.json(removed);
  } catch (error) {
    next(error);
  }
};

export const fetchLowStockParts = async (req, res, next) => {
  try {
    const parts = await getLowStockParts();
    res.json(parts);
  } catch (error) {
    next(error);
  }
};


export const fetchInventoryStats = async (req, res, next) => {
  try {
    const stats = await getInventoryStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};