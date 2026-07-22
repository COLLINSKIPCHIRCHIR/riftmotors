import pool from "../config/db.js";
import { recordSpareSale } from "./spareSalesModel.js";
import { recordStockMovement } from "./stockMovementModel.js"; // add this if not imported yet

export const createSpareInvoiceTables = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS spare_invoices (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(50) UNIQUE,
      estimate_id INT REFERENCES spare_estimates(id),
      customer_id INT REFERENCES customers(id),
      customer_name VARCHAR(150),
      customer_phone VARCHAR(50),
      subtotal NUMERIC(12,2) NOT NULL,
      discount NUMERIC(12,2) DEFAULT 0,
      total NUMERIC(12,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spare_invoice_items (
      id SERIAL PRIMARY KEY,
      invoice_id INT REFERENCES spare_invoices(id) ON DELETE CASCADE,
      sparepart_id INT REFERENCES spareparts(id),
      quantity INT NOT NULL,
      unit_price NUMERIC(12,2) NOT NULL,
      total_price NUMERIC(12,2) NOT NULL
    );
  `;

  await pool.query(query);
  console.log("✅ Spare invoice tables ready");
};

const generateInvoiceNumber = async (client) => {
  const year = new Date().getFullYear();
  const result = await client.query(
    `SELECT COALESCE(MAX(id), 0) + 1 AS next FROM spare_invoices`
  );
  const next = result.rows[0].next;
  return `INV-${year}-${String(next).padStart(5, "0")}`;
};

export const convertEstimateToInvoice = async (estimateId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const estimateRes = await client.query(
      `SELECT * FROM spare_estimates WHERE id=$1 AND status='pending'`,
      [estimateId]
    );

    if (estimateRes.rows.length === 0) {
      throw new Error("Estimate not found or already processed");
    }

    const estimate = estimateRes.rows[0];

    const itemsRes = await client.query(
      `SELECT * FROM spare_estimate_items WHERE estimate_id=$1`,
      [estimateId]
    );

    const items = itemsRes.rows;

    const invoiceNumber = await generateInvoiceNumber(client);




    // 1️⃣ Insert invoice
    const invoiceRes = await client.query(
      `INSERT INTO spare_invoices
        (
        invoice_number,
        estimate_id,
        customer_id,
        customer_name,
        customer_phone,
        subtotal,
        discount,
        tax_rate,
        tax_amount,
        total
        )

        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)

        RETURNING *`,
      [
      invoiceNumber,
      estimateId,
      estimate.customer_id || null,
      estimate.customer_name,
      estimate.customer_phone,
      estimate.subtotal,
      estimate.discount,
      estimate.tax_rate,
      estimate.tax_amount,
      estimate.total
      ]
    );

    const invoiceId = invoiceRes.rows[0].id;

    // 2️⃣ Insert invoice items AND deduct stock immediately
    for (const item of items) {
      // Lock the sparepart row
      const stockRes = await client.query(
        `SELECT quantity FROM spareparts WHERE id=$1 FOR UPDATE`,
        [item.sparepart_id]
      );

      if (stockRes.rows.length === 0) {
        throw new Error(`Spare part ID ${item.sparepart_id} not found`);
      }

      const availableQty = stockRes.rows[0].quantity;

      if (availableQty < item.quantity) {
        throw new Error(
          `Insufficient stock for spare part ID ${item.sparepart_id}. Available: ${availableQty}`
        );
      }

      // Deduct stock
      await client.query(
        `UPDATE spareparts SET quantity = quantity - $1 WHERE id = $2`,
        [item.quantity, item.sparepart_id]
      );

      // Record stock movement
      await recordStockMovement(
        client,
        item.sparepart_id,
        "OUT",           // was "invoice"
        item.quantity,
        "invoice",
        invoiceId
      );

      // Insert invoice item
      await client.query(
        `INSERT INTO spare_invoice_items
         (invoice_id, sparepart_id, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          invoiceId,
          item.sparepart_id,
          item.quantity,
          item.unit_price,
          item.total_price
        ]
      );
    }

    // 3️⃣ Update estimate status
    await client.query(
      `UPDATE spare_estimates SET status='invoiced' WHERE id=$1`,
      [estimateId]
    );

    await client.query("COMMIT");
    return invoiceRes.rows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const convertInvoiceToSale = async (invoiceId, payment_method, amount_paid) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const invoiceRes = await client.query(
      `SELECT * FROM spare_invoices WHERE id=$1 AND status IN ('unpaid','partial')`,
      [invoiceId]
    );

    if (invoiceRes.rows.length === 0) {
      throw new Error("Invoice not found or already fully paid");
    }

    const invoice = invoiceRes.rows[0];

    const balanceBefore = Number(invoice.total) - Number(invoice.amount_paid || 0);
    const payment = Math.min(Number(amount_paid), balanceBefore);

    if (!(payment > 0)) {
      throw new Error("Payment amount must be greater than zero");
    }

    const balanceAfter = balanceBefore - payment;

    const itemsRes = await client.query(
      `SELECT * FROM spare_invoice_items WHERE invoice_id=$1`,
      [invoiceId]
    );
    const items = itemsRes.rows;

    const year = new Date().getFullYear();
    const countRes = await client.query(
      `SELECT COUNT(*) FROM spare_sales WHERE receipt_number IS NOT NULL`
    );
    const nextNumber = Number(countRes.rows[0].count) + 1;
    const receiptNumber = `RFT-${year}-${String(nextNumber).padStart(5, "0")}`;

    let subtotal = 0;
    items.forEach(item => {
      subtotal += Number(item.quantity) * Number(item.unit_price);
    });

    const saleRes = await client.query(
      `INSERT INTO spare_sales
        (
        customer_id,
        customer_name,
        customer_phone,
        subtotal,
        discount,
        tax_rate,
        tax_amount,
        total,
        payment_method,
        receipt_number,
        account_balance_before,
        account_balance_after
        )

        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)

        RETURNING *`,
      [
        invoice.customer_id || null,
        invoice.customer_name,
        invoice.customer_phone,
        subtotal,
        invoice.discount,
        invoice.tax_rate,
        invoice.tax_amount,
        payment,
        payment_method,
        receiptNumber,
        balanceBefore,
        balanceAfter
      ]
    );

    const saleId = saleRes.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO spare_sale_items
         (sale_id, sparepart_id, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5)`,
        [saleId, item.sparepart_id, item.quantity, item.unit_price, item.total_price]
      );
    }

    const newAmountPaid = Number(invoice.amount_paid || 0) + payment;
    const newStatus = balanceAfter <= 0 ? "paid" : "partial";

    await client.query(
      `UPDATE spare_invoices SET amount_paid=$1, status=$2 WHERE id=$3`,
      [newAmountPaid, newStatus, invoiceId]
    );

    if (newStatus === "paid") {
      await client.query(
        `UPDATE spare_estimates SET status='sold' WHERE id=$1`,
        [invoice.estimate_id]
      );
    }

    await client.query("COMMIT");
    return saleRes.rows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getAllInvoices = async () => {
  const result = await pool.query(
    `SELECT * FROM spare_invoices ORDER BY created_at DESC`
  );
  return result.rows;
};

/*
  NOTE: spare invoices don't link to a vehicle (see spare_estimates - same
  reasoning: walk-in sparepart customers don't necessarily have a vehicle
  on file). This LEFT JOIN only pulls kra_pin/address/email from customers
  when customer_id happens to be set - otherwise those come back null and
  the frontend renders "N/A".
*/
export const getInvoiceById = async (id) => {

  const invoice = await pool.query(
    `SELECT
        si.*,
        COALESCE(c.name, si.customer_name)   AS customer_name,
        COALESCE(c.phone, si.customer_phone) AS customer_phone,
        c.kra_pin  AS customer_kra_pin,
        c.address  AS customer_address,
        c.email    AS customer_email
     FROM spare_invoices si
     LEFT JOIN customers c ON c.id = si.customer_id
     WHERE si.id = $1`,
    [id]
  );

  if (invoice.rows.length === 0) {
    return null;
  }

  const items = await pool.query(
    `SELECT 
        sii.id,
        sii.invoice_id,
        sii.sparepart_id,
        sii.quantity,
        sii.unit_price,
        sii.total_price,
        sp.name,
        sp.part_number
     FROM spare_invoice_items sii
     JOIN spareparts sp 
       ON sp.id = sii.sparepart_id
     WHERE sii.invoice_id = $1`,
    [id]
  );

  return {
    ...invoice.rows[0],
    items: items.rows
  };
};

export const cancelInvoice = async (invoiceId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Only unpaid invoices can be cancelled
    const invoiceRes = await client.query(
      `SELECT * FROM spare_invoices WHERE id=$1 AND status='unpaid'`,
      [invoiceId]
    );

    if (invoiceRes.rows.length === 0) {
      throw new Error("Invoice not found or already paid/cancelled");
    }

    const invoice = invoiceRes.rows[0];

    // Get items to reverse stock
    const itemsRes = await client.query(
      `SELECT * FROM spare_invoice_items WHERE invoice_id=$1`,
      [invoiceId]
    );

    // Reverse stock deduction
    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE spareparts SET quantity = quantity + $1 WHERE id = $2`,
        [item.quantity, item.sparepart_id]
      );

      // Record reversal movement
      await recordStockMovement(
        client,
        item.sparepart_id,
        "IN",
        item.quantity,
        "invoice_cancelled",
        invoiceId
      );
    }

    // Mark invoice cancelled
    await client.query(
      `UPDATE spare_invoices SET status='cancelled' WHERE id=$1`,
      [invoiceId]
    );

    // Revert estimate back to pending
    await client.query(
      `UPDATE spare_estimates SET status='pending' WHERE id=$1`,
      [invoice.estimate_id]
    );

    await client.query("COMMIT");
    return { message: "Invoice cancelled and stock restored" };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getFilteredInvoices = async ({ status, customer_name, from, to } = {}) => {
  let conditions = [];
  let values = [];
  let i = 1;

  if (status) {
    conditions.push(`status = $${i++}`);
    values.push(status);
  }

  if (customer_name) {
    conditions.push(`customer_name ILIKE $${i++}`);
    values.push(`%${customer_name}%`);
  }

  if (from) {
    conditions.push(`created_at >= $${i++}`);
    values.push(from);
  }

  if (to) {
    conditions.push(`created_at <= $${i++}`);
    values.push(to);
  }

  const where = conditions.length 
    ? `WHERE ${conditions.join(" AND ")}` 
    : "";

  const result = await pool.query(
    `SELECT * FROM spare_invoices ${where} ORDER BY created_at DESC`,
    values
  );

  return result.rows;
};