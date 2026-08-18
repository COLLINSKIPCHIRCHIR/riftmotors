import {
  createEmployeeDocument,
  getAllEmployeeDocuments,
  getEmployeeDocuments,
  getEmployeeDocumentById,
  updateEmployeeDocument,
  deleteEmployeeDocument,
} from "../models/employeeDocumentModel.js";

// Create
export const addEmployeeDocument = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.file);

    const data = {
      ...req.body,
      file_name: req.file.originalname,
      file_path: `/uploads/${req.file.filename}`,
      uploaded_by: req.user?.id || null,
    };

    const document = await createEmployeeDocument(data);

    res.status(201).json(document);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// List
export const listEmployeeDocuments = async (req, res) => {
  try {
    const docs = await getAllEmployeeDocuments();

    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Employee Documents
export const listEmployeeDocumentsByEmployee = async (req, res) => {
  try {
    const docs = await getEmployeeDocuments(req.params.employeeId);

    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Single
export const fetchEmployeeDocument = async (req, res) => {
  try {
    const doc = await getEmployeeDocumentById(req.params.id);

    if (!doc) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update
export const editEmployeeDocument = async (req, res) => {
  try {
    const existing = await getEmployeeDocumentById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const data = {
      document_type: req.body.document_type,
      file_name: req.file
        ? req.file.originalname
        : existing.file_name,
      file_path: req.file
        ? `/uploads/${req.file.filename}`
        : existing.file_path,
    };

    const updated = await updateEmployeeDocument(
      req.params.id,
      data
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete
export const removeEmployeeDocument = async (req, res) => {
  try {
    const doc = await deleteEmployeeDocument(req.params.id);

    res.json({
      message: "Document deleted",
      document: doc,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};