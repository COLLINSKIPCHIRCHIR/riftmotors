import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../models/supplierModel.js";

// ➤ Create
export const addSupplier = async (req, res) => {
  try {
    const supplier = await createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    console.error("❌ Error creating supplier:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ➤ List
export const listSuppliers = async (req, res) => {
  try {
    const suppliers = await getAllSuppliers();
    res.json(suppliers);
  } catch (err) {
    console.error("❌ Error fetching suppliers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ➤ Get Single
export const fetchSupplier = async (req, res) => {
  try {
    const supplier = await getSupplierById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Not found" });

    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ➤ Update
export const editSupplier = async (req, res) => {
  try {
    const supplier = await updateSupplier(req.params.id, req.body);
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ➤ Delete
export const removeSupplier = async (req, res) => {
  try {
    const supplier = await deleteSupplier(req.params.id);
    res.json({ message: "Supplier deactivated", supplier });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
