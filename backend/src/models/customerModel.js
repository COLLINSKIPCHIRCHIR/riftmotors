import pool from "../config/db.js";

/* =========================
   CREATE CUSTOMER
========================= */
export const createCustomer = async (data) => {
  const { name, phone, email, address, kra_pin } = data;

  const result = await pool.query(
    `INSERT INTO customers (name, phone, email, address, kra_pin)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, phone || null, email || null, address || null, kra_pin || null]
  );

  return result.rows[0];
};

/* =========================
   GET ALL CUSTOMERS
========================= */
export const getAllCustomers = async () => {
  const result = await pool.query(
    `SELECT * FROM customers
     WHERE is_active = true
     ORDER BY created_at DESC`
  );

  return result.rows;
};

/* =========================
   GET CUSTOMER BY ID
========================= */
export const getCustomerById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM customers WHERE id = $1 AND is_active = true`,
    [id]
  );

  return result.rows[0];
};

/* =========================
   UPDATE CUSTOMER
========================= */
export const updateCustomer = async (id, data) => {
  const { name, phone, email, address, kra_pin } = data;

  const result = await pool.query(
    `UPDATE customers
     SET name = $1,
         phone = $2,
         email = $3,
         address = $4,
         kra_pin = $5,
         updated_at = now()
     WHERE id = $6
     RETURNING *`,
    [name, phone, email, address, kra_pin || null, id]
  );

  return result.rows[0];
};

/* =========================
   SOFT DELETE CUSTOMER
========================= */
export const softDeleteCustomer = async (id) => {
  const result = await pool.query(
    `UPDATE customers
     SET is_active = false
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0];
};