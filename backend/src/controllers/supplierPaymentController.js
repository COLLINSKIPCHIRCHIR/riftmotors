import {
  createSupplierPayment,
  getAllSupplierPayments,
  getSupplierPaymentById,
  getSupplierStatement,
} from "../models/supplierPaymentModel.js";

// ➤ Record a payment, split across one or more invoices
export const createPayment = async (req, res) => {
  try {
    const { supplier_id, amount, allocations, payment_date, payment_method, reference_number, notes } = req.body;

    if (!supplier_id || !amount || !allocations || allocations.length === 0) {
      return res.status(400).json({ message: "supplier_id, amount and at least one allocation are required" });
    }

    const payment = await createSupplierPayment(
      supplier_id,
      amount,
      allocations,
      { payment_date, payment_method, reference_number, notes, created_by: req.user?.id || null }
    );

    res.status(201).json(payment);
  } catch (error) {
    console.error("Create supplier payment error:", error);
    res.status(400).json({ message: error.message || "Failed to record payment" });
  }
};

// ➤ List (?supplier_id=)
export const fetchPayments = async (req, res) => {
  try {
    const { supplier_id } = req.query;
    const payments = await getAllSupplierPayments(supplier_id);
    res.json(payments);
  } catch (error) {
    console.error("Fetch supplier payments error:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

// ➤ Get single payment with its allocations
export const fetchPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getSupplierPaymentById(id);

    if (!data.payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Fetch supplier payment error:", error);
    res.status(500).json({ message: "Failed to fetch payment" });
  }
};

// ➤ Supplier statement — invoices + payments for a running balance
export const fetchStatement = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { from_date, to_date } = req.query;
    const statement = await getSupplierStatement(supplierId, { from_date, to_date });

    if (!statement.supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json(statement);
  } catch (error) {
    console.error("Fetch supplier statement error:", error);
    res.status(500).json({ message: "Failed to fetch supplier statement" });
  }
};