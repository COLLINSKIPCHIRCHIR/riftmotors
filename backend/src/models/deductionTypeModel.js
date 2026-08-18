import pool from "../config/db.js";

// ======================================
// Create Deduction Type
// ======================================

export const createDeductionType = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO deduction_types
    (
      code,
      name,
      calculation_method,
      reduces_taxable_income,
      is_statutory,
      is_active
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
    `,
    [
      data.code,
      data.name,
      data.calculation_method,
      data.reduces_taxable_income,
      data.is_statutory,
      data.is_active,
    ]
  );

  return result.rows[0];
};

// ======================================
// Get All
// ======================================

export const getDeductionTypes = async () => {
  const result = await pool.query(`
    SELECT *
    FROM deduction_types
    ORDER BY name ASC
  `);

  return result.rows;
};

// ======================================
// Get One
// ======================================

export const getDeductionTypeById = async (id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM deduction_types
    WHERE id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// ======================================
// Update
// ======================================

export const updateDeductionType = async (id, data) => {
  const result = await pool.query(
    `
    UPDATE deduction_types
    SET
      code=$1,
      name=$2,
      calculation_method=$3,
      reduces_taxable_income=$4,
      is_statutory=$5,
      is_active=$6
    WHERE id=$7
    RETURNING *;
    `,
    [
      data.code,
      data.name,
      data.calculation_method,
      data.reduces_taxable_income,
      data.is_statutory,
      data.is_active,
      id,
    ]
  );

  return result.rows[0];
};

// ======================================
// Delete
// ======================================

export const deleteDeductionType = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM deduction_types
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};