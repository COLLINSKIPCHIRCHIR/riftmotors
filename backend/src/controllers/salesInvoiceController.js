// src/controllers/salesInvoiceController.js
import { createInvoice, getAllInvoices, getInvoiceById, updatePaymentStatus } from "../models/salesInvoiceModel.js";

export const createSalesInvoice = async (req, res) => {
  try {
    const { vehicle_id, customer_id, sale_price } = req.body;
    if (!vehicle_id || !customer_id || !sale_price) {
      return res.status(400).json({ error: "Vehicle, customer, and sale price are required." });
    }

    const invoiceData = { ...req.body, created_by: req.user?.id || null };
    const invoice = await createInvoice(invoiceData);

    res.status(201).json({ message: "✅ Invoice created successfully", invoice });
  } catch (error) {
    console.error("❌ Error creating invoice:", error);
    res.status(400).json({ error: error.message || "Server error while creating invoice" });
  }
};

export const fetchAllInvoices = async (req, res) => {
  try {
    const invoices = await getAllInvoices();
    res.json(invoices);
  } catch (error) {
    console.error("❌ Error fetching invoices:", error);
    res.status(500).json({ error: "Server error while fetching invoices" });
  }
};

export const fetchInvoiceById = async (req, res) => {
  try {
    const invoice = await getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    console.error("❌ Error fetching invoice:", error);
    res.status(500).json({ error: "Server error while fetching invoice" });
  }
};

export const changePaymentStatus = async (req, res) => {
  try {
    const updated = await updatePaymentStatus(req.params.id, req.body.payment_status);
    if (!updated) return res.status(404).json({ error: "Invoice not found" });
    res.json({ message: "✅ Payment status updated", invoice: updated });
  } catch (error) {
    console.error("❌ Error updating payment status:", error);
    res.status(400).json({ error: error.message || "Server error while updating payment status" });
  }
};