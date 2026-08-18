import pool from "../config/db.js";

// ===============================
// Create Employee Contact
// ===============================
export const createEmployeeContact = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO employee_contacts
    (
        employee_id,
        name,
        relationship,
        phone,
        email,
        address,
        is_primary
    )

    VALUES
    ($1,$2,$3,$4,$5,$6,$7)

    RETURNING *;
    `,
    [
      data.employee_id,
      data.name,
      data.relationship,
      data.phone,
      data.email,
      data.address,
      data.is_primary || false,
    ]
  );

  return result.rows[0];
};

// ===============================
// Get All Contacts
// ===============================
export const getAllEmployeeContacts = async () => {
  const result = await pool.query(`
      SELECT

          ec.*,

          e.employee_number,

          CONCAT(e.first_name,' ',e.last_name) AS employee_name

      FROM employee_contacts ec

      JOIN employees e
      ON ec.employee_id=e.id

      WHERE e.is_active=true

      ORDER BY ec.id DESC
  `);

  return result.rows;
};

// ===============================
// Get Contacts By Employee
// ===============================
export const getContactsByEmployee = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT *

    FROM employee_contacts

    WHERE employee_id=$1

    ORDER BY is_primary DESC,id ASC
    `,
    [employeeId]
  );

  return result.rows;
};

// ===============================
// Get Contact By ID
// ===============================
export const getEmployeeContactById = async (id) => {
  const result = await pool.query(
    `
    SELECT

        ec.*,

        e.employee_number,

        CONCAT(e.first_name,' ',e.last_name) AS employee_name

    FROM employee_contacts ec

    JOIN employees e
    ON ec.employee_id=e.id

    WHERE ec.id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// ===============================
// Update Contact
// ===============================
export const updateEmployeeContact = async (id, data) => {
  const result = await pool.query(
    `
    UPDATE employee_contacts

    SET

        employee_id=$1,
        name=$2,
        relationship=$3,
        phone=$4,
        email=$5,
        address=$6,
        is_primary=$7

    WHERE id=$8

    RETURNING *;
    `,
    [
      data.employee_id,
      data.name,
      data.relationship,
      data.phone,
      data.email,
      data.address,
      data.is_primary,
      id,
    ]
  );

  return result.rows[0];
};

// ===============================
// Delete Contact
// ===============================
export const deleteEmployeeContact = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM employee_contacts

    WHERE id=$1

    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};