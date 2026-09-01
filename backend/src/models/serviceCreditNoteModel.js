import pool from "../config/db.js";



// First credit note on an invoice: SRV-2026-00001-CN
// Second (rare, but possible - e.g. two separate corrections over time):
// SRV-2026-00001-CN-2, etc.
const generateCreditNoteNumber = async (client, invoiceNumber, invoiceId) => {
  const result = await client.query(
    `SELECT COUNT(*) AS count FROM service_credit_notes WHERE invoice_id=$1`,
    [invoiceId]
  );

  const existing = Number(result.rows[0].count);

  return existing === 0
    ? `${invoiceNumber}-CN`
    : `${invoiceNumber}-CN-${existing + 1}`;
};

// CREATE CREDIT NOTE
//
// items: [{ invoice_item_id, credit_amount }]
//
// credit_amount is the pre-tax KES amount being credited back against
// that specific invoice line - this is a price-correction tool, not a
// stock return, so we don't touch quantity or spareparts.quantity here.
// The invoice_item just supplies item_type/description/quantity so the
// credit note line reads sensibly next to the original invoice line.
//
// Can be issued against any invoice regardless of payment status (a
// paid invoice can still carry a credit - that becomes money owed back
// to the customer, tracked via amount_credited rather than amount_paid).
export const createServiceCreditNote = async ({ invoice_id, reason, items }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const invoiceRes = await client.query(
      `SELECT * FROM service_invoices WHERE id=$1`,
      [invoice_id]
    );

    if (invoiceRes.rows.length === 0) {
      throw new Error("Invoice not found");
    }

    const invoice = invoiceRes.rows[0];

    if (!items || items.length === 0) {
      throw new Error("At least one item is required");
    }

    const invoiceItemIds = items.map((i) => i.invoice_item_id);

    const invoiceItemsRes = await client.query(
      `SELECT * FROM service_invoice_items WHERE id = ANY($1::int[]) AND invoice_id=$2`,
      [invoiceItemIds, invoice_id]
    );

    if (invoiceItemsRes.rows.length !== items.length) {
      throw new Error("One or more items do not belong to this invoice");
    }

    const invoiceItemsById = Object.fromEntries(
      invoiceItemsRes.rows.map((row) => [row.id, row])
    );

    let subtotal = 0;

    const preparedItems = items.map((item) => {
  const invoiceItem = invoiceItemsById[item.invoice_item_id];
  const creditAmount = Number(item.credit_amount ?? 0);

  // Quantity can be overridden at creation time too — e.g. the invoice
  // recorded "2" for labour due to the old rounding bug, but the real
  // figure was "1.5". This never affects total_price/subtotal — it's a
  // documentation field only, same as in updateServiceCreditNote.
  const quantity =
    item.quantity !== undefined && item.quantity !== null && item.quantity !== ""
      ? Number(item.quantity)
      : Number(invoiceItem.quantity);

  if (creditAmount < 0) {
    throw new Error(`Credit amount cannot be negative for "${invoiceItem.description}"`);
  }

  if (creditAmount === 0 && quantity === Number(invoiceItem.quantity)) {
    throw new Error(
      `"${invoiceItem.description}" has no credit amount and no quantity change — nothing to record`
    );
  }

  if (creditAmount > Number(invoiceItem.total_price)) {
    throw new Error(`Credit amount exceeds line total for "${invoiceItem.description}"`);
  }

  subtotal += creditAmount;

  return {
    invoice_item_id: invoiceItem.id,
    item_type: invoiceItem.item_type,
    description: invoiceItem.description,
    quantity,
    unit_price: invoiceItem.unit_price,
    total_price: creditAmount
  };
});
    const taxRate = Number(invoice.tax_rate || 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Ceiling is the invoice total itself minus whatever's already been
    // credited - not the unpaid balance, since paid invoices are fair
    // game too.
    const alreadyCredited = Number(invoice.amount_credited || 0);

    if (total > Number(invoice.total) - alreadyCredited) {
      throw new Error("Credit amount exceeds what remains creditable on this invoice");
    }

    const creditNoteNumber = await generateCreditNoteNumber(
      client,
      invoice.invoice_number,
      invoice_id
    );

    const creditNoteRes = await client.query(
      `
      INSERT INTO service_credit_notes
        (credit_note_number, invoice_id, job_id, customer_name, customer_phone,
         reason, subtotal, tax_rate, tax_amount, total)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        creditNoteNumber,
        invoice_id,
        invoice.job_id,
        invoice.customer_name,
        invoice.customer_phone,
        reason || null,
        subtotal,
        taxRate,
        taxAmount,
        total
      ]
    );

    const creditNoteId = creditNoteRes.rows[0].id;

    for (const item of preparedItems) {
      await client.query(
        `
        INSERT INTO service_credit_note_items
          (credit_note_id, invoice_item_id, item_type, description, quantity, unit_price, total_price)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
          creditNoteId,
          item.invoice_item_id,
          item.item_type,
          item.description,
          item.quantity,
          item.unit_price,
          item.total_price
        ]
      );
    }

    const newAmountCredited = alreadyCredited + total;
    const remainingBalance =
      Number(invoice.total) - Number(invoice.amount_paid || 0) - newAmountCredited;

    // 'credited' = fully written off with no payment ever made.
    // 'paid' stays 'paid' if it was already fully paid (credit just
    // means money owed back, tracked separately - doesn't unpay it).
    // Otherwise 'partial' if there's a mix of paid/credited but balance
    // remains, else leave status as-is.
    let newStatus = invoice.status;
    if (remainingBalance <= 0) {
      newStatus = Number(invoice.amount_paid || 0) > 0 ? "paid" : "credited";
    } else if (Number(invoice.amount_paid || 0) > 0 || newAmountCredited > 0) {
      newStatus = "partial";
    }

    await client.query(
      `UPDATE service_invoices SET amount_credited=$1, status=$2 WHERE id=$3`,
      [newAmountCredited, newStatus, invoice_id]
    );

    await client.query("COMMIT");

    return creditNoteRes.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getServiceCreditNotes = async () => {
  const result = await pool.query(
    `SELECT * FROM service_credit_notes ORDER BY created_at DESC`
  );
  return result.rows;
};

export const getServiceCreditNoteById = async (id) => {
  const creditNote = await pool.query(
    `
    SELECT
      scn.*,
      si.invoice_number,
      cv.registration_number,
      cv.make AS vehicle_make,
      cv.model AS vehicle_model,
      cv.vin_no,
      cv.engine_number,
      c.kra_pin AS customer_kra_pin,
      c.address AS customer_address
    FROM service_credit_notes scn
    LEFT JOIN service_invoices si ON scn.invoice_id = si.id
    LEFT JOIN service_jobs sj ON scn.job_id = sj.id
    LEFT JOIN customer_vehicles cv ON sj.vehicle_id = cv.id
    LEFT JOIN customers c ON sj.customer_id = c.id
    WHERE scn.id=$1
    `,
    [id]
  );

  if (creditNote.rows.length === 0) return null;

  const items = await pool.query(
    `SELECT * FROM service_credit_note_items WHERE credit_note_id=$1`,
    [id]
  );

  return { ...creditNote.rows[0], items: items.rows };
};


export const updateServiceCreditNote = async (creditNoteId, { reason, items }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const cnRes = await client.query(`SELECT * FROM service_credit_notes WHERE id=$1`, [creditNoteId]);
    if (cnRes.rows.length === 0) throw new Error("Credit note not found");
    const creditNote = cnRes.rows[0];

    const invoiceRes = await client.query(
      `SELECT * FROM service_invoices WHERE id=$1 FOR UPDATE`,
      [creditNote.invoice_id]
    );
    if (invoiceRes.rows.length === 0) throw new Error("Invoice not found");
    const invoice = invoiceRes.rows[0];

    if (!items || items.length === 0) throw new Error("At least one item is required");

    const existingItemsRes = await client.query(
      `SELECT * FROM service_credit_note_items WHERE credit_note_id=$1`,
      [creditNoteId]
    );
    const existingById = Object.fromEntries(existingItemsRes.rows.map((r) => [r.id, r]));

    const invoiceItemIds = existingItemsRes.rows.map((r) => r.invoice_item_id);
    const invoiceItemsRes = await client.query(
      `SELECT * FROM service_invoice_items WHERE id = ANY($1::int[])`,
      [invoiceItemIds]
    );
    const invoiceItemsById = Object.fromEntries(invoiceItemsRes.rows.map((r) => [r.id, r]));

    let subtotal = 0;
    const updates = items.map((item) => {
      const existing = existingById[item.id];
      if (!existing) throw new Error("One or more items do not belong to this credit note");

      const invoiceItem = invoiceItemsById[existing.invoice_item_id];
      const creditAmount = Number(item.credit_amount ?? 0);

      // Quantity is a documentation/label field only — it never feeds
      // subtotal/tax/total. This lets a line note "actual qty 1.5,
      // invoiced as 2" (a data-entry correction) without implying any
      // money moved, distinct from a real price credit.
      const quantity =
        item.quantity !== undefined && item.quantity !== null && item.quantity !== ""
          ? Number(item.quantity)
          : Number(existing.quantity);

      // A line must carry either a real credit amount, or a quantity
      // change with zero amount (pure correction) — but not a negative
      // or garbage amount either way.
      if (creditAmount < 0) {
        throw new Error(`Credit amount cannot be negative for "${existing.description}"`);
      }
      if (creditAmount === 0 && quantity === Number(existing.quantity)) {
        throw new Error(
          `"${existing.description}" has no credit amount and no quantity change — nothing to update`
        );
      }
      if (invoiceItem && creditAmount > Number(invoiceItem.total_price)) {
        throw new Error(`Credit amount exceeds line total for "${existing.description}"`);
      }

      subtotal += creditAmount;
      return { id: existing.id, total_price: creditAmount, quantity };
    });

    const taxRate = Number(creditNote.tax_rate || 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Everything credited on this invoice EXCLUDING this note's old total,
    // plus the new total, still can't exceed the invoice total.
    const otherCredited = Number(invoice.amount_credited || 0) - Number(creditNote.total);
    if (total > Number(invoice.total) - otherCredited) {
      throw new Error("Credit amount exceeds what remains creditable on this invoice");
    }

    for (const u of updates) {
      await client.query(
        `UPDATE service_credit_note_items SET total_price=$1, quantity=$2 WHERE id=$3`,
        [u.total_price, u.quantity, u.id]
      );
    }

    await client.query(
      `UPDATE service_credit_notes SET reason=$1, subtotal=$2, tax_amount=$3, total=$4 WHERE id=$5`,
      [reason ?? creditNote.reason, subtotal, taxAmount, total, creditNoteId]
    );

    const newAmountCredited = otherCredited + total;
    const remainingBalance = Number(invoice.total) - Number(invoice.amount_paid || 0) - newAmountCredited;

    let newStatus = invoice.status;
    if (remainingBalance <= 0) {
      newStatus = Number(invoice.amount_paid || 0) > 0 ? "paid" : "credited";
    } else if (Number(invoice.amount_paid || 0) > 0 || newAmountCredited > 0) {
      newStatus = "partial";
    }

    await client.query(`UPDATE service_invoices SET amount_credited=$1, status=$2 WHERE id=$3`, [
      newAmountCredited, newStatus, invoice.id
    ]);

    await client.query("COMMIT");
    return await getServiceCreditNoteById(creditNoteId);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};