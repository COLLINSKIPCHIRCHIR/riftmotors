import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  softDeleteCustomer
} from "../models/customerModel.js";

/* =========================
   CREATE CUSTOMER
========================= */
export const newCustomer = async (req, res) => {
  try {
    const customer = await createCustomer(req.body);
    res.status(201).json({
      message: "Customer created successfully",
      customer
    });
  } catch (error) {
    console.error("❌ Error creating customer:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   LIST CUSTOMERS
========================= */
export const listCustomers = async (req, res) => {
  try {
    const customers = await getAllCustomers();
    res.json(customers);
  } catch (error) {
    console.error("❌ Error fetching customers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET CUSTOMER
========================= */
export const fetchCustomer = async (req, res) => {
  try {
    const customer = await getCustomerById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("❌ Error fetching customer:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   UPDATE CUSTOMER
========================= */
export const editCustomer = async (req, res) => {
  try {
    const updated = await updateCustomer(req.params.id, req.body);

    if (!updated) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({
      message: "Customer updated successfully",
      customer: updated
    });
  } catch (error) {
    console.error("❌ Error updating customer:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DELETE CUSTOMER
========================= */
export const deleteCustomer = async (req, res) => {
  try {
    const deleted = await softDeleteCustomer(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({
      message: "Customer deactivated successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting customer:", error);
    res.status(500).json({ message: "Server error" });
  }
};
