import pool from "../config/db.js";

// ===============================
// Create Document
// ===============================
export const createEmployeeDocument = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO employee_documents
    (
        employee_id,
        document_type,
        file_name,
        file_path,
        uploaded_by
    )

    VALUES
    ($1,$2,$3,$4,$5)

    RETURNING *;
    `,
    [
      data.employee_id,
      data.document_type,
      data.file_name,
      data.file_path,
      data.uploaded_by || null,
    ]
  );

  return result.rows[0];
};

// ===============================
// Get All Documents
// ===============================
export const getAllEmployeeDocuments = async () => {
  const result = await pool.query(`
    SELECT

        ed.*,

        CONCAT(e.first_name,' ',e.last_name) AS employee_name,

        e.employee_number,

        u.username AS uploaded_by_name

    FROM employee_documents ed

    JOIN employees e
    ON ed.employee_id=e.id

    LEFT JOIN users u
    ON ed.uploaded_by=u.id

    ORDER BY ed.uploaded_at DESC
  `);

  return result.rows;
};

// ===============================
// Documents By Employee
// ===============================
export const getEmployeeDocuments = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT

        ed.*,

        u.username AS uploaded_by_name

    FROM employee_documents ed

    LEFT JOIN users u
    ON ed.uploaded_by=u.id

    WHERE employee_id=$1

    ORDER BY uploaded_at DESC
    `,
    [employeeId]
  );

  return result.rows;
};

// ===============================
// Get One
// ===============================
export const getEmployeeDocumentById = async (id) => {
  const result = await pool.query(
    `
    SELECT *

    FROM employee_documents

    WHERE id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// ===============================
// Update
// ===============================
export const updateEmployeeDocument = async (id, data) => {
  const result = await pool.query(
    `
    UPDATE employee_documents

    SET

        document_type=$1,
        file_name=$2,
        file_path=$3

    WHERE id=$4

    RETURNING *;
    `,
    [
      data.document_type,
      data.file_name,
      data.file_path,
      id,
    ]
  );

  return result.rows[0];
};

// ===============================
// Delete
// ===============================
export const deleteEmployeeDocument = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM employee_documents

    WHERE id=$1

    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};