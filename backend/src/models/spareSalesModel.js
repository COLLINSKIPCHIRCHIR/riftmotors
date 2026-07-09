// src/models/spareSalesModel.js
import pool from "../config/db.js";
import { recordStockMovement } from "./stockMovementModel.js";


export const createSpareSalesTables = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS spare_sales (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(150),
      customer_phone VARCHAR(50),
      subtotal NUMERIC(12,2) NOT NULL,
      discount NUMERIC(12,2) DEFAULT 0,
      total NUMERIC(12,2) NOT NULL,
      payment_method VARCHAR(50),
      sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spare_sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INT REFERENCES spare_sales(id) ON DELETE CASCADE,
      sparepart_id INT REFERENCES spareparts(id),
      quantity INT NOT NULL,
      unit_price NUMERIC(12,2) NOT NULL,
      total_price NUMERIC(12,2) NOT NULL
    );
  `;

  await pool.query(query);
  console.log("✅ Spare sales tables ready");
};

export const recordSpareSale = async (saleData) => {
  const {
    customer_name,
    customer_phone,
    items, // [{ sparepart_id, quantity, unit_price }]
    payment_method,
    discount = 0
  } = saleData;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Calculate totals
    // 1️⃣ Calculate totals

let subtotal = 0;

items.forEach(item => {
  subtotal += item.quantity * item.unit_price;
});


const tax_rate = 16;

const taxableAmount = subtotal - discount;


const tax_amount = taxableAmount * (tax_rate / 100);


const total = taxableAmount + tax_amount;


const receiptNumber = await generateReceiptNumber(client);



// 2️⃣ Insert sale

const saleQuery = `
INSERT INTO spare_sales
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
receipt_number
)

VALUES
($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)

RETURNING *;
`;


const saleResult = await client.query(
saleQuery,
[
saleData.customer_id || null,
customer_name,
customer_phone,
subtotal,
discount,
tax_rate,
tax_amount,
total,
payment_method,
receiptNumber
]
);

    const saleId = saleResult.rows[0].id;

    // 3️⃣ Insert sale items + deduct stock
    for (const item of items) {

       // 1️⃣ Lock & check stock
   const stockResult = await client.query(
    `SELECT quantity FROM spareparts WHERE id = $1 FOR UPDATE`,
    [item.sparepart_id]
  );

  if (stockResult.rows.length === 0) {
    throw new Error("Spare part not found");
  }

  const availableQty = stockResult.rows[0].quantity;

   if (availableQty < item.quantity) {
    throw new Error(
      `Insufficient stock for spare part ID ${item.sparepart_id}. Available: ${availableQty}`
    );
   }

      const itemTotal = item.quantity * item.unit_price;

       await client.query(
          `INSERT INTO spare_sale_items
          (sale_id, sparepart_id, quantity, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5)`,
          [saleId, item.sparepart_id, item.quantity, item.unit_price, itemTotal]
        );

     await client.query(
        `UPDATE spareparts
        SET quantity = quantity - $1
        WHERE id = $2`,
        [item.quantity, item.sparepart_id]
      );

      // 🔥 Record stock movement
    await recordStockMovement(
      client,
      item.sparepart_id,
      "OUT",          // was "sale"
      item.quantity,
      "sale",
      saleId
    );

    }

    await client.query("COMMIT");
    return saleResult.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error recording spare sale:", error);
    throw error;
  } finally {
    client.release();
  }
};



const generateReceiptNumber = async (client) => {
  const year = new Date().getFullYear();
  const result = await client.query(
    `SELECT COALESCE(MAX(id), 0) + 1 AS next FROM spare_sales`
  );
  const next = result.rows[0].next;
  return `RFT-${year}-${String(next).padStart(5, "0")}`;
};

export const getSpareSaleReceipt = async (saleId) => {
  const sale = await pool.query(
    `SELECT * FROM spare_sales WHERE id=$1`,
    [saleId]
  );

  if (sale.rows.length === 0) {
    throw new Error("Sale not found");
  }

  const items = await pool.query(
    `SELECT ssi.*, sp.name
     FROM spare_sale_items ssi
     JOIN spareparts sp ON sp.id = ssi.sparepart_id
     WHERE sale_id=$1`,
    [saleId]
  );

  return {
    ...sale.rows[0],
    items: items.rows
  };
};

export const getAllSpareSales = async () => {
  const res = await pool.query(`
    SELECT * FROM spare_sales
    ORDER BY sale_date DESC
  `);
  return res.rows;
};
