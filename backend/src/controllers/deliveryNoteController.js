// src/controllers/deliveryNoteController.js
import { createDeliveryNote, getAllDeliveryNotes, getDeliveryNoteById, toggleDeliveryItem } from "../models/deliveryNoteModel.js";

export const createNote = async (req, res) => {
  try {
    const { invoice_id } = req.body;
    if (!invoice_id) return res.status(400).json({ error: "Invoice ID is required." });

    const note = await createDeliveryNote(req.body);
    res.status(201).json({ message: "✅ Delivery note created successfully", note });
  } catch (error) {
    console.error("❌ Error creating delivery note:", error);
    res.status(500).json({ error: "Server error while creating delivery note" });
  }
};

export const fetchAllNotes = async (req, res) => {
  try {
    const notes = await getAllDeliveryNotes();
    res.json(notes);
  } catch (error) {
    console.error("❌ Error fetching delivery notes:", error);
    res.status(500).json({ error: "Server error while fetching delivery notes" });
  }
};

export const fetchNoteById = async (req, res) => {
  try {
    const note = await getDeliveryNoteById(req.params.id);
    if (!note) return res.status(404).json({ error: "Delivery note not found" });
    res.json(note);
  } catch (error) {
    console.error("❌ Error fetching delivery note:", error);
    res.status(500).json({ error: "Server error while fetching delivery note" });
  }
};

export const checkDeliveryItem = async (req, res) => {
  try {
    const updated = await toggleDeliveryItem(req.params.itemId, req.body.is_checked);
    if (!updated) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "✅ Item updated", item: updated });
  } catch (error) {
    console.error("❌ Error updating item:", error);
    res.status(500).json({ error: "Server error while updating item" });
  }
};