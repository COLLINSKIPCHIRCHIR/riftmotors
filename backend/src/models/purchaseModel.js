import pool from "../config/db.js";

// ---- number generators (DB sequences, see migration 001) ----
const generateLpoNumber = async (client) => {
  const result = await client.query(`SELECT generate_lpo_number() AS lpo_number`);
  return result.rows[0].lpo_number;
};

const generateGrnNumber = async (client) => {
  const result = await client.query(`SELECT generate_grn_number() AS grn_number`);
  return result.rows[0].grn_number;
};

// Creates a spare part as part of the SAME purchase transaction (same
// `client`), not via sparePartModel.addSparePart — that function uses the
// shared `pool` directly, so if it ran outside this transaction and the
// LPO insert failed afterward, the new part would stay committed as an
// orphan instead of rolling back with everything else. Mirrors the exact
// columns/order of sparePartModel.addSparePart — keep the two in sync if
// the spareparts table ever changes shape.
// quantity is always inserted as 0: stock only ever increases when goods
// are actually received against the LPO (createGoodsReceipt below), same
// rule as every other line on the order.
const createSparePartInTransaction = async (client, data) => {
  const query = `
    INSERT INTO spareparts (
      part_number, name, category, quantity,
      buying_price, selling_price, discount,
      supplier_id, supplier
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;

  const values = [
    data.part_number || null,
    data.name,
    data.category || null,
    0,
    data.buying_price,
    data.selling_price || 0,
    data.discount || 0,
    data.supplier_id || null,
    data.supplier || null,
  ];

  const result = await client.query(query, values);
  return result.rows[0];
};

// ➤ Create LPO (status = draft). No stock movement happens here —
//   stock only moves when goods are actually received (see createGoodsReceipt).
//   Each item is either { sparepart_id, quantity, unit_cost } for an
//   existing part, or { new_part: { name, part_number, category, selling_price,
//   discount }, quantity, unit_cost } for a part that doesn't exist yet —
//   the new_part branch gets created first, at quantity 0, and its id is
//   used for the purchase line, all inside this one transaction.
export const createPurchaseTransaction = async (
  supplier_id,
  items,
  created_by,
  { expected_delivery_date = null, notes = null } = {}
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Resolve every line to a real sparepart_id first, creating any
    // brand-new parts along the way, before we touch spare_purchases.
    const resolvedItems = [];
    for (const item of items) {
      let sparepart_id = item.sparepart_id || null;

      if (!sparepart_id && item.new_part?.name) {
        const newPart = await createSparePartInTransaction(client, {
          part_number: item.new_part.part_number,
          name: item.new_part.name,
          category: item.new_part.category,
          buying_price: item.unit_cost,
          selling_price: item.new_part.selling_price,
          discount: item.new_part.discount,
          supplier_id,
        });
        sparepart_id = newPart.id;
      }

      if (!sparepart_id) {
        throw new Error("Each item needs either an existing sparepart_id or new_part.name");
      }

      resolvedItems.push({ ...item, sparepart_id });
    }

    let subtotal = 0;
    resolvedItems.forEach((item) => {
      subtotal += item.quantity * item.unit_cost;
    });

    const lpo_number = await generateLpoNumber(client);

    const purchaseResult = await client.query(
      `INSERT INTO spare_purchases
        (supplier_id, subtotal, total, lpo_number, status, created_by, expected_delivery_date, notes)
       VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7)
       RETURNING *`,
      [supplier_id, subtotal, subtotal, lpo_number, created_by, expected_delivery_date, notes]
    );

    const purchase = purchaseResult.rows[0];

    for (const item of resolvedItems) {
      const total_cost = item.quantity * item.unit_cost;

      await client.query(
        `INSERT INTO spare_purchase_items
          (purchase_id, sparepart_id, quantity, unit_cost, total_cost)
         VALUES ($1, $2, $3, $4, $5)`,
        [purchase.id, item.sparepart_id, item.quantity, item.unit_cost, total_cost]
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

// ➤ List, optionally filtered by status (?status=sent etc.)
export const getAllPurchases = async (status) => {
  const query = `
    SELECT sp.*, s.name AS supplier_name
    FROM spare_purchases sp
    LEFT JOIN suppliers s ON sp.supplier_id = s.id
    ${status ? "WHERE sp.status = $1" : ""}
    ORDER BY sp.created_at DESC
  `;

  const result = status ? await pool.query(query, [status]) : await pool.query(query);
  return result.rows;
};

// ➤ Get one LPO with its items and receipt (GRN) history
export const getPurchaseById = async (id) => {
  const purchaseResult = await pool.query(
    `SELECT sp.*, s.name AS supplier_name, s.phone AS supplier_phone,
            s.email AS supplier_email, s.address AS supplier_address
     FROM spare_purchases sp
     LEFT JOIN suppliers s ON sp.supplier_id = s.id
     WHERE sp.id = $1`,
    [id]
  );

  const itemsResult = await pool.query(
    `SELECT spi.*, sp.name AS sparepart_name
     FROM spare_purchase_items spi
     JOIN spareparts sp ON spi.sparepart_id = sp.id
     WHERE spi.purchase_id = $1
     ORDER BY spi.id`,
    [id]
  );

  const receiptsResult = await pool.query(
    `SELECT pr.*, u.username AS received_by_name
     FROM purchase_receipts pr
     LEFT JOIN users u ON pr.received_by = u.id
     WHERE pr.purchase_id = $1
     ORDER BY pr.created_at DESC`,
    [id]
  );

  return {
    purchase: purchaseResult.rows[0],
    items: itemsResult.rows,
    receipts: receiptsResult.rows,
  };
};

// ➤ Send: draft -> sent. Returns undefined if it wasn't in draft
//   (caller turns that into a 400).
export const sendPurchaseOrder = async (id, approved_by) => {
  const result = await pool.query(
    `UPDATE spare_purchases
     SET status = 'sent', approved_by = $1, approved_at = NOW()
     WHERE id = $2 AND status = 'draft'
     RETURNING *`,
    [approved_by, id]
  );

  return result.rows[0];
};

// ➤ Cancel: draft or sent -> cancelled. Can't cancel once anything's been received.
export const cancelPurchaseOrder = async (id) => {
  const result = await pool.query(
    `UPDATE spare_purchases
     SET status = 'cancelled'
     WHERE id = $1 AND status IN ('draft', 'sent')
     RETURNING *`,
    [id]
  );

  return result.rows[0];
};

// ➤ Receive goods against an LPO. Records a GRN, bumps quantity_received
//   per line, only moves stock for what's actually arriving on THIS
//   delivery, and rolls the LPO status up to partially_received / received.
//   Supports partial deliveries — you can call this multiple times against
//   the same LPO as stock trickles in.
export const createGoodsReceipt = async (purchase_id, receivedItems, received_by, notes) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const purchaseResult = await client.query(
      `SELECT * FROM spare_purchases WHERE id = $1 FOR UPDATE`,
      [purchase_id]
    );
    const purchase = purchaseResult.rows[0];

    if (!purchase) throw new Error("Purchase not found");
    if (!["sent", "partially_received"].includes(purchase.status)) {
      throw new Error(`Cannot receive goods for an LPO in '${purchase.status}' status`);
    }

    const grn_number = await generateGrnNumber(client);

    const receiptResult = await client.query(
      `INSERT INTO purchase_receipts (purchase_id, grn_number, received_by, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [purchase_id, grn_number, received_by, notes]
    );
    const receipt = receiptResult.rows[0];

    for (const line of receivedItems) {
      if (!line.quantity_received || line.quantity_received <= 0) continue;

      const itemResult = await client.query(
        `SELECT * FROM spare_purchase_items WHERE id = $1 AND purchase_id = $2 FOR UPDATE`,
        [line.purchase_item_id, purchase_id]
      );
      const purchaseItem = itemResult.rows[0];
      if (!purchaseItem) {
        throw new Error(`Purchase item ${line.purchase_item_id} not found on this LPO`);
      }

      const remaining = purchaseItem.quantity - purchaseItem.quantity_received;
      if (line.quantity_received > remaining) {
        throw new Error(
          `Cannot receive ${line.quantity_received} units — only ${remaining} remaining on line ${purchaseItem.id}`
        );
      }

      await client.query(
        `INSERT INTO purchase_receipt_items (receipt_id, purchase_item_id, quantity_received)
         VALUES ($1, $2, $3)`,
        [receipt.id, line.purchase_item_id, line.quantity_received]
      );

      await client.query(
        `UPDATE spare_purchase_items
         SET quantity_received = quantity_received + $1
         WHERE id = $2`,
        [line.quantity_received, line.purchase_item_id]
      );

      await client.query(
        `UPDATE spareparts SET quantity = quantity + $1 WHERE id = $2`,
        [line.quantity_received, purchaseItem.sparepart_id]
      );

      await client.query(
        `INSERT INTO stock_movements (sparepart_id, type, quantity, reference_type, reference_id)
         VALUES ($1, 'IN', $2, 'purchase_receipt', $3)`,
        [purchaseItem.sparepart_id, line.quantity_received, receipt.id]
      );
    }

    // Roll the LPO header status up based on how much has now arrived in total.
    const allItemsResult = await client.query(
      `SELECT quantity, quantity_received FROM spare_purchase_items WHERE purchase_id = $1`,
      [purchase_id]
    );
    const allItems = allItemsResult.rows;
    const fullyReceived = allItems.every((i) => i.quantity_received >= i.quantity);
    const anyReceived = allItems.some((i) => i.quantity_received > 0);
    const newStatus = fullyReceived ? "received" : anyReceived ? "partially_received" : purchase.status;

    await client.query(`UPDATE spare_purchases SET status = $1 WHERE id = $2`, [newStatus, purchase_id]);

    await client.query("COMMIT");
    return { receipt, status: newStatus };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};