import pool from "../config/db.js";

// ===========================================
// Create
// ===========================================

export const createEmployeeRecurringDeduction = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO employee_recurring_deductions
    (
        employee_id,
        deduction_type_id,
        name,
        amount,
        start_date,
        end_date,
        is_active
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *;
    `,
    [
      data.employee_id,
      data.deduction_type_id,
      data.name,
      data.amount,
      data.start_date,
      data.end_date === "" ? null : data.end_date,
      data.is_active ?? true,
    ]
  );

  return result.rows[0];
};

// ===========================================
// Get All
// ===========================================

export const getEmployeeRecurringDeductions = async () => {
  const result = await pool.query(`
    SELECT
        erd.*,
        e.employee_number,
        e.first_name,
        e.last_name,
        dt.code,
        dt.name AS deduction_type_name
    FROM employee_recurring_deductions erd
    JOIN employees e
        ON e.id = erd.employee_id
    JOIN deduction_types dt
        ON dt.id = erd.deduction_type_id
    ORDER BY
        e.first_name,
        e.last_name,
        erd.name;
  `);

  return result.rows;
};

// ===========================================
// Get One
// ===========================================

export const getEmployeeRecurringDeductionById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM employee_recurring_deductions
    WHERE id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// ===========================================
// Get By Employee
// ===========================================

export const getRecurringDeductionsByEmployee = async (
  employeeId
) => {
  const result = await pool.query(
    `
    SELECT
        erd.*,
        dt.code,
        dt.name AS deduction_type_name
    FROM employee_recurring_deductions erd
    JOIN deduction_types dt
      ON dt.id = erd.deduction_type_id
    WHERE erd.employee_id=$1
    ORDER BY erd.created_at DESC;
    `,
    [employeeId]
  );

  return result.rows;
};

// ===========================================
// Active Deductions
// ===========================================

export const getActiveRecurringDeductions = async (
  employeeId,
  payrollDate
) => {
  const result = await pool.query(
    `
    SELECT *
    FROM employee_recurring_deductions
    WHERE employee_id=$1
      AND is_active=true
      AND start_date <= $2
      AND (
            end_date IS NULL
            OR end_date >= $2
      )
    `,
    [employeeId, payrollDate]
  );

  return result.rows;
};

// ===========================================
// Update
// ===========================================

export const updateEmployeeRecurringDeduction = async (
  id,
  data
) => {
  const result = await pool.query(
    `
    UPDATE employee_recurring_deductions
    SET
        employee_id=$1,
        deduction_type_id=$2,
        name=$3,
        amount=$4,
        start_date=$5,
        end_date=$6,
        is_active=$7
    WHERE id=$8
    RETURNING *;
    `,
    [
      data.employee_id,
      data.deduction_type_id,
      data.name,
      data.amount === "" ? null : data.amount,
      data.start_date,
      data.end_date === "" ? null : data.end_date,
      data.is_active,
      id,
    ]
  );

  return result.rows[0];
};

// ===========================================
// Delete
// ===========================================

export const deleteEmployeeRecurringDeduction = async (
  id
) => {
  const result = await pool.query(
    `
    DELETE FROM employee_recurring_deductions
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};