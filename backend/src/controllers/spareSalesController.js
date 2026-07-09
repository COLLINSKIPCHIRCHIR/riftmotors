import { recordSpareSale, getSpareSaleReceipt, getAllSpareSales } from "../models/spareSalesModel.js";
import pool from "../config/db.js";

export const createSpareSale = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Sale items are required" });
    }

    const sale = await recordSpareSale(req.body);

    res.status(201).json({
      message: "✅ Spare sale recorded successfully",
      sale
    });
  } catch (error) {
  if (error.message.includes("Insufficient stock")) {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: "Server error while recording spare sale" });
}
};

export const fetchAllSpareSales = async (req, res) => {
  try {
    const sales = await getAllSpareSales();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const fetchSpareSaleReceipt = async (req, res) => {
  try {
    const receipt = await getSpareSaleReceipt(req.params.id);
    res.json(receipt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};





