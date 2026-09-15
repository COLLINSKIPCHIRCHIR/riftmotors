// src/controllers/consignorController.js
import { createConsignor, getAllConsignors, updateConsignor, softDeleteConsignor } from "../models/consignorModel.js";

export const addConsignor = async (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ error: "Name is required." });
    const consignor = await createConsignor(req.body);
    res.status(201).json({ message: "✅ Consignor added", consignor });
  } catch (error) {
    console.error("❌ Error adding consignor:", error);
    res.status(500).json({ error: "Server error while adding consignor" });
  }
};

export const fetchConsignors = async (req, res) => {
  try {
    res.json(await getAllConsignors());
  } catch (error) {
    console.error("❌ Error fetching consignors:", error);
    res.status(500).json({ error: "Server error while fetching consignors" });
  }
};

export const editConsignor = async (req, res) => {
  try {
    const updated = await updateConsignor(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Consignor not found" });
    res.json({ message: "✅ Consignor updated", consignor: updated });
  } catch (error) {
    console.error("❌ Error updating consignor:", error);
    res.status(500).json({ error: "Server error while updating consignor" });
  }
};

export const removeConsignor = async (req, res) => {
  try {
    const deleted = await softDeleteConsignor(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Consignor not found" });
    res.json({ message: "✅ Consignor deleted" });
  } catch (error) {
    console.error("❌ Error deleting consignor:", error);
    res.status(500).json({ error: "Server error while deleting consignor" });
  }
};