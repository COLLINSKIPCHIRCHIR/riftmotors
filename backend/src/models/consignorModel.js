// src/models/consignorModel.js
import pool from "../config/db.js";

export const createConsignor = async (data) => {
  const { name, contact_person, phone, email } = data;
  const result = await pool.query(
    `INSERT INTO consignors (name, contact_person, phone, email)
     VALUES ($1,$2,$3,$4) RETURNING *;`,
    [name, contact_person || null, phone || null, email || null]
  );
  return result.rows[0];
};

export const getAllConsignors = async () => {
  const result = await pool.query(
    `SELECT * FROM consignors WHERE is_active = true ORDER BY name ASC`
  );
  return result.rows;
};

export const updateConsignor = async (id, data) => {
  const { name, contact_person, phone, email } = data;
  const result = await pool.query(
    `UPDATE consignors SET name=$1, contact_person=$2, phone=$3, email=$4
     WHERE id=$5 RETURNING *;`,
    [name, contact_person, phone, email, id]
  );
  return result.rows[0];
};

export const softDeleteConsignor = async (id) => {
  const result = await pool.query(
    `UPDATE consignors SET is_active = false WHERE id = $1 RETURNING *;`,
    [id]
  );
  return result.rows[0];
};