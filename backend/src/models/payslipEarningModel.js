import pool from "../config/db.js";

// ==========================================
// Create
// ==========================================

export const createPayslipEarning = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO payslip_earnings
    (
        payslip_id,
        description,
        amount
    )
    VALUES ($1,$2,$3)
    RETURNING *;
    `,
    [
      data.payslip_id,
      data.description,
      data.amount,
    ]
  );

  return result.rows[0];
};

// ==========================================
// Get All
// ==========================================

export const getPayslipEarnings = async () => {
  const result = await pool.query(`
    SELECT
        pe.*,
        p.employee_id,
        emp.employee_number,
        emp.first_name,
        emp.last_name
    FROM payslip_earnings pe
    JOIN payslips p
        ON p.id = pe.payslip_id
    JOIN employees emp
        ON emp.id = p.employee_id
    ORDER BY pe.id DESC;
  `);

  return result.rows;
};

// ==========================================
// Get One
// ==========================================

export const getPayslipEarningById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM payslip_earnings
    WHERE id=$1;
    `,
    [id]
  );

  return result.rows[0];
};

// ==========================================
// Get By Payslip
// ==========================================

export const getPayslipEarningsByPayslip = async (
  payslipId
) => {
  const result = await pool.query(
    `
    SELECT *
    FROM payslip_earnings
    WHERE payslip_id=$1
    ORDER BY id;
    `,
    [payslipId]
  );

  return result.rows;
};

// ==========================================
// Update
// ==========================================

export const updatePayslipEarning = async (
  id,
  data
) => {
  const result = await pool.query(
    `
    UPDATE payslip_earnings
    SET
        description=$1,
        amount=$2
    WHERE id=$3
    RETURNING *;
    `,
    [
      data.description,
      data.amount,
      id,
    ]
  );

  return result.rows[0];
};

// ==========================================
// Delete
// ==========================================

export const deletePayslipEarning = async (
  id
) => {
  const result = await pool.query(
    `
    DELETE FROM payslip_earnings
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};