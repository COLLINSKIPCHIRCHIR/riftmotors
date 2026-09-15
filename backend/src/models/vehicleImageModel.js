// src/models/vehicleImageModel.js
import pool from "../config/db.js";

export const addVehicleImages = async (vehicleId, imagePaths) => {
  if (!imagePaths || imagePaths.length === 0) return [];

  const values = [];
  const placeholders = imagePaths
    .map((imgPath, i) => {
      const isPrimary = i === 0; // first uploaded image is primary by default
      values.push(vehicleId, imgPath, isPrimary);
      const base = i * 3;
      return `($${base + 1}, $${base + 2}, $${base + 3})`;
    })
    .join(", ");

  const query = `
    INSERT INTO vehicle_images (vehicle_id, image_url, is_primary)
    VALUES ${placeholders}
    RETURNING *;
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getImagesByVehicleId = async (vehicleId) => {
  const result = await pool.query(
    `SELECT * FROM vehicle_images WHERE vehicle_id = $1 ORDER BY is_primary DESC, id ASC`,
    [vehicleId]
  );
  return result.rows;
};

export const deleteVehicleImage = async (imageId) => {
  const result = await pool.query(
    `DELETE FROM vehicle_images WHERE id = $1 RETURNING *`,
    [imageId]
  );
  return result.rows[0];
};

export const setPrimaryImage = async (vehicleId, imageId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE vehicle_images SET is_primary = false WHERE vehicle_id = $1`, [vehicleId]);
    const result = await client.query(
      `UPDATE vehicle_images SET is_primary = true WHERE id = $1 AND vehicle_id = $2 RETURNING *`,
      [imageId, vehicleId]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};