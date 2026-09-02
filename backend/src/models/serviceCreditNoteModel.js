import pool from "../config/db.js";
import { recordStockMovement } from "./stockMovementModel.js";


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
    const preparedItems = [];

    // Sequential (not .map) because restock eligibility needs a DB
    // lookup per line — how much of THIS invoice line has already been
    // restocked by earlier credit notes, so we never return more units
    // than were actually sold.
    for (const item of items) {
      const invoiceItem = invoiceItemsById[item.invoice_item_id];
      const creditAmount = Number(item.credit_amount ?? 0);
      const restockRequested = Boolean(item.restock);

      const isRestockEligible =
        invoiceItem.item_type === "sparepart" &&
        !invoiceItem.customer_supplied &&
        invoiceItem.sparepart_id !== null;

      if (restockRequested && !isRestockEligible) {
        throw new Error(
          `"${invoiceItem.description}" can't be restocked — it's not a stocked spare part`
        );
      }

      const quantity =
        item.quantity !== undefined && item.quantity !== null && item.quantity !== ""
          ? Number(item.quantity)
          : Number(invoiceItem.quantity);

      if (creditAmount < 0) {
        throw new Error(`Credit amount cannot be negative for "${invoiceItem.description}"`);
      }

      if (creditAmount === 0 && quantity === Number(invoiceItem.quantity) && !restockRequested) {
        throw new Error(
          `"${invoiceItem.description}" has no credit amount and no quantity change — nothing to record`
        );
      }

      if (creditAmount > Number(invoiceItem.total_price)) {
        throw new Error(`Credit amount exceeds line total for "${invoiceItem.description}"`);
      }

      let restockQuantity = 0;

      if (restockRequested) {
        if (!(quantity > 0)) {
          throw new Error(`Enter a return quantity for "${invoiceItem.description}"`);
        }

        const alreadyRestockedRes = await client.query(
          `SELECT COALESCE(SUM(quantity),0) AS qty
           FROM service_credit_note_items
           WHERE invoice_item_id = $1 AND restock = true`,
          [invoiceItem.id]
        );
        const alreadyRestocked = Number(alreadyRestockedRes.rows[0].qty);
        const remainingReturnable = Number(invoiceItem.quantity) - alreadyRestocked;

        if (quantity > remainingReturnable) {
          throw new Error(
            `Only ${remainingReturnable} unit(s) of "${invoiceItem.description}" remain returnable`
          );
        }

        restockQuantity = quantity;
      }

      subtotal += creditAmount;

      preparedItems.push({
        invoice_item_id: invoiceItem.id,
        item_type: invoiceItem.item_type,
        sparepart_id: invoiceItem.sparepart_id,
        description: invoiceItem.description,
        quantity,
        unit_price: invoiceItem.unit_price,
        total_price: creditAmount,
        restock: restockRequested,
        restock_quantity: restockQuantity
      });
    }

    const taxRate = Number(invoice.tax_rate || 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

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
          (credit_note_id, invoice_item_id, item_type, description, quantity, unit_price, total_price, restock)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [
          creditNoteId,
          item.invoice_item_id,
          item.item_type,
          item.description,
          item.quantity,
          item.unit_price,
          item.total_price,
          item.restock
        ]
      );

      if (item.restock && item.restock_quantity > 0) {
        const stockQuantity = Math.round(item.restock_quantity);

        await client.query(
          `SELECT quantity FROM spareparts WHERE id=$1 FOR UPDATE`,
          [item.sparepart_id]
        );

        await client.query(
          `UPDATE spareparts SET quantity = quantity + $1 WHERE id=$2`,
          [stockQuantity, item.sparepart_id]
        );

        await recordStockMovement(
          client,
          item.sparepart_id,
          "IN",
          stockQuantity,
          "service_credit_note",
          creditNoteId
        );
      }
    }

    const newAmountCredited = alreadyCredited + total;
    const remainingBalance =
      Number(invoice.total) - Number(invoice.amount_paid || 0) - newAmountCredited;

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
    const updates = [];

    for (const item of items) {
      const existing = existingById[item.id];
      if (!existing) throw new Error("One or more items do not belong to this credit note");

      const invoiceItem = invoiceItemsById[existing.invoice_item_id];
      const creditAmount = Number(item.credit_amount ?? 0);
      const restockRequested =
        item.restock !== undefined ? Boolean(item.restock) : existing.restock;

      const isRestockEligible =
        invoiceItem &&
        invoiceItem.item_type === "sparepart" &&
        !invoiceItem.customer_supplied &&
        invoiceItem.sparepart_id !== null;

      if (restockRequested && !isRestockEligible) {
        throw new Error(
          `"${existing.description}" can't be restocked — it's not a stocked spare part`
        );
      }

      const quantity =
        item.quantity !== undefined && item.quantity !== null && item.quantity !== ""
          ? Number(item.quantity)
          : Number(existing.quantity);

      if (creditAmount < 0) {
        throw new Error(`Credit amount cannot be negative for "${existing.description}"`);
      }
      if (
        creditAmount === 0 &&
        quantity === Number(existing.quantity) &&
        restockRequested === existing.restock
      ) {
        throw new Error(
          `"${existing.description}" has no credit amount, quantity, or restock change — nothing to update`
        );
      }
      if (invoiceItem && creditAmount > Number(invoiceItem.total_price)) {
        throw new Error(`Credit amount exceeds line total for "${existing.description}"`);
      }

      if (restockRequested) {
        if (!(quantity > 0)) {
          throw new Error(`Enter a return quantity for "${existing.description}"`);
        }

        // Everything else restocked against this invoice line,
        // excluding this credit note's own current contribution.
        const otherRestockedRes = await client.query(
          `SELECT COALESCE(SUM(quantity),0) AS qty
           FROM service_credit_note_items
           WHERE invoice_item_id = $1 AND restock = true AND id != $2`,
          [existing.invoice_item_id, existing.id]
        );
        const otherRestocked = Number(otherRestockedRes.rows[0].qty);
        const remainingReturnable = Number(invoiceItem.quantity) - otherRestocked;

        if (quantity > remainingReturnable) {
          throw new Error(
            `Only ${remainingReturnable} unit(s) of "${existing.description}" remain returnable`
          );
        }
      }

      const oldUnits = existing.restock ? Number(existing.quantity) : 0;
      const newUnits = restockRequested ? quantity : 0;
      const restockDelta = newUnits - oldUnits;

      subtotal += creditAmount;
      updates.push({
        id: existing.id,
        total_price: creditAmount,
        quantity,
        restock: restockRequested,
        restockDelta,
        sparepart_id: invoiceItem?.sparepart_id
      });
    }

    const taxRate = Number(creditNote.tax_rate || 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const otherCredited = Number(invoice.amount_credited || 0) - Number(creditNote.total);
    if (total > Number(invoice.total) - otherCredited) {
      throw new Error("Credit amount exceeds what remains creditable on this invoice");
    }

    for (const u of updates) {
      await client.query(
        `UPDATE service_credit_note_items SET total_price=$1, quantity=$2, restock=$3 WHERE id=$4`,
        [u.total_price, u.quantity, u.restock, u.id]
      );

      if (u.restockDelta !== 0 && u.sparepart_id) {
        const roundedDelta = Math.round(u.restockDelta);
        if (roundedDelta !== 0) {
          const stockRes = await client.query(
            `SELECT quantity FROM spareparts WHERE id=$1 FOR UPDATE`,
            [u.sparepart_id]
          );
          const currentStock = Number(stockRes.rows[0]?.quantity || 0);

          if (currentStock + roundedDelta < 0) {
            throw new Error(
              `Can't reduce the restocked quantity — only ${currentStock} unit(s) currently in stock`
            );
          }

          await client.query(
            `UPDATE spareparts SET quantity = quantity + $1 WHERE id=$2`,
            [roundedDelta, u.sparepart_id]
          );

          await recordStockMovement(
            client,
            u.sparepart_id,
            roundedDelta > 0 ? "IN" : "OUT",
            Math.abs(roundedDelta),
            "service_credit_note_adjustment",
            creditNoteId
          );
        }
      }
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