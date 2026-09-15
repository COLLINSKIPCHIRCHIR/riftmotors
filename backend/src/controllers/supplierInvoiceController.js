import {
  createSupplierInvoice,
  getAllSupplierInvoices,
  getSupplierInvoiceById,
  cancelSupplierInvoice,
  getOutstandingInvoicesForSupplier,
} from "../models/supplierInvoiceModel.js";

// ➤ Create invoice (optionally against an LPO)
export const createInvoice = async (req, res) => {
  try {
    const {
      supplier_id,
      items,
      purchase_id,
      supplier_invoice_number,
      invoice_date,
      due_date,
      notes,
      tax_rate,
    } = req.body;

    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({ message: "supplier_id and at least one item are required" });
    }

    const { invoice, warnings } = await createSupplierInvoice(
      supplier_id,
      items,
      req.user?.id || null,
      { purchase_id, supplier_invoice_number, invoice_date, due_date, notes, tax_rate }
    );

    res.status(201).json({ invoice, warnings });
  } catch (error) {
    console.error("Create supplier invoice error:", error);
    res.status(400).json({ message: error.message || "Failed to create invoice" });
  }
};

// ➤ List (?status=&supplier_id=&purchase_id=)
export const fetchInvoices = async (req, res) => {
  try {
    const { status, supplier_id, purchase_id } = req.query;
    const invoices = await getAllSupplierInvoices({ status, supplier_id, purchase_id });
    res.json(invoices);
  } catch (error) {
    console.error("Fetch supplier invoices error:", error);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
};

// ➤ Get single invoice (items + payments applied)
export const fetchInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getSupplierInvoiceById(id);

    if (!data.invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Fetch supplier invoice error:", error);
    res.status(500).json({ message: "Failed to fetch invoice" });
  }
};

// ➤ Cancel — only allowed if nothing has been paid against it
export const cancelInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await cancelSupplierInvoice(id);
    res.json(invoice);
  } catch (error) {
    console.error("Cancel supplier invoice error:", error);
    res.status(400).json({ message: error.message || "Failed to cancel invoice" });
  }
};

// ➤ Outstanding invoices for a supplier — feeds the payment screen
export const fetchOutstandingForSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const invoices = await getOutstandingInvoicesForSupplier(supplierId);
    res.json(invoices);
  } catch (error) {
    console.error("Fetch outstanding invoices error:", error);
    res.status(500).json({ message: "Failed to fetch outstanding invoices" });
  }
};