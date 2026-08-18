import pool from "../config/db.js";

// ➤ Create Department
export const createDepartment = async (data) => {
  const query = `
    INSERT INTO departments (name, description)
    VALUES ($1, $2)
    RETURNING *;
  `;

  const values = [
    data.name,
    data.description,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// ➤ Get All Departments
export const getAllDepartments = async () => {
  const result = await pool.query(`
    SELECT *
    FROM departments
    WHERE is_active = true
    ORDER BY name ASC;
  `);

  return result.rows;
};

// ➤ Get Department By ID
export const getDepartmentById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM departments WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

// ➤ Update Department
export const updateDepartment = async (id, data) => {
  const query = `
    UPDATE departments
    SET
      name = $1,
      description = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *;
  `;

  const values = [
    data.name,
    data.description,
    id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// ➤ Soft Delete Department
export const deleteDepartment = async (id) => {
  const result = await pool.query(
    `
    UPDATE departments
    SET
      is_active = false,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};