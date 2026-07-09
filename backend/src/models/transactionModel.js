// src/models/transactionModel.js
import pool from "../config/db.js";

export const createTransaction = async (data) => {
  const query = `
    INSERT INTO transactions (
      transaction_ref, items, total_amount,
      total_discount, payment_method, customer_name,
      sold_by, status
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *;
  `;

  const values = [
    data.transaction_ref,
    data.items,
    data.total_amount,
    data.total_discount,
    data.payment_method,
    data.customer_name,
    data.sold_by,
    data.status,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get all
export const getAllTransactions = async () => {
  const result = await pool.query(
    `SELECT * FROM transactions ORDER BY id DESC`
  );
  return result.rows;
};

// Get by ID
export const getTransactionById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM transactions WHERE id=$1`,
    [id]
  );
  return result.rows[0];
};
