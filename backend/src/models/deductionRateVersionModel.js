import pool from "../config/db.js";

// =============================================
// Create
// =============================================

export const createDeductionRateVersion = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO deduction_rate_versions
    (
        deduction_type_id,
        tier_label,
        effective_from,
        effective_to,
        rate_percentage,
        fixed_amount,
        minimum_amount,
        maximum_amount,
        lower_limit,
        upper_limit,
        notes,
        created_by
    )
    VALUES
    (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
    )
    RETURNING *;
    `,
    [
      data.deduction_type_id,
      data.tier_label || null,
      data.effective_from,
      data.effective_to || null,
      data.rate_percentage || null,
      data.fixed_amount || null,
      data.minimum_amount || null,
      data.maximum_amount || null,
      data.lower_limit || null,
      data.upper_limit || null,
      data.notes || null,
      data.created_by,
    ]
  );

  return result.rows[0];
};

// =============================================
// Get All
// =============================================

export const getDeductionRateVersions = async () => {
  const result = await pool.query(`
        SELECT
            drv.*,
            dt.code,
            dt.name AS deduction_name,
            dt.calculation_method
        FROM deduction_rate_versions drv
        JOIN deduction_types dt
            ON drv.deduction_type_id = dt.id
        ORDER BY
            dt.name,
            drv.effective_from DESC,
            drv.lower_limit ASC
    `);

  return result.rows;
};

// =============================================
// Get One
// =============================================

export const getDeductionRateVersionById = async (id) => {
  const result = await pool.query(
    `
        SELECT
            drv.*,
            dt.code,
            dt.name AS deduction_name,
            dt.calculation_method
        FROM deduction_rate_versions drv
        JOIN deduction_types dt
            ON drv.deduction_type_id = dt.id
        WHERE drv.id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// =============================================
// Update
// =============================================

export const updateDeductionRateVersion = async (id, data) => {
  const result = await pool.query(
    `
    UPDATE deduction_rate_versions
    SET
        deduction_type_id=$1,
        tier_label=$2,
        effective_from=$3,
        effective_to=$4,
        rate_percentage=$5,
        fixed_amount=$6,
        minimum_amount=$7,
        maximum_amount=$8,
        lower_limit=$9,
        upper_limit=$10,
        notes=$11
    WHERE id=$12
    RETURNING *;
    `,
    [
      data.deduction_type_id,
      data.tier_label === "" ? null : data.tier_label,
      data.effective_from,
      data.effective_to === "" ? null : data.effective_to,
      data.rate_percentage === "" ? null : data.rate_percentage,
      data.fixed_amount === "" ? null : data.fixed_amount,
      data.minimum_amount === "" ? null : data.minimum_amount,
      data.maximum_amount === "" ? null : data.maximum_amount,
      data.lower_limit === "" ? null : data.lower_limit,
      data.upper_limit === "" ? null : data.upper_limit,
      data.notes === "" ? null : data.notes,
      id,
    ]
  );

  return result.rows[0];
};

// =============================================
// Delete
// =============================================

export const deleteDeductionRateVersion = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM deduction_rate_versions
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};

// =============================================
// Get By Deduction Type
// =============================================

export const getRateVersionsByDeductionType = async (
  deductionTypeId
) => {
  const result = await pool.query(
    `
    SELECT *
    FROM deduction_rate_versions
    WHERE deduction_type_id=$1
    ORDER BY effective_from DESC,
             lower_limit ASC
    `,
    [deductionTypeId]
  );

  return result.rows;
};