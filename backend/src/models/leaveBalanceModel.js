import pool from "../config/db.js";

// =====================================
// Create Leave Balance
// =====================================

export const createLeaveBalance = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO leave_balances
    (
      employee_id,
      leave_type_id,
      year,
      days_allocated,
      days_used,
      days_carried_forward
    )

    VALUES
    ($1,$2,$3,$4,$5,$6)

    RETURNING *;
    `,
    [
      data.employee_id,
      data.leave_type_id,
      data.year,
      data.days_allocated,
      data.days_used || 0,
      data.days_carried_forward || 0,
    ]
  );

  return result.rows[0];
};

// =====================================
// Get All
// =====================================

export const getAllLeaveBalances = async () => {
  const result = await pool.query(`
    SELECT

      lb.*,

      e.employee_number,

      e.first_name,

      e.last_name,

      lt.name AS leave_type,

      (
        COALESCE(lb.days_allocated,0)
        +
        COALESCE(lb.days_carried_forward,0)
        -
        COALESCE(lb.days_used,0)
      ) AS days_remaining

    FROM leave_balances lb

    JOIN employees e
    ON lb.employee_id=e.id

    JOIN leave_types lt
    ON lb.leave_type_id=lt.id

    ORDER BY
    e.first_name,
    lt.name
  `);

  return result.rows;
};

// =====================================
// Get By ID
// =====================================

export const getLeaveBalanceById = async (id) => {
  const result = await pool.query(
    `
    SELECT

      lb.*,

      e.employee_number,

      e.first_name,

      e.last_name,

      lt.name AS leave_type,

      (
        COALESCE(lb.days_allocated,0)
        +
        COALESCE(lb.days_carried_forward,0)
        -
        COALESCE(lb.days_used,0)
      ) AS days_remaining

    FROM leave_balances lb

    JOIN employees e
    ON lb.employee_id=e.id

    JOIN leave_types lt
    ON lb.leave_type_id=lt.id

    WHERE lb.id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// =====================================
// Get Employee Balances
// =====================================

export const getEmployeeLeaveBalances = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT

      lb.*,

      lt.name AS leave_type,

      (
        COALESCE(lb.days_allocated,0)
        +
        COALESCE(lb.days_carried_forward,0)
        -
        COALESCE(lb.days_used,0)
      ) AS days_remaining

    FROM leave_balances lb

    JOIN leave_types lt
    ON lb.leave_type_id=lt.id

    WHERE employee_id=$1

    ORDER BY lt.name
    `,
    [employeeId]
  );

  return result.rows;
};

// =====================================
// Update
// =====================================

export const updateLeaveBalance = async (id, data) => {
  const result = await pool.query(
    `
    UPDATE leave_balances

    SET

    employee_id=$1,
    leave_type_id=$2,
    year=$3,
    days_allocated=$4,
    days_used=$5,
    days_carried_forward=$6

    WHERE id=$7

    RETURNING *;
    `,
    [
      data.employee_id,
      data.leave_type_id,
      data.year,
      data.days_allocated,
      data.days_used,
      data.days_carried_forward,
      id,
    ]
  );

  return result.rows[0];
};

// =====================================
// Delete
// =====================================

export const deleteLeaveBalance = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM leave_balances

    WHERE id=$1

    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};

export const getEmployeeLeaveBalance = async (
  employeeId,
  leaveTypeId,
  year
) => {
  const result = await pool.query(
    `
    SELECT

        lb.employee_id,

        lb.leave_type_id,

        lb.year,

        lt.name AS leave_type_name,

        CONCAT(e.first_name,' ',e.last_name) AS employee_name,

        COALESCE(lb.days_allocated,0) AS allocated,

        COALESCE(lb.days_used,0) AS used,

        COALESCE(lb.days_carried_forward,0) AS carried_forward,

        (
            COALESCE(lb.days_allocated,0)
            +
            COALESCE(lb.days_carried_forward,0)
            -
            COALESCE(lb.days_used,0)
        ) AS remaining,

        COALESCE(
        (
            SELECT SUM(days_requested)

            FROM leave_requests lr

            WHERE
                lr.employee_id = lb.employee_id
                AND lr.leave_type_id = lb.leave_type_id
                AND lr.status = 'Pending'
                AND EXTRACT(YEAR FROM lr.start_date)=lb.year
        ),0) AS pending

    FROM leave_balances lb

    INNER JOIN employees e
        ON e.id=lb.employee_id

    INNER JOIN leave_types lt
        ON lt.id=lb.leave_type_id

    WHERE

        lb.employee_id=$1

        AND lb.leave_type_id=$2

        AND lb.year=$3
    `,
    [employeeId, leaveTypeId, year]
  );

  return result.rows[0];
};