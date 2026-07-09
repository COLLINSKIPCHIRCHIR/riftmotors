// src/controllers/salesController.js
import { recordSale, getAllSales, getSaleById } from "../models/salesModel.js";

export const createSale = async (req, res) => {
  try {
    const saleData = req.body;

    if (!saleData.vehicle_id || !saleData.customer_name || !saleData.sale_price) {
      return res.status(400).json({ error: "Vehicle, customer name, and sale price are required." });
    }

    const sale = await recordSale(saleData);
    res.status(201).json({ message: "✅ Sale recorded successfully", sale });
  } catch (error) {
    console.error("❌ Error creating sale:", error);
    res.status(500).json({ error: "Server error while recording sale" });
  }
};

export const fetchAllSales = async (req, res) => {
  try {
    const sales = await getAllSales();
    res.json(sales);
  } catch (error) {
    console.error("❌ Error fetching sales:", error);
    res.status(500).json({ error: "Server error while fetching sales" });
  }
};

export const fetchSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await getSaleById(id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.json(sale);
  } catch (error) {
    console.error("❌ Error fetching sale:", error);
    res.status(500).json({ error: "Server error while fetching sale" });
  }
};
