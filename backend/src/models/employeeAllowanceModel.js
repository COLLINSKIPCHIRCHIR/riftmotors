import pool from "../config/db.js";

// ======================================
// Create Allowance
// ======================================

export const createEmployeeAllowance = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO employee_allowances
    (
        employee_id,
        name,
        amount,
        is_taxable,
        is_active,
        effective_from,
        effective_to
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *;
    `,
    [
      data.employee_id,
      data.name,
      data.amount,
      data.is_taxable,
      data.is_active,
      data.effective_from,
      data.effective_to || null,
    ]
  );

  return result.rows[0];
};

// ======================================
// Get All Allowances
// ======================================

export const getEmployeeAllowances = async () => {
  const result = await pool.query(`
    SELECT
      a.*,
      e.employee_number,
      e.first_name,
      e.last_name
    FROM employee_allowances a
    JOIN employees e
      ON a.employee_id = e.id
    ORDER BY a.created_at DESC
  `);

  return result.rows;
};

// ======================================
// Get Employee Allowances
// ======================================

export const getAllowancesByEmployee = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM employee_allowances
    WHERE employee_id = $1
    ORDER BY created_at DESC
    `,
    [employeeId]
  );

  return result.rows;
};

// ======================================
// Get Single Allowance
// ======================================

export const getEmployeeAllowanceById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM employee_allowances
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
};

// ======================================
// Update Allowance
// ======================================

export const updateEmployeeAllowance = async (id, data) => {
  const result = await pool.query(
    `
    UPDATE employee_allowances
    SET
        employee_id=$1,
        name=$2,
        amount=$3,
        is_taxable=$4,
        is_active=$5,
        effective_from=$6,
        effective_to=$7
    WHERE id=$8
    RETURNING *;
    `,
    [
      data.employee_id,
      data.name,
      data.amount,
      data.is_taxable,
      data.is_active,
      data.effective_from,
      data.effective_to || null,
      id,
    ]
  );

  return result.rows[0];
};

// ======================================
// Delete Allowance
// ======================================

export const deleteEmployeeAllowance = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM employee_allowances
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};

// ======================================
// Get Active Employee Allowances
// ======================================

export const getActiveAllowancesByEmployee = async (
  employeeId,
  payrollDate
) => {
  const result = await pool.query(
    `
    SELECT *

    FROM employee_allowances

    WHERE
        employee_id = $1
        AND is_active = true
        AND effective_from <= $2
        AND (
            effective_to IS NULL
            OR effective_to >= $2
        )

    ORDER BY name ASC;
    `,
    [employeeId, payrollDate]
  );

  return result.rows;
};