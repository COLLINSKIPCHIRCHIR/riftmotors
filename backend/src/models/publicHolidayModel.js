import pool from "../config/db.js";

// ===================================
// Create Public Holiday
// ===================================

export const createPublicHoliday = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO public_holidays
    (
      holiday_name,
      holiday_date,
      is_recurring
    )

    VALUES ($1,$2,$3)

    RETURNING *;
    `,
    [
      data.holiday_name,
      data.holiday_date,
      data.is_recurring,
    ]
  );

  return result.rows[0];
};

// ===================================
// Get All Holidays
// ===================================

export const getAllPublicHolidays = async () => {
  const result = await pool.query(
    `
    SELECT *

    FROM public_holidays

    ORDER BY holiday_date ASC
    `
  );

  return result.rows;
};

// ===================================
// Get Holiday By ID
// ===================================

export const getPublicHolidayById = async (id) => {
  const result = await pool.query(
    `
    SELECT *

    FROM public_holidays

    WHERE id=$1
    `,
    [id]
  );

  return result.rows[0];
};

// ===================================
// Update Holiday
// ===================================

export const updatePublicHoliday = async (
  id,
  data
) => {
  const result = await pool.query(
    `
    UPDATE public_holidays

    SET

      holiday_name=$1,
      holiday_date=$2,
      is_recurring=$3

    WHERE id=$4

    RETURNING *;
    `,
    [
      data.holiday_name,
      data.holiday_date,
      data.is_recurring,
      id,
    ]
  );

  return result.rows[0];
};

// ===================================
// Delete Holiday
// ===================================

export const deletePublicHoliday = async (
  id
) => {
  const result = await pool.query(
    `
    DELETE FROM public_holidays

    WHERE id=$1

    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};