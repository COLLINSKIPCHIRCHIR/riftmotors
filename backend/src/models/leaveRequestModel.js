import pool from "../config/db.js";

/* ==========================================
   CREATE
========================================== */

export const createLeaveRequest = async (data) => {

  const start = new Date(data.start_date);
  const end = new Date(data.end_date);

  const daysRequested =
    Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const result = await pool.query(
    `
    INSERT INTO leave_requests
    (
        employee_id,
        leave_type_id,
        start_date,
        end_date,
        days_requested,
        reason
    )

    VALUES
    ($1,$2,$3,$4,$5,$6)

    RETURNING *;
    `,
    [
      data.employee_id,
      data.leave_type_id,
      data.start_date,
      data.end_date,
      daysRequested,      // <-- use calculated value
      data.reason,
    ]
  );

  return result.rows[0];
};

/* ==========================================
   GET ALL
========================================== */

export const getAllLeaveRequests = async () => {
  const result = await pool.query(`
      SELECT

      lr.*,

      e.employee_number,
      e.first_name,
      e.last_name,

      lt.name AS leave_type,

      u.username AS approved_by_name

      FROM leave_requests lr

      JOIN employees e
      ON lr.employee_id=e.id

      JOIN leave_types lt
      ON lr.leave_type_id=lt.id

      LEFT JOIN users u
      ON lr.approved_by=u.id

      ORDER BY lr.created_at DESC
  `);

  return result.rows;
};

/* ==========================================
   GET BY ID
========================================== */

export const getLeaveRequestById = async (id) => {
  const result = await pool.query(
    `
    SELECT

    lr.*,

    e.employee_number,
    e.first_name,
    e.last_name,

    lt.name AS leave_type,

    u.username AS approved_by_name

    FROM leave_requests lr

    JOIN employees e
    ON lr.employee_id=e.id

    JOIN leave_types lt
    ON lr.leave_type_id=lt.id

    LEFT JOIN users u
    ON lr.approved_by=u.id

    WHERE lr.id=$1
    `,
    [id]
  );

  return result.rows[0];
};

/* ==========================================
   EMPLOYEE REQUESTS
========================================== */

export const getEmployeeLeaveRequests = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT

    lr.*,

    lt.name AS leave_type

    FROM leave_requests lr

    JOIN leave_types lt
    ON lr.leave_type_id=lt.id

    WHERE employee_id=$1

    ORDER BY created_at DESC
    `,
    [employeeId]
  );

  return result.rows;
};

/* ==========================================
   UPDATE
========================================== */

export const updateLeaveRequest = async (id, data) => {
  const current = await getLeaveRequestById(id);

  if (!current)
    throw new Error("Leave request not found.");

  if (current.status !== "Pending")
    throw new Error("Only pending requests can be edited.");

  const start = new Date(data.start_date);
    const end = new Date(data.end_date);

    const daysRequested =
    Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const result = await pool.query(
        `
    UPDATE leave_requests

    SET

    employee_id=$1,
    leave_type_id=$2,
    start_date=$3,
    end_date=$4,
    days_requested=$5,
    reason=$6

    WHERE id=$7

    RETURNING *;
    `,
    [
      data.employee_id,
      data.leave_type_id,
      data.start_date,
      data.end_date,
      daysRequested,
      data.reason,
      id,
    ]
  );

  return result.rows[0];
};

/* ==========================================
   DELETE
========================================== */

export const deleteLeaveRequest = async (id) => {
  const current = await getLeaveRequestById(id);

  if (!current)
    throw new Error("Leave request not found.");

  if (current.status !== "Pending")
    throw new Error("Only pending requests can be deleted.");

  await pool.query(
    `
    DELETE FROM leave_requests

    WHERE id=$1
    `,
    [id]
  );

  return true;
};

/* ==========================================
   APPROVE
========================================== */

export const approveLeaveRequest = async (
  requestId,
  approvedBy
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock request

    const requestResult = await client.query(
      `
      SELECT *

      FROM leave_requests

      WHERE id=$1

      FOR UPDATE
      `,
      [requestId]
    );

    if (requestResult.rows.length === 0)
      throw new Error("Leave request not found.");

    const request = requestResult.rows[0];

    if (request.status !== "Pending")
      throw new Error("Request already processed.");

    // Find leave balance

    const balanceResult = await client.query(
      `
      SELECT *

      FROM leave_balances

      WHERE

      employee_id=$1

      AND leave_type_id=$2

      AND year=$3

      FOR UPDATE
      `,
      [
        request.employee_id,
        request.leave_type_id,
        new Date(request.start_date).getFullYear(),
      ]
    );

    if (balanceResult.rows.length === 0)
      throw new Error(
        "Employee has no leave balance for this leave type."
      );

    const balance = balanceResult.rows[0];

    const remaining =
      Number(balance.days_allocated) +
      Number(balance.days_carried_forward) -
      Number(balance.days_used);

    if (remaining < Number(request.days_requested))
      throw new Error(
        `Employee only has ${remaining} leave days remaining.`
      );

    // Update balance

    await client.query(
      `
      UPDATE leave_balances

      SET

      days_used = days_used + $1

      WHERE id=$2
      `,
      [
        request.days_requested,
        balance.id,
      ]
    );

    // Approve request

    const approved = await client.query(
      `
      UPDATE leave_requests

      SET

      status='Approved',

      approved_by=$1,

      approved_at=CURRENT_TIMESTAMP

      WHERE id=$2

      RETURNING *
      `,
      [
        approvedBy,
        requestId,
      ]
    );

    await client.query("COMMIT");

    return approved.rows[0];

  } catch (err) {

    await client.query("ROLLBACK");

    throw err;

  } finally {

    client.release();

  }
};

/* ==========================================
   REJECT
========================================== */

export const rejectLeaveRequest = async (
  requestId,
  approvedBy
) => {
  const result = await pool.query(
    `
    UPDATE leave_requests

    SET

    status='Rejected',

    approved_by=$1,

    approved_at=CURRENT_TIMESTAMP

    WHERE

    id=$2

    AND status='Pending'

    RETURNING *
    `,
    [
      approvedBy,
      requestId,
    ]
  );

  if (result.rows.length === 0)
    throw new Error(
      "Only pending requests can be rejected."
    );

  return result.rows[0];
};