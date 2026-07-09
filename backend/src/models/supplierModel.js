import pool from "../config/db.js";

// ➤ Create Supplier
export const createSupplier = async (data) => {
  const query = `
    INSERT INTO suppliers (name, phone, email, address)
    VALUES ($1,$2,$3,$4)
    RETURNING *;
  `;

  const values = [
    data.name,
    data.phone,
    data.email,
    data.address,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// ➤ Get All Suppliers
export const getAllSuppliers = async () => {
  const result = await pool.query(`
    SELECT * FROM suppliers
    WHERE is_active = true
    ORDER BY id DESC
  `);

  return result.rows;
};

// ➤ Get Supplier By ID
export const getSupplierById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM suppliers WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

// ➤ Update Supplier
export const updateSupplier = async (id, data) => {
  const query = `
    UPDATE suppliers
    SET name=$1,
        phone=$2,
        email=$3,
        address=$4
    WHERE id=$5
    RETURNING *;
  `;

  const values = [
    data.name,
    data.phone,
    data.email,
    data.address,
    id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// ➤ Soft Delete Supplier
export const deleteSupplier = async (id) => {
  const result = await pool.query(
    `UPDATE suppliers SET is_active = false WHERE id=$1 RETURNING *`,
    [id]
  );

  return result.rows[0];
};
