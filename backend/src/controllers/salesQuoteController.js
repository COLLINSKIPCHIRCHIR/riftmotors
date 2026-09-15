// src/controllers/salesQuoteController.js
import { createQuote, getAllQuotes, getQuoteById, updateQuoteStatus } from "../models/salesQuoteModel.js";

export const createSalesQuote = async (req, res) => {
  try {
    const { vehicle_id, customer_id, quoted_price } = req.body;
    if (!vehicle_id || !customer_id || !quoted_price) {
      return res.status(400).json({ error: "Vehicle, customer, and quoted price are required." });
    }

    const quoteData = { ...req.body, created_by: req.user?.id || null };
    const quote = await createQuote(quoteData);

    res.status(201).json({ message: "✅ Quote created successfully", quote });
  } catch (error) {
    console.error("❌ Error creating quote:", error);
    res.status(500).json({ error: "Server error while creating quote" });
  }
};

export const fetchAllQuotes = async (req, res) => {
  try {
    const quotes = await getAllQuotes();
    res.json(quotes);
  } catch (error) {
    console.error("❌ Error fetching quotes:", error);
    res.status(500).json({ error: "Server error while fetching quotes" });
  }
};

export const fetchQuoteById = async (req, res) => {
  try {
    const quote = await getQuoteById(req.params.id);
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    res.json(quote);
  } catch (error) {
    console.error("❌ Error fetching quote:", error);
    res.status(500).json({ error: "Server error while fetching quote" });
  }
};

export const changeQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await updateQuoteStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "Quote not found" });
    res.json({ message: "✅ Quote status updated", quote: updated });
  } catch (error) {
    console.error("❌ Error updating quote status:", error);
    res.status(400).json({ error: error.message || "Server error while updating quote status" });
  }
};