import pool from "../config/db.js";

// ===============================
// Create Leave Type
// ===============================
export const createLeaveType = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO leave_types
    (
        name,
        default_days_per_year,
        is_paid
    )

    VALUES
    ($1,$2,$3)

    RETURNING *;
    `,
    [
      data.name,
      data.default_days_per_year,
      data.is_paid,
    ]
  );

  return result.rows[0];
};

// ===============================
// Get All Leave Types
// ===============================
export const getAllLeaveTypes = async () => {
  const result = await pool.query(`
    SELECT *

    FROM leave_types

    ORDER BY name ASC
  `);

  return result.rows;
};

// ===============================
// Get Leave Type By ID
// ===============================
export const getLeaveTypeById = async (id) => {
  const result = await pool.query(
    `
    SELECT *

    FROM leave_types

    WHERE id=$1;
    `,
    [id]
  );

  return result.rows[0];
};

// ===============================
// Update Leave Type
// ===============================
export const updateLeaveType = async (id, data) => {
  const result = await pool.query(
    `
    UPDATE leave_types

    SET

        name=$1,
        default_days_per_year=$2,
        is_paid=$3

    WHERE id=$4

    RETURNING *;
    `,
    [
      data.name,
      data.default_days_per_year,
      data.is_paid,
      id,
    ]
  );

  return result.rows[0];
};

// ===============================
// Delete Leave Type
// ===============================
export const deleteLeaveType = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM leave_types

    WHERE id=$1

    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};