import pool from "../config/db.js";

// ==========================================
// Create
// ==========================================

export const createPayrollPeriod = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO payroll_periods
    (
        period_label,
        start_date,
        end_date,
        status,
        processed_by
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *;
    `,
    [
      data.period_label,
      data.start_date,
      data.end_date,
      data.status || "Open",
      data.processed_by || null,
    ]
  );

  return result.rows[0];
};

// ==========================================
// Get All
// ==========================================

export const getPayrollPeriods = async () => {
  const result = await pool.query(`
    SELECT
        pp.*,
        u.username AS processed_by_name
    FROM payroll_periods pp
    LEFT JOIN users u
        ON u.id = pp.processed_by
    ORDER BY pp.start_date DESC;
  `);

  return result.rows;
};

// ==========================================
// Get One
// ==========================================

export const getPayrollPeriodById = async (id) => {
  const result = await pool.query(
    `
    SELECT
        pp.*,
        u.username AS processed_by_name
    FROM payroll_periods pp
    LEFT JOIN users u
        ON u.id = pp.processed_by
    WHERE pp.id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// ==========================================
// Current Open Period
// ==========================================

export const getOpenPayrollPeriod = async () => {
  const result = await pool.query(`
    SELECT *
    FROM payroll_periods
    WHERE status='Open'
    ORDER BY start_date DESC
    LIMIT 1;
  `);

  return result.rows[0];
};

// ==========================================
// Update
// ==========================================

export const updatePayrollPeriod = async (
  id,
  data
) => {
  const result = await pool.query(
    `
    UPDATE payroll_periods
    SET
        period_label=$1,
        start_date=$2,
        end_date=$3,
        status=$4,
        processed_at=$5,
        processed_by=$6
    WHERE id=$7
    RETURNING *;
    `,
    [
      data.period_label,
      data.start_date,
      data.end_date,
      data.status,
      data.processed_at,
      data.processed_by,
      id,
    ]
  );

  return result.rows[0];
};

// ==========================================
// Mark Processed
// ==========================================

export const processPayrollPeriod = async (
  id,
  userId
) => {
  const result = await pool.query(
    `
    UPDATE payroll_periods
    SET
        status='Processed',
        processed_at=NOW(),
        processed_by=$1
    WHERE id=$2
    RETURNING *;
    `,
    [userId, id]
  );

  return result.rows[0];
};

// ==========================================
// Close Period
// ==========================================

export const closePayrollPeriod = async (
  id
) => {
  const result = await pool.query(
    `
    UPDATE payroll_periods
    SET status='Closed'
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};

// ==========================================
// Delete
// ==========================================

export const deletePayrollPeriod = async (
  id
) => {
  const result = await pool.query(
    `
    DELETE FROM payroll_periods
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};