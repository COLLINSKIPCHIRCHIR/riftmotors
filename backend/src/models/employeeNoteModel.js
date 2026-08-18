import pool from "../config/db.js";

// ===============================
// Create Note
// ===============================
export const createEmployeeNote = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO employee_notes
    (
        employee_id,
        note,
        created_by
    )

    VALUES
    ($1,$2,$3)

    RETURNING *;
    `,
    [
      data.employee_id,
      data.note,
      data.created_by || null,
    ]
  );

  return result.rows[0];
};

// ===============================
// Get All Notes
// ===============================
export const getAllEmployeeNotes = async () => {
  const result = await pool.query(`
    SELECT

        en.*,

        CONCAT(e.first_name,' ',e.last_name) AS employee_name,

        e.employee_number,

        u.username AS created_by_name

    FROM employee_notes en

    JOIN employees e
        ON en.employee_id = e.id

    LEFT JOIN users u
        ON en.created_by = u.id

    ORDER BY en.created_at DESC
  `);

  return result.rows;
};

// ===============================
// Get Notes By Employee
// ===============================
export const getEmployeeNotes = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT

        en.*,

        u.username AS created_by_name

    FROM employee_notes en

    LEFT JOIN users u
        ON en.created_by = u.id

    WHERE en.employee_id = $1

    ORDER BY en.created_at DESC;
    `,
    [employeeId]
  );

  return result.rows;
};

// ===============================
// Get Note By ID
// ===============================
export const getEmployeeNoteById = async (id) => {
  const result = await pool.query(
    `
    SELECT

        en.*,

        u.username AS created_by_name

    FROM employee_notes en

    LEFT JOIN users u
        ON en.created_by = u.id

    WHERE en.id = $1;
    `,
    [id]
  );

  return result.rows[0];
};

// ===============================
// Update Note
// ===============================
export const updateEmployeeNote = async (id, data) => {
  const result = await pool.query(
    `
    UPDATE employee_notes

    SET

        note = $1

    WHERE id = $2

    RETURNING *;
    `,
    [
      data.note,
      id,
    ]
  );

  return result.rows[0];
};

// ===============================
// Delete Note
// ===============================
export const deleteEmployeeNote = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM employee_notes

    WHERE id = $1

    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};