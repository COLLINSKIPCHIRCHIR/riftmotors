import { createRefund } from "../models/refundModel.js";

export const processRefund = async (req, res, next) => {
  try {
    const { sale_id, items, reason } = req.body;

    if (!sale_id || !items || items.length === 0) {
      return res.status(400).json({ 
        message: "sale_id and items are required" 
      });
    }

    const refund = await createRefund({ sale_id, items, reason });
    res.status(201).json({ 
      message: "Refund processed successfully", 
      refund 
    });
  } catch (err) {
    next(err);
  }
};