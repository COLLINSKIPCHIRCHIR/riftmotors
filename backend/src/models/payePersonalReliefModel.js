import pool from "../config/db.js";

// ===========================================
// Create
// ===========================================

export const createPayePersonalRelief = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO paye_personal_relief
    (
        effective_from,
        effective_to,
        monthly_relief_amount
    )
    VALUES ($1,$2,$3)
    RETURNING *;
    `,
    [
      data.effective_from,
      data.effective_to === "" ? null : data.effective_to,
      data.monthly_relief_amount === "" ? null : data.monthly_relief_amount,
    ]
  );

  return result.rows[0];
};

// ===========================================
// Get All
// ===========================================

export const getPayePersonalReliefs = async () => {
  const result = await pool.query(`
      SELECT *
      FROM paye_personal_relief
      ORDER BY effective_from DESC
  `);

  return result.rows;
};

// ===========================================
// Get One
// ===========================================

export const getPayePersonalReliefById = async (id) => {
  const result = await pool.query(
    `
      SELECT *
      FROM paye_personal_relief
      WHERE id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// ===========================================
// Update
// ===========================================

export const updatePayePersonalRelief = async (
  id,
  data
) => {
  const result = await pool.query(
    `
    UPDATE paye_personal_relief
    SET
        effective_from=$1,
        effective_to=$2,
        monthly_relief_amount=$3
    WHERE id=$4
    RETURNING *;
    `,
    [
      data.effective_from,
      data.effective_to === "" ? null : data.effective_to,
      data.monthly_relief_amount === "" ? null : data.monthly_relief_amount,
      id,
    ]
  );

  return result.rows[0];
};

// ===========================================
// Delete
// ===========================================

export const deletePayePersonalRelief = async (
  id
) => {
  const result = await pool.query(
    `
    DELETE FROM paye_personal_relief
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};

// ===========================================
// Current Relief
// ===========================================

export const getCurrentPayePersonalRelief =
  async () => {
    const result = await pool.query(`
      SELECT *
      FROM paye_personal_relief
      WHERE
        effective_from <= CURRENT_DATE
        AND (
          effective_to IS NULL
          OR effective_to >= CURRENT_DATE
        )
      ORDER BY effective_from DESC
      LIMIT 1
    `);

    return result.rows[0];
  };

// ===========================================
// Relief By Date
// ===========================================

export const getPayePersonalReliefByDate =
  async (date) => {
    const result = await pool.query(
      `
      SELECT *
      FROM paye_personal_relief
      WHERE
        effective_from <= $1
        AND (
          effective_to IS NULL
          OR effective_to >= $1
        )
      ORDER BY effective_from DESC
      LIMIT 1
      `,
      [date]
    );

    return result.rows[0];
  };