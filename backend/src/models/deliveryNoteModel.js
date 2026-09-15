// src/models/deliveryNoteModel.js
import pool from "../config/db.js";

const generateDeliveryNoteNo = async (client) => {
  const result = await client.query(
    `UPDATE document_sequences
     SET last_number = last_number + 1
     WHERE doc_type = 'delivery_note'
     RETURNING prefix, last_number;`
  );
  const { prefix, last_number } = result.rows[0];
  return `${prefix}${last_number}`;
};

const DEFAULT_ITEMS = [
  { item_name: "Jack + Handle", quantity: 1 },
  { item_name: "Radio + Speakers", quantity: 1 },
  { item_name: "External Mirrors", quantity: 2 },
  { item_name: "Interior Mirror", quantity: 1 },
  { item_name: "Keys", quantity: 1 },
  { item_name: "Wheel Spanner", quantity: 1 },
  { item_name: "Spare Wheel + Wheel Lock", quantity: 1 },
  { item_name: "Fuel Tank Cap", quantity: 1 },
  { item_name: "Floor Mats", quantity: 1 },
  { item_name: "Fire Extinguisher", quantity: 1 },
  { item_name: "First Aid Kit", quantity: 1 },
  { item_name: "Tyre Repair Kit", quantity: 1 },
];

export const createDeliveryNote = async (data) => {
  const { invoice_id, delivered_by, received_by, mileage_on_delivery, notes } = data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const noteNo = await generateDeliveryNoteNo(client);

    const noteResult = await client.query(
      `INSERT INTO delivery_notes
         (invoice_id, delivered_by, received_by, mileage_on_delivery, notes)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *;`,
      [invoice_id, delivered_by || null, received_by || null, mileage_on_delivery || null, notes || null]
    );
    const note = noteResult.rows[0];
    note.note_no = noteNo; // not a DB column yet — see note below

    const itemsToInsert = data.items && data.items.length > 0 ? data.items : DEFAULT_ITEMS;
    const values = [];
    const placeholders = itemsToInsert
      .map((it, i) => {
        values.push(note.id, it.item_name, it.quantity ?? 1, it.is_checked ?? false);
        const base = i * 4;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
      })
      .join(", ");

    const itemsResult = await client.query(
      `INSERT INTO delivery_note_items (delivery_note_id, item_name, quantity, is_checked)
       VALUES ${placeholders}
       RETURNING *;`,
      values
    );

    await client.query("COMMIT");
    return { ...note, items: itemsResult.rows };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getAllDeliveryNotes = async () => {
  const query = `
    SELECT dn.*, i.invoice_no, v.make, v.model, v.chassis_no, c.name AS customer_name
    FROM delivery_notes dn
    JOIN sales_invoices i ON dn.invoice_id = i.id
    JOIN vehicles v ON i.vehicle_id = v.id
    JOIN customers c ON i.customer_id = c.id
    ORDER BY dn.created_at DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const getDeliveryNoteById = async (id) => {
  const noteResult = await pool.query(
    `SELECT dn.*, i.invoice_no, v.make, v.model, v.chassis_no, v.engine_no, c.name AS customer_name
     FROM delivery_notes dn
     JOIN sales_invoices i ON dn.invoice_id = i.id
     JOIN vehicles v ON i.vehicle_id = v.id
     JOIN customers c ON i.customer_id = c.id
     WHERE dn.id = $1;`,
    [id]
  );
  const note = noteResult.rows[0];
  if (!note) return null;

  const itemsResult = await pool.query(
    `SELECT * FROM delivery_note_items WHERE delivery_note_id = $1 ORDER BY id ASC`,
    [id]
  );
  note.items = itemsResult.rows;
  return note;
};

export const toggleDeliveryItem = async (itemId, is_checked) => {
  const result = await pool.query(
    `UPDATE delivery_note_items SET is_checked = $1 WHERE id = $2 RETURNING *`,
    [is_checked, itemId]
  );
  return result.rows[0];
};