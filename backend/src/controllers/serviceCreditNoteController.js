import {
  createServiceCreditNote,
  getServiceCreditNotes,
  getServiceCreditNoteById,
  updateServiceCreditNote
} from "../models/serviceCreditNoteModel.js";

export const createCreditNote = async (req, res) => {
  try {
    const creditNote = await createServiceCreditNote(req.body);
    res.json({ message: "Credit note issued", creditNote });
  } catch (err) {
    console.error("CREATE CREDIT NOTE ERROR:", err);
    res.status(400).json({ error: err.message });
  }
};

export const getCreditNotes = async (req, res) => {
  try {
    const creditNotes = await getServiceCreditNotes();
    res.json(creditNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCreditNote = async (req, res) => {
  try {
    const creditNote = await getServiceCreditNoteById(req.params.id);
    if (!creditNote) {
      return res.status(404).json({ message: "Credit note not found" });
    }
    res.json(creditNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCreditNote = async (req, res) => {
  try {
    const creditNote = await updateServiceCreditNote(req.params.id, req.body);
    res.json({ message: "Credit note updated", creditNote });
  } catch (err) {
    console.error("UPDATE CREDIT NOTE ERROR:", err);
    res.status(400).json({ error: err.message });
  }
};