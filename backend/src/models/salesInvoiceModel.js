// src/models/salesInvoiceModel.js
import pool from "../config/db.js";

const generateInvoiceNo = async (client) => {
  const result = await client.query(
    `UPDATE document_sequences
     SET last_number = last_number + 1
     WHERE doc_type = 'sales_invoice'
     RETURNING prefix, last_number;`
  );
  const { prefix, last_number } = result.rows[0];
  return `${prefix}${last_number}`;
};

export const createInvoice = async (invoiceData) => {
  const {
    quote_id,
    vehicle_id,
    customer_id,
    sale_price,
    trade_in_amount,
    vat_amount,
    registration_fee,
    payment_method,
    created_by,
    items, // optional — used when no quote_id, or to override quote items
  } = invoiceData;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const vehicleCheck = await client.query(
      `SELECT status FROM vehicles WHERE id = $1 FOR UPDATE`,
      [vehicle_id]
    );
    if (!vehicleCheck.rows[0]) throw new Error("Vehicle not found");
    if (vehicleCheck.rows[0].status === "sold") {
      throw new Error("Vehicle has already been sold");
    }

    // Pull items from the quote if converting one and no explicit items given
    let itemsToInsert = items || [];
    if (quote_id && (!items || items.length === 0)) {
      const quoteItemsResult = await client.query(
        `SELECT item_name, price, quantity FROM sales_quote_items WHERE quote_id = $1`,
        [quote_id]
      );
      itemsToInsert = quoteItemsResult.rows;
    }

    const itemsTotal = itemsToInsert.reduce(
      (sum, it) => sum + Number(it.price) * Number(it.quantity || 1),
      0
    );

    const invoice_no = await generateInvoiceNo(client);
    const total_amount =
      Number(sale_price)
      - Number(trade_in_amount || 0)
      + Number(vat_amount || 0)
      + Number(registration_fee || 0)
      + itemsTotal;

    const insertQuery = `
      INSERT INTO sales_invoices
        (invoice_no, quote_id, vehicle_id, customer_id, sale_price,
        trade_in_amount, vat_amount, registration_fee, total_amount, payment_method,
        payment_status, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'unpaid',$11)
      RETURNING *;
    `;
    const values = [
      invoice_no, quote_id || null, vehicle_id, customer_id, sale_price,
      trade_in_amount || 0, vat_amount || 0, registration_fee || 0, total_amount,
      payment_method || null, created_by || null,
    ];

    const invoiceResult = await client.query(insertQuery, values);
    const invoice = invoiceResult.rows[0];

    let insertedItems = [];
    if (itemsToInsert.length > 0) {
      const itemValues = [];
      const placeholders = itemsToInsert
        .map((it, i) => {
          itemValues.push(invoice.id, it.item_name, it.price, it.quantity || 1);
          const base = i * 4;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
        })
        .join(", ");

      const itemsResult = await client.query(
        `INSERT INTO sales_invoice_items (invoice_id, item_name, price, quantity)
         VALUES ${placeholders} RETURNING *;`,
        itemValues
      );
      insertedItems = itemsResult.rows;
    }

    await client.query(`UPDATE vehicles SET status = 'sold' WHERE id = $1`, [vehicle_id]);

    if (quote_id) {
      await client.query(`UPDATE sales_quotes SET status = 'accepted' WHERE id = $1`, [quote_id]);
    }

    await client.query("COMMIT");
    return { ...invoice, items: insertedItems };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getAllInvoices = async () => {
  const query = `
    SELECT i.*, v.make, v.model, v.year, v.chassis_no, c.name AS customer_name, c.phone AS customer_phone
    FROM sales_invoices i
    JOIN vehicles v ON i.vehicle_id = v.id
    JOIN customers c ON i.customer_id = c.id
    ORDER BY i.sale_date DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const getInvoiceById = async (id) => {
  const query = `
    SELECT i.*, v.make, v.model, v.year, v.chassis_no, v.color, v.mileage,
           c.name AS customer_name, c.phone AS customer_phone, c.address AS customer_address
    FROM sales_invoices i
    JOIN vehicles v ON i.vehicle_id = v.id
    JOIN customers c ON i.customer_id = c.id
    WHERE i.id = $1;
  `;
  const result = await pool.query(query, [id]);
  const invoice = result.rows[0];
  if (!invoice) return null;

  const itemsResult = await pool.query(
    `SELECT * FROM sales_invoice_items WHERE invoice_id = $1 ORDER BY id ASC`,
    [id]
  );
  invoice.items = itemsResult.rows;
  return invoice;
};

export const updatePaymentStatus = async (id, payment_status) => {
  const validStatuses = ["unpaid", "partial", "paid"];
  if (!validStatuses.includes(payment_status)) {
    throw new Error("Invalid payment status");
  }
  const result = await pool.query(
    `UPDATE sales_invoices SET payment_status = $1 WHERE id = $2 RETURNING *`,
    [payment_status, id]
  );
  return result.rows[0];
};