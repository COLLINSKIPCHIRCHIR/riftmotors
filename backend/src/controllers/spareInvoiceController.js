import {
  convertEstimateToInvoice,
  convertInvoiceToSale,
  getFilteredInvoices,
  getAllInvoices,
  getInvoiceById,
  cancelInvoice
} from "../models/spareInvoiceModel.js";

export const convertEstimate = async (req, res) => {
  try {
    const invoice = await convertEstimateToInvoice(req.params.id);
    res.json({
      message: "Estimate converted to invoice",
      invoice
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const payInvoice = async (req, res) => {
  const { payment_method, amount_paid } = req.body;

  if (!payment_method) {
    return res.status(400).json({ error: "payment_method required" });
  }

  if (!amount_paid || Number(amount_paid) <= 0) {
    return res.status(400).json({ error: "amount_paid must be greater than zero" });
  }

  try {
    const sale = await convertInvoiceToSale(req.params.id, payment_method, amount_paid);

    res.json({
      message: "Payment recorded successfully",
      sale
    });
  } catch (err) {
    if (err.message.includes("Insufficient stock")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
};



export const getInvoices = async (req, res, next) => {
  try {
    const { status, customer_name, from, to } = req.query;
    const invoices = await getFilteredInvoices({ status, customer_name, from, to });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

export const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    const invoice = await getInvoiceById(Number(id));

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ message: "Failed to fetch invoice" });
  }
};


export const voidInvoice = async (req, res, next) => {
  try {
    const result = await cancelInvoice(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};