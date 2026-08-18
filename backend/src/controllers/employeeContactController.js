import {
  createEmployeeContact,
  getAllEmployeeContacts,
  getContactsByEmployee,
  getEmployeeContactById,
  updateEmployeeContact,
  deleteEmployeeContact,
} from "../models/employeeContactModel.js";

// Create
export const addEmployeeContact = async (req, res) => {
  try {
    const contact = await createEmployeeContact(req.body);

    res.status(201).json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// List
export const listEmployeeContacts = async (req, res) => {
  try {
    const contacts = await getAllEmployeeContacts();

    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Employee Contacts
export const listEmployeeContactsByEmployee = async (req, res) => {
  try {
    const contacts = await getContactsByEmployee(req.params.employeeId);

    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Single
export const fetchEmployeeContact = async (req, res) => {
  try {
    const contact = await getEmployeeContactById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update
export const editEmployeeContact = async (req, res) => {
  try {
    const contact = await updateEmployeeContact(req.params.id, req.body);

    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete
export const removeEmployeeContact = async (req, res) => {
  try {
    const contact = await deleteEmployeeContact(req.params.id);

    res.json({
      message: "Contact deleted",
      contact,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};