import pool from "../config/db.js";

export const createPurchaseTransaction = async (supplier_id, items) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔹 Calculate totals
    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.quantity * item.unit_cost;
    });

    const total = subtotal;

    // 🔹 Insert purchase header
    const purchaseResult = await client.query(
      `INSERT INTO spare_purchases (supplier_id, subtotal, total)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [supplier_id, subtotal, total]
    );

    const purchase = purchaseResult.rows[0];

    // 🔹 Loop items
    for (const item of items) {
      const total_cost = item.quantity * item.unit_cost;

      // 1️⃣ Insert purchase item
      await client.query(
        `INSERT INTO spare_purchase_items 
        (purchase_id, sparepart_id, quantity, unit_cost, total_cost)
        VALUES ($1, $2, $3, $4, $5)`,
        [
          purchase.id,
          item.sparepart_id,
          item.quantity,
          item.unit_cost,
          total_cost,
        ]
      );

      // 2️⃣ Increase stock
      await client.query(
        `UPDATE spareparts
         SET quantity = quantity + $1
         WHERE id = $2`,
        [item.quantity, item.sparepart_id]
      );

      // 3️⃣ Insert stock movement
      await client.query(
        `INSERT INTO stock_movements
        (sparepart_id, type, quantity, reference_type, reference_id)
        VALUES ($1, $2, $3, $4, $5)`,
        [
          item.sparepart_id,
          "IN",
          item.quantity,
          "purchase",
          purchase.id,
        ]
      );

    }

    await client.query("COMMIT");
    return purchase;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};


export const getAllPurchases = async () => {
  const result = await pool.query(
    `SELECT sp.*, s.name AS supplier_name
     FROM spare_purchases sp
     LEFT JOIN suppliers s ON sp.supplier_id = s.id
     ORDER BY sp.created_at DESC`
  );

  return result.rows;
};


export const getPurchaseById = async (id) => {
  const purchaseResult = await pool.query(
    `SELECT sp.*, s.name AS supplier_name
     FROM spare_purchases sp
     LEFT JOIN suppliers s ON sp.supplier_id = s.id
     WHERE sp.id = $1`,
    [id]
  );

  const itemsResult = await pool.query(
    `SELECT spi.*, sp.name AS sparepart_name
     FROM spare_purchase_items spi
     JOIN spareparts sp ON spi.sparepart_id = sp.id
     WHERE spi.purchase_id = $1`,
    [id]
  );

  return {
    purchase: purchaseResult.rows[0],
    items: itemsResult.rows,
  };
};
