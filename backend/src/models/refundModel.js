import pool from "../config/db.js";
import { recordStockMovement } from "./stockMovementModel.js";

export const createRefund = async ({ sale_id, items, reason }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify sale exists
    const saleRes = await client.query(
      `SELECT * FROM spare_sales WHERE id=$1`,
      [sale_id]
    );

    if (saleRes.rows.length === 0) {
      throw new Error("Sale not found");
    }

    let refundTotal = 0;

    for (const item of items) {
      // Verify item was part of original sale
      const saleItem = await client.query(
        `SELECT * FROM spare_sale_items 
         WHERE sale_id=$1 AND sparepart_id=$2`,
        [sale_id, item.sparepart_id]
      );

      if (saleItem.rows.length === 0) {
        throw new Error(
          `Item ${item.sparepart_id} not found in original sale`
        );
      }

      const originalItem = saleItem.rows[0];

      if (item.quantity > originalItem.quantity) {
        throw new Error(
          `Cannot refund more than sold quantity for part ${item.sparepart_id}`
        );
      }

      refundTotal += item.quantity * Number(originalItem.unit_price);

      // Return stock
      await client.query(
        `UPDATE spareparts SET quantity = quantity + $1 WHERE id = $2`,
        [item.quantity, item.sparepart_id]
      );

      // Record stock movement
      await recordStockMovement(
        client,
        item.sparepart_id,
        "IN",
        item.quantity,
        "refund",
        sale_id
      );
    }

    // Record refund
    const refundRes = await client.query(
      `INSERT INTO spare_refunds 
       (sale_id, reason, refund_amount, status)
       VALUES ($1, $2, $3, 'completed')
       RETURNING *`,
      [sale_id, reason, refundTotal]
    );

    await client.query("COMMIT");
    return refundRes.rows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const createRefundTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS spare_refunds (
      id SERIAL PRIMARY KEY,
      sale_id INT REFERENCES spare_sales(id),
      reason TEXT,
      refund_amount NUMERIC(12,2),
      status VARCHAR(20) DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("✅ Spare refunds table ready");
};