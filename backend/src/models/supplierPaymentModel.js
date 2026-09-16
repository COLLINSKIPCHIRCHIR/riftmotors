import pool from "../config/db.js";

const TOLERANCE = 0.01;

// ➤ Record a payment to a supplier and allocate it across one or more
//   of that supplier's invoices in the same transaction. allocations
//   must add up to exactly `amount` — no silent leftover — so a typo
//   in one allocation box gets caught immediately instead of leaving
//   an unaccounted balance floating.
export const createSupplierPayment = async (
  supplier_id,
  amount,
  allocations,
  { payment_date = null, payment_method = null, reference_number = null, notes = null, created_by = null } = {}
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!allocations || allocations.length === 0) {
      throw new Error("A payment needs at least one invoice allocation");
    }
    if (!amount || amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    const allocatedTotal = allocations.reduce((sum, a) => sum + Number(a.amount_allocated), 0);
    if (Math.abs(allocatedTotal - Number(amount)) > TOLERANCE) {
      throw new Error(
        `Allocations (${allocatedTotal.toFixed(2)}) must add up to the payment amount (${Number(amount).toFixed(2)})`
      );
    }

    const paymentResult = await client.query(
      `INSERT INTO supplier_payments
        (supplier_id, amount, payment_date, payment_method, reference_number, notes, created_by)
       VALUES ($1,$2, COALESCE($3, CURRENT_DATE), $4,$5,$6,$7)
       RETURNING *`,
      [supplier_id, amount, payment_date, payment_method, reference_number, notes, created_by]
    );
    const payment = paymentResult.rows[0];

    for (const allocation of allocations) {
      const invoiceResult = await client.query(
        `SELECT * FROM supplier_invoices WHERE id = $1 FOR UPDATE`,
        [allocation.invoice_id]
      );
      const invoice = invoiceResult.rows[0];

      if (!invoice) {
        throw new Error(`Invoice ${allocation.invoice_id} not found`);
      }
      if (Number(invoice.supplier_id) !== Number(supplier_id)) {
        throw new Error(`Invoice ${allocation.invoice_id} does not belong to this supplier`);
      }
      if (invoice.status === "cancelled") {
        throw new Error(`Invoice ${invoice.invoice_number} is cancelled and can't be paid`);
      }

      const balance = Number(invoice.total) - Number(invoice.amount_paid);
      const amount_allocated = Number(allocation.amount_allocated);

      if (amount_allocated > balance + TOLERANCE) {
        throw new Error(
          `Allocation of ${amount_allocated.toFixed(2)} to invoice ${invoice.invoice_number} exceeds its balance of ${balance.toFixed(2)}`
        );
      }

      await client.query(
        `INSERT INTO supplier_payment_allocations (payment_id, invoice_id, amount_allocated)
         VALUES ($1,$2,$3)`,
        [payment.id, allocation.invoice_id, amount_allocated]
      );

      const newAmountPaid = Number(invoice.amount_paid) + amount_allocated;
      const newStatus =
        newAmountPaid >= Number(invoice.total) - TOLERANCE
          ? "paid"
          : newAmountPaid > 0
          ? "partially_paid"
          : "unpaid";

      await client.query(
        `UPDATE supplier_invoices
         SET amount_paid = $1, status = $2, updated_at = NOW()
         WHERE id = $3`,
        [newAmountPaid, newStatus, allocation.invoice_id]
      );
    }

    await client.query("COMMIT");
    return payment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ➤ List, optionally filtered by supplier_id
export const getAllSupplierPayments = async (supplier_id) => {
  const query = `
    SELECT sp.*, s.name AS supplier_name
    FROM supplier_payments sp
    LEFT JOIN suppliers s ON sp.supplier_id = s.id
    ${supplier_id ? "WHERE sp.supplier_id = $1" : ""}
    ORDER BY sp.created_at DESC
  `;

  const result = supplier_id ? await pool.query(query, [supplier_id]) : await pool.query(query);
  return result.rows;
};

// ➤ Get one payment with its invoice allocations
export const getSupplierPaymentById = async (id) => {
  const paymentResult = await pool.query(
    `SELECT sp.*, s.name AS supplier_name
     FROM supplier_payments sp
     LEFT JOIN suppliers s ON sp.supplier_id = s.id
     WHERE sp.id = $1`,
    [id]
  );

  const allocationsResult = await pool.query(
    `SELECT spa.*, si.invoice_number, si.supplier_invoice_number, si.total AS invoice_total
     FROM supplier_payment_allocations spa
     JOIN supplier_invoices si ON spa.invoice_id = si.id
     WHERE spa.payment_id = $1`,
    [id]
  );

  return {
    payment: paymentResult.rows[0],
    allocations: allocationsResult.rows,
  };
};

// ➤ Supplier statement — invoices and payments, kept as two separate
//   lists (merging into one running-balance timeline is cheap to do
//   client-side and keeps this query simple).
export const getSupplierStatement = async (supplier_id, { from_date, to_date } = {}) => {
  const supplierResult = await pool.query(`SELECT * FROM suppliers WHERE id = $1`, [supplier_id]);
  const supplier = supplierResult.rows[0];

  const invoicesResult = await pool.query(
    `SELECT id, invoice_number, supplier_invoice_number, invoice_date, total
     FROM supplier_invoices
     WHERE supplier_id = $1 AND status != 'cancelled'
     ORDER BY invoice_date ASC, id ASC`,
    [supplier_id]
  );

  const paymentsResult = await pool.query(
    `SELECT id, amount, payment_date, payment_method, reference_number
     FROM supplier_payments
     WHERE supplier_id = $1
     ORDER BY payment_date ASC, id ASC`,
    [supplier_id]
  );

  // Normalize both kinds of rows into one shape: a debit (increases what
  // we owe) or a credit (reduces it).
  const invoiceLines = invoicesResult.rows.map((inv) => ({
    date: inv.invoice_date,
    type: "invoice",
    id: inv.id,
    reference: inv.invoice_number,
    detail: inv.supplier_invoice_number || null,
    debit: Number(inv.total),
    credit: 0,
  }));

  const paymentLines = paymentsResult.rows.map((p) => ({
    date: p.payment_date,
    type: "payment",
    id: p.id,
    reference: p.reference_number || null,
    detail: p.payment_method || null,
    debit: 0,
    credit: Number(p.amount),
  }));

  // Same-day tie-break: an invoice is treated as landing before a payment
  // made the same day, since a payment made "today" is normally settling
  // something already owed rather than something invoiced later today.
  const allLines = [...invoiceLines, ...paymentLines].sort((a, b) => {
    const dateDiff = new Date(a.date) - new Date(b.date);
    if (dateDiff !== 0) return dateDiff;
    if (a.type !== b.type) return a.type === "invoice" ? -1 : 1;
    return a.id - b.id;
  });

  const fromDate = from_date ? new Date(from_date) : null;
  const toDate = to_date ? new Date(to_date) : null;

  let openingBalance = 0;
  const linesInRange = [];

  for (const line of allLines) {
    const lineDate = new Date(line.date);
    if (fromDate && lineDate < fromDate) {
      openingBalance += line.debit - line.credit;
      continue;
    }
    if (toDate && lineDate > toDate) {
      continue;
    }
    linesInRange.push(line);
  }

  let runningBalance = openingBalance;
  const transactions = linesInRange.map((line) => {
    runningBalance += line.debit - line.credit;
    return { ...line, balance: runningBalance };
  });

  return {
    supplier,
    from_date: from_date || null,
    to_date: to_date || null,
    opening_balance: openingBalance,
    closing_balance: runningBalance,
    transactions,
  };
};