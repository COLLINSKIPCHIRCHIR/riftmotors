import pool from "../config/db.js";

// ======================================
// Create Salary Record
// ======================================

export const createEmployeeSalary = async (data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Close previous active salary
    await client.query(
      `
      UPDATE employee_salary_history
      SET effective_to = ($1::date - INTERVAL '1 day')
      WHERE employee_id = $2
      AND effective_to IS NULL
      `,
      [
        data.effective_from,
        data.employee_id,
      ]
    );

    // Insert new salary
    const result = await client.query(
      `
      INSERT INTO employee_salary_history
      (
        employee_id,
        basic_salary,
        effective_from,
        effective_to,
        reason,
        changed_by
      )

      VALUES
      ($1,$2,$3,$4,$5,$6)

      RETURNING *;
      `,
      [
        data.employee_id,
        data.basic_salary,
        data.effective_from,
        data.effective_to || null,
        data.reason,
        data.changed_by || null,
      ]
    );

    await client.query("COMMIT");

    return result.rows[0];

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {

    client.release();

  }
};

// ======================================
// Get All Salary Records
// ======================================

export const getEmployeeSalaries = async () => {
  const result = await pool.query(`
      SELECT

          s.*,

          e.employee_number,

          e.first_name,

          e.last_name,

          u.username AS changed_by_name

      FROM employee_salary_history s

      JOIN employees e
      ON s.employee_id=e.id

      LEFT JOIN users u
      ON s.changed_by=u.id

      ORDER BY
      s.created_at DESC
  `);

  return result.rows;
};

// ======================================
// Get One Employee Salary History
// ======================================

export const getSalaryHistoryByEmployee = async (
  employeeId
) => {
  const result = await pool.query(
    `
    SELECT

        s.*,

        u.username AS changed_by_name

    FROM employee_salary_history s

    LEFT JOIN users u
    ON s.changed_by=u.id

    WHERE s.employee_id=$1

    ORDER BY
    s.effective_from DESC
    `,
    [employeeId]
  );

  return result.rows;
};

// ======================================
// Get Single Salary Record
// ======================================

export const getEmployeeSalaryById = async (id) => {
  const result = await pool.query(
    `
    SELECT *

    FROM employee_salary_history

    WHERE id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// ======================================
// Update Salary
// ======================================

export const updateEmployeeSalary = async (
  id,
  data
) => {
  const result = await pool.query(
    `
    UPDATE employee_salary_history

    SET

    employee_id=$1,
    basic_salary=$2,
    effective_from=$3,
    effective_to=$4,
    reason=$5

    WHERE id=$6

    RETURNING *;
    `,
    [
      data.employee_id,
      data.basic_salary,
      data.effective_from,
      data.effective_to || null,
      data.reason,
      id,
    ]
  );

  return result.rows[0];
};

// ======================================
// Delete Salary
// ======================================

export const deleteEmployeeSalary = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM employee_salary_history

    WHERE id=$1

    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};



// ======================================
// Get Current Salary By Payroll Date
// ======================================

export const getCurrentSalary = async (
  employeeId,
  payrollDate
) => {
  const result = await pool.query(
    `
    SELECT *

    FROM employee_salary_history

    WHERE
        employee_id = $1
        AND effective_from <= $2
        AND (
            effective_to IS NULL
            OR effective_to >= $2
        )

    ORDER BY effective_from DESC

    LIMIT 1;
    `,
    [employeeId, payrollDate]
  );

  return result.rows[0];
};