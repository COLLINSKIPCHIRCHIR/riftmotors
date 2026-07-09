// src/models/inventoryModel.js
import pool from "../config/db.js";

export const getAllInventoryItems = async () => {
  const query = `
    SELECT 
      id,
      'vehicle' AS type,
      make AS brand,
      model AS name,
      year,
      selling_price,
      mileage,
      color,
      transmission,
      fuel_type,
      status,
      image_url,
      description,
      created_at
    FROM vehicles
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query);
  return result.rows;
};
