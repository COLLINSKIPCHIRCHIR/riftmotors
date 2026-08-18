import {
  createEmployeeNote,
  getAllEmployeeNotes,
  getEmployeeNotes,
  getEmployeeNoteById,
  updateEmployeeNote,
  deleteEmployeeNote,
} from "../models/employeeNoteModel.js";

// ===============================
// Create
// ===============================
export const addEmployeeNote = async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_by: req.user?.id || null,
    };

    const note = await createEmployeeNote(data);

    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// List All
// ===============================
export const listEmployeeNotes = async (req, res) => {
  try {
    const notes = await getAllEmployeeNotes();

    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Notes By Employee
// ===============================
export const listEmployeeNotesByEmployee = async (req, res) => {
  try {
    const notes = await getEmployeeNotes(req.params.employeeId);

    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Get One
// ===============================
export const fetchEmployeeNote = async (req, res) => {
  try {
    const note = await getEmployeeNoteById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Update
// ===============================
export const editEmployeeNote = async (req, res) => {
  try {
    const note = await updateEmployeeNote(
      req.params.id,
      req.body
    );

    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Delete
// ===============================
export const removeEmployeeNote = async (req, res) => {
  try {
    const note = await deleteEmployeeNote(req.params.id);

    res.json({
      message: "Note deleted",
      note,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};