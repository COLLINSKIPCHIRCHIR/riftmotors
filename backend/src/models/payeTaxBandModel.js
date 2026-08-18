import pool from "../config/db.js";

// =============================================
// Create
// =============================================

export const createPayeTaxBand = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO paye_tax_bands
    (
        effective_from,
        effective_to,
        band_order,
        lower_limit,
        upper_limit,
        rate_percentage
    )
    VALUES
    ($1,$2,$3,$4,$5,$6)
    RETURNING *;
    `,
    [
      data.effective_from,
      data.effective_to === "" ? null : data.effective_to,
      data.band_order === "" ? null : data.band_order,
      data.lower_limit === "" ? null : data.lower_limit,
      data.upper_limit === "" ? null : data.upper_limit,
      data.rate_percentage === "" ? null : data.rate_percentage,
    ]
  );

  return result.rows[0];
};

// =============================================
// Get All
// =============================================

export const getPayeTaxBands = async () => {
  const result = await pool.query(`
        SELECT *
        FROM paye_tax_bands
        ORDER BY
            effective_from DESC,
            band_order ASC
    `);

  return result.rows;
};

// =============================================
// Get One
// =============================================

export const getPayeTaxBandById = async (id) => {
  const result = await pool.query(
    `
        SELECT *
        FROM paye_tax_bands
        WHERE id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// =============================================
// Update
// =============================================

export const updatePayeTaxBand = async (id, data) => {
  const result = await pool.query(
    `
    UPDATE paye_tax_bands
    SET
        effective_from=$1,
        effective_to=$2,
        band_order=$3,
        lower_limit=$4,
        upper_limit=$5,
        rate_percentage=$6
    WHERE id=$7
    RETURNING *;
    `,
    [
      data.effective_from,
      data.effective_to === "" ? null : data.effective_to,
      data.band_order === "" ? null : data.band_order,
      data.lower_limit === "" ? null : data.lower_limit,
      data.upper_limit === "" ? null : data.upper_limit,
      data.rate_percentage === "" ? null : data.rate_percentage,
      id,
    ]
  );

  return result.rows[0];
};

// =============================================
// Delete
// =============================================

export const deletePayeTaxBand = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM paye_tax_bands
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};

// =============================================
// Current Active PAYE Bands
// =============================================

export const getCurrentPayeBands = async () => {
  const result = await pool.query(`
        SELECT *
        FROM paye_tax_bands
        WHERE
            effective_from <= CURRENT_DATE
            AND (
                effective_to IS NULL
                OR effective_to >= CURRENT_DATE
            )
        ORDER BY band_order ASC
    `);

  return result.rows;
};

// =============================================
// Get PAYE Bands By Date
// =============================================

export const getPayeBandsByDate = async (date) => {
  const result = await pool.query(
    `
        SELECT *
        FROM paye_tax_bands
        WHERE
            effective_from <= $1
            AND (
                effective_to IS NULL
                OR effective_to >= $1
            )
        ORDER BY band_order ASC
    `,
    [date]
  );

  return result.rows;
};