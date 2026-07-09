import {
  createPurchaseTransaction,
  getAllPurchases,
  getPurchaseById,
} from "../models/purchaseModel.js";

export const createPurchase = async (req, res) => {
  try {
    const { supplier_id, items } = req.body;

    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid purchase data" });
    }

    const purchase = await createPurchaseTransaction(
      supplier_id,
      items
    );

    res.status(201).json(purchase);

  } catch (error) {
    console.error("Create purchase error:", error);
    res.status(500).json({ message: "Failed to create purchase" });
  }
};


export const fetchPurchases = async (req, res) => {
  try {
    const purchases = await getAllPurchases();
    res.json(purchases);
  } catch (error) {
    console.error("Fetch purchases error:", error);
    res.status(500).json({ message: "Failed to fetch purchases" });
  }
};


export const fetchPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await getPurchaseById(id);

    if (!purchase.purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.json(purchase);

  } catch (error) {
    console.error("Fetch purchase error:", error);
    res.status(500).json({ message: "Failed to fetch purchase" });
  }
};
