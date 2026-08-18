import pool from "../config/db.js";

// ==========================================
// Create Attendance
// ==========================================
export const createAttendance = async (data) => {
  const query = `
    INSERT INTO employee_attendance
    (
      employee_id,
      attendance_date,
      clock_in,
      clock_out,
      worked_hours,
      overtime_hours,
      status,
      remarks
    )

    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8)

    RETURNING *;
  `;

  const values = [
    data.employee_id,
    data.attendance_date,
    data.clock_in || null,
    data.clock_out || null,
    data.worked_hours || 0,
    data.overtime_hours || 0,
    data.status,
    data.remarks,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

// ==========================================
// Get All Attendance
// ==========================================
export const getAllAttendance = async () => {
  const result = await pool.query(`
      SELECT
          ea.*,

          e.employee_number,
          e.first_name,
          e.last_name,

          d.name AS department_name,
          b.name AS branch_name

      FROM employee_attendance ea

      JOIN employees e
      ON ea.employee_id=e.id

      LEFT JOIN departments d
      ON e.department_id=d.id

      LEFT JOIN branches b
      ON e.branch_id=b.id

      ORDER BY
      attendance_date DESC,
      first_name ASC
  `);

  return result.rows;
};

// ==========================================
// Get Attendance By ID
// ==========================================
export const getAttendanceById = async (id) => {
  const result = await pool.query(
    `
    SELECT
        ea.*,

        e.employee_number,
        e.first_name,
        e.last_name,

        d.name AS department_name,
        b.name AS branch_name

    FROM employee_attendance ea

    JOIN employees e
    ON ea.employee_id=e.id

    LEFT JOIN departments d
    ON e.department_id=d.id

    LEFT JOIN branches b
    ON e.branch_id=b.id

    WHERE ea.id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// ==========================================
// Update Attendance
// ==========================================
export const updateAttendance = async (id, data) => {
  const query = `
      UPDATE employee_attendance

      SET

      employee_id=$1,
      attendance_date=$2,
      clock_in=$3,
      clock_out=$4,
      worked_hours=$5,
      overtime_hours=$6,
      status=$7,
      remarks=$8

      WHERE id=$9

      RETURNING *;
  `;

  const values = [
    data.employee_id,
    data.attendance_date,
    data.clock_in || null,
    data.clock_out || null,
    data.worked_hours || 0,
    data.overtime_hours || 0,
    data.status,
    data.remarks,
    id,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

// ==========================================
// Delete Attendance
// ==========================================
export const deleteAttendance = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM employee_attendance

    WHERE id=$1

    RETURNING *;
`,
    [id]
  );

  return result.rows[0];
};

// ==========================================
// Employee Attendance History
// ==========================================
export const getAttendanceByEmployee = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT *

    FROM employee_attendance

    WHERE employee_id=$1

    ORDER BY attendance_date DESC
`,
    [employeeId]
  );

  return result.rows;
};

// ==========================================
// Attendance By Date
// ==========================================
export const getAttendanceByDate = async (date) => {
  const result = await pool.query(
    `
    SELECT

        ea.*,

        e.employee_number,
        e.first_name,
        e.last_name

    FROM employee_attendance ea

    JOIN employees e
    ON ea.employee_id=e.id

    WHERE attendance_date=$1

    ORDER BY first_name
`,
    [date]
  );

  return result.rows;
};



// ==========================================
// Payroll Attendance Summary
// ==========================================

export const getAttendanceSummaryByEmployee = async (
  employeeId,
  startDate,
  endDate
) => {
  const result = await pool.query(
    `
    SELECT

        COUNT(*) AS attendance_days,

        COALESCE(
          SUM(worked_hours),
          0
        ) AS worked_hours,

        COALESCE(
          SUM(overtime_hours),
          0
        ) AS overtime_hours,

        COUNT(*) FILTER (
          WHERE status = 'Absent'
        ) AS absent_days,

        COUNT(*) FILTER (
          WHERE status = 'Present'
        ) AS present_days,

        COUNT(*) FILTER (
          WHERE status = 'Leave'
        ) AS leave_days,

        COUNT(*) FILTER (
          WHERE status = 'Half Day'
        ) AS half_days

    FROM employee_attendance

    WHERE employee_id = $1

      AND attendance_date >= $2

      AND attendance_date <= $3
    `,
    [
      employeeId,
      startDate,
      endDate,
    ]
  );

  return result.rows[0];
};