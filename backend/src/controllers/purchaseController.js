import {
  createPurchaseTransaction,
  getAllPurchases,
  getPurchaseById,
  sendPurchaseOrder,
  cancelPurchaseOrder,
  createGoodsReceipt,
} from "../models/purchaseModel.js";

// ➤ Create LPO (draft)
export const createPurchase = async (req, res) => {
  try {
    const { supplier_id, items, expected_delivery_date, notes } = req.body;

    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid purchase data" });
    }

    const purchase = await createPurchaseTransaction(
      supplier_id,
      items,
      req.user?.id || null,
      { expected_delivery_date, notes }
    );

    res.status(201).json(purchase);
  } catch (error) {
    console.error("Create purchase error:", error);
    res.status(500).json({ message: "Failed to create purchase" });
  }
};

// ➤ List (?status=draft|sent|partially_received|received|cancelled)
export const fetchPurchases = async (req, res) => {
  try {
    const { status } = req.query;
    const purchases = await getAllPurchases(status);
    res.json(purchases);
  } catch (error) {
    console.error("Fetch purchases error:", error);
    res.status(500).json({ message: "Failed to fetch purchases" });
  }
};

// ➤ Get single LPO (items + receipt history)
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

// ➤ Send: draft -> sent
export const sendPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await sendPurchaseOrder(id, req.user?.id || null);

    if (!purchase) {
      return res.status(400).json({
        message: "LPO could not be sent — it may not be in draft status",
      });
    }

    res.json(purchase);
  } catch (error) {
    console.error("Send purchase error:", error);
    res.status(500).json({ message: "Failed to send LPO" });
  }
};

// ➤ Cancel: draft/sent -> cancelled
export const cancelPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await cancelPurchaseOrder(id);

    if (!purchase) {
      return res.status(400).json({
        message: "LPO could not be cancelled — it may already be (partially) received",
      });
    }

    res.json(purchase);
  } catch (error) {
    console.error("Cancel purchase error:", error);
    res.status(500).json({ message: "Failed to cancel LPO" });
  }
};

// ➤ Receive goods (supports partial deliveries — call again for the rest)
export const receiveGoods = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "At least one received item is required" });
    }

    const result = await createGoodsReceipt(id, items, req.user?.id || null, notes);
    res.status(201).json(result);
  } catch (error) {
    console.error("Receive goods error:", error);
    res.status(400).json({ message: error.message || "Failed to record goods receipt" });
  }
};