import pool from "../config/db.js";

export const recordStockMovement = async (
  client,
  sparepart_id,
  type,
  quantity,
  reference_type,
  reference_id
) => {
  await client.query(
    `INSERT INTO stock_movements
     (sparepart_id, type, quantity, reference_type, reference_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [sparepart_id, type, quantity, reference_type, reference_id]
  );
};

export const getStockHistory = async (sparepartId) => {
  const result = await pool.query(
    `SELECT sm.*, sp.name
     FROM stock_movements sm
     JOIN spareparts sp ON sp.id = sm.sparepart_id
     WHERE sm.sparepart_id = $1
     ORDER BY sm.created_at DESC`,
    [sparepartId]
  );

  return result.rows;
};
