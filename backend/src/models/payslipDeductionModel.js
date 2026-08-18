import pool from "../config/db.js";

// ==========================================
// Create
// ==========================================

export const createPayslipDeduction = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO payslip_deductions
    (
        payslip_id,
        deduction_type_id,
        description,
        amount
    )
    VALUES ($1,$2,$3,$4)
    RETURNING *;
    `,
    [
      data.payslip_id,
      data.deduction_type_id,
      data.description,
      data.amount,
    ]
  );

  return result.rows[0];
};

// ==========================================
// Get All
// ==========================================

export const getPayslipDeductions = async () => {
  const result = await pool.query(`
    SELECT
        pd.*,
        dt.name AS deduction_type,
        p.employee_id,
        e.employee_number,
        e.first_name,
        e.last_name
    FROM payslip_deductions pd
    LEFT JOIN deduction_types dt
        ON dt.id = pd.deduction_type_id
    LEFT JOIN payslips p
        ON p.id = pd.payslip_id
    LEFT JOIN employees e
        ON e.id = p.employee_id
    ORDER BY pd.id DESC;
  `);

  return result.rows;
};

// ==========================================
// Get One
// ==========================================

export const getPayslipDeductionById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM payslip_deductions
    WHERE id=$1;
    `,
    [id]
  );

  return result.rows[0];
};

// ==========================================
// Get By Payslip
// ==========================================

export const getPayslipDeductionsByPayslip = async (
  payslipId
) => {
  const result = await pool.query(
    `
    SELECT
        pd.*,
        dt.name AS deduction_type
    FROM payslip_deductions pd
    LEFT JOIN deduction_types dt
        ON dt.id=pd.deduction_type_id
    WHERE pd.payslip_id=$1
    ORDER BY pd.id;
    `,
    [payslipId]
  );

  return result.rows;
};

// ==========================================
// Update
// ==========================================

export const updatePayslipDeduction = async (
  id,
  data
) => {
  const result = await pool.query(
    `
    UPDATE payslip_deductions
    SET
        deduction_type_id=$1,
        description=$2,
        amount=$3
    WHERE id=$4
    RETURNING *;
    `,
    [
      data.deduction_type_id,
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

export const deletePayslipDeduction = async (
  id
) => {
  const result = await pool.query(
    `
    DELETE FROM payslip_deductions
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};