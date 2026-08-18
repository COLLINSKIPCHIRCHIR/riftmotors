import pool from "../config/db.js";

// ➤ Create Branch
export const createBranch = async (data) => {
  const query = `
    INSERT INTO branches
    (
      name,
      branch_code,
      phone,
      email,
      address,
      manager_id,
      is_head_office
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *;
  `;

  const values = [
    data.name,
    data.branch_code,
    data.phone,
    data.email,
    data.address,
    data.manager_id || null,
    data.is_head_office || false,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

// ➤ Get All Branches
export const getAllBranches = async () => {
  const result = await pool.query(`
    SELECT
      b.*,
      u.username AS manager_name
    FROM branches b
    LEFT JOIN users u
      ON b.manager_id = u.id
    WHERE b.is_active = true
    ORDER BY b.name ASC;
  `);

  return result.rows;
};

// ➤ Get Branch By ID
export const getBranchById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      b.*,
      u.username AS manager_name
    FROM branches b
    LEFT JOIN users u
      ON b.manager_id = u.id
    WHERE b.id = $1;
    `,
    [id]
  );

  return result.rows[0];
};

// ➤ Update Branch
export const updateBranch = async (id, data) => {
  const query = `
    UPDATE branches
    SET
      name=$1,
      branch_code=$2,
      phone=$3,
      email=$4,
      address=$5,
      manager_id=$6,
      is_head_office=$7,
      updated_at=CURRENT_TIMESTAMP
    WHERE id=$8
    RETURNING *;
  `;

  const values = [
    data.name,
    data.branch_code,
    data.phone,
    data.email,
    data.address,
    data.manager_id || null,
    data.is_head_office,
    id,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

// ➤ Soft Delete Branch
export const deleteBranch = async (id) => {
  const result = await pool.query(
    `
    UPDATE branches
    SET
      is_active=false,
      updated_at=CURRENT_TIMESTAMP
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};