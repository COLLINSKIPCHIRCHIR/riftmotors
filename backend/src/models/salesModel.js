// src/models/salesModel.js
import pool from "../config/db.js";

// ✅ Create Sales Table
export const createSalesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      customer_name VARCHAR(150) NOT NULL,
      customer_phone VARCHAR(50),
      sale_price NUMERIC(12,2) NOT NULL,
      payment_method VARCHAR(50),
      sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
  console.log("✅ Sales table ready");
};

// ✅ Record a new sale
export const recordSale = async (saleData) => {
  const { vehicle_id, customer_name, customer_phone, sale_price, payment_method } = saleData;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Insert sale record
    const saleQuery = `
      INSERT INTO sales (vehicle_id, customer_name, customer_phone, sale_price, payment_method)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const saleValues = [vehicle_id, customer_name, customer_phone, sale_price, payment_method];
    const saleResult = await client.query(saleQuery, saleValues);

    // 2️⃣ Update vehicle status to 'sold'
    const vehicleQuery = `UPDATE vehicles SET status = 'sold' WHERE id = $1`;
    await client.query(vehicleQuery, [vehicle_id]);

    await client.query("COMMIT");
    return saleResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error recording sale:", error);
    throw error;
  } finally {
    client.release();
  }
};

// ✅ Get all sales
export const getAllSales = async () => {
  const query = `
    SELECT s.*, v.make, v.model, v.year
    FROM sales s
    JOIN vehicles v ON s.vehicle_id = v.id
    ORDER BY s.sale_date DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// ✅ Get sale by ID
export const getSaleById = async (id) => {
  const query = `
    SELECT s.*, v.make, v.model, v.year
    FROM sales s
    JOIN vehicles v ON s.vehicle_id = v.id
    WHERE s.id = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};
