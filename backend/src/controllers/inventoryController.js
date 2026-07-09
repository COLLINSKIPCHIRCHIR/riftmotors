// src/controllers/inventoryController.js
import { getAllInventoryItems } from "../models/inventoryModel.js";

export const getAllInventory = async (req, res) => {
  try {
    const items = await getAllInventoryItems();
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Server error fetching inventory" });
  }
};
