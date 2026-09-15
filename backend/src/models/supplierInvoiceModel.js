import pool from "../config/db.js";

const generateInvoiceNumber = async (client) => {
  const result = await client.query(`SELECT generate_invoice_number() AS invoice_number`);
  return result.rows[0].invoice_number;
};

const DEFAULT_TAX_RATE = 16;

// ➤ Create a supplier invoice, optionally against an LPO.
//   items: [{ purchase_item_id?, sparepart_id, quantity, unit_cost }]
//   purchase_item_id is optional per line — omit it for ad-hoc items not
//   tied to any LPO. When it IS given, we check the line against that
//   line's (quantity_received - quantity_invoiced), but exceeding it is
//   NOT blocked — suppliers sometimes invoice ahead of or beyond a
//   recorded receipt — it just comes back in `warnings` so the caller
//   (controller/frontend) can flag it to the user instead of silently
//   accepting or silently rejecting it.
export const createSupplierInvoice = async (
  supplier_id,
  items,
  created_by,
  {
    purchase_id = null,
    supplier_invoice_number = null,
    invoice_date = null,
    due_date = null,
    notes = null,
    tax_rate = DEFAULT_TAX_RATE,
  } = {}
) => {
  const client = await pool.connect();
  const warnings = [];

  try {
    await client.query("BEGIN");

    if (!items || items.length === 0) {
      throw new Error("An invoice needs at least one item");
    }

    const resolvedItems = [];

    for (const item of items) {
      if (!item.sparepart_id) {
        throw new Error("Each invoice item needs a sparepart_id");
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error("Each invoice item needs a quantity greater than 0");
      }
      if (item.unit_cost === undefined || item.unit_cost === null || item.unit_cost < 0) {
        throw new Error("Each invoice item needs a valid unit_cost");
      }

      let purchase_item_id = item.purchase_item_id || null;

      if (purchase_item_id) {
        const itemResult = await client.query(
          `SELECT * FROM spare_purchase_items WHERE id = $1 FOR UPDATE`,
          [purchase_item_id]
        );
        const purchaseItem = itemResult.rows[0];

        if (!purchaseItem) {
          throw new Error(`Purchase item ${purchase_item_id} not found`);
        }
        if (purchase_id && purchaseItem.purchase_id !== Number(purchase_id)) {
          throw new Error(`Purchase item ${purchase_item_id} does not belong to this LPO`);
        }

        const remaining = purchaseItem.quantity_received - purchaseItem.quantity_invoiced;
        if (item.quantity > remaining) {
          warnings.push(
            `Line for sparepart ${item.sparepart_id}: invoicing ${item.quantity} but only ${remaining} received and not yet invoiced.`
          );
        }
      }

      resolvedItems.push({ ...item, purchase_item_id });
    }

    let subtotal = 0;
    resolvedItems.forEach((item) => {
      subtotal += item.quantity * item.unit_cost;
    });

    const rate = tax_rate === undefined || tax_rate === null ? DEFAULT_TAX_RATE : Number(tax_rate);
    const taxAmount = subtotal * (rate / 100);
    const total = subtotal + taxAmount;

    const invoice_number = await generateInvoiceNumber(client);

    const invoiceResult = await client.query(
      `INSERT INTO supplier_invoices
        (invoice_number, supplier_invoice_number, purchase_id, supplier_id,
         invoice_date, due_date, subtotal, tax_rate, tax_amount, total,
         amount_paid, status, notes, created_by)
       VALUES ($1,$2,$3,$4, COALESCE($5, CURRENT_DATE), $6, $7,$8,$9,$10, 0, 'unpaid', $11, $12)
       RETURNING *`,
      [
        invoice_number,
        supplier_invoice_number,
        purchase_id,
        supplier_id,
        invoice_date,
        due_date,
        subtotal,
        rate,
        taxAmount,
        total,
        notes,
        created_by,
      ]
    );

    const invoice = invoiceResult.rows[0];

    for (const item of resolvedItems) {
      const total_cost = item.quantity * item.unit_cost;

      await client.query(
        `INSERT INTO supplier_invoice_items
          (invoice_id, purchase_item_id, sparepart_id, quantity, unit_cost, total_cost)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [invoice.id, item.purchase_item_id, item.sparepart_id, item.quantity, item.unit_cost, total_cost]
      );

      if (item.purchase_item_id) {
        await client.query(
          `UPDATE spare_purchase_items
           SET quantity_invoiced = quantity_invoiced + $1
           WHERE id = $2`,
          [item.quantity, item.purchase_item_id]
        );
      }
    }

    await client.query("COMMIT");
    return { invoice, warnings };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ➤ List, optionally filtered by status / supplier_id / purchase_id
export const getAllSupplierInvoices = async ({ status, supplier_id, purchase_id } = {}) => {
  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`si.status = $${values.length}`);
  }
  if (supplier_id) {
    values.push(supplier_id);
    conditions.push(`si.supplier_id = $${values.length}`);
  }
  if (purchase_id) {
    values.push(purchase_id);
    conditions.push(`si.purchase_id = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT si.*, s.name AS supplier_name, sp.lpo_number,
            (si.total - si.amount_paid) AS balance
     FROM supplier_invoices si
     LEFT JOIN suppliers s ON si.supplier_id = s.id
     LEFT JOIN spare_purchases sp ON si.purchase_id = sp.id
     ${where}
     ORDER BY si.created_at DESC`,
    values
  );

  return result.rows;
};

// ➤ Get one invoice with its items + any payments applied to it
export const getSupplierInvoiceById = async (id) => {
  const invoiceResult = await pool.query(
    `SELECT si.*, s.name AS supplier_name, s.phone AS supplier_phone,
            s.email AS supplier_email, s.address AS supplier_address,
            sp.lpo_number,
            (si.total - si.amount_paid) AS balance
     FROM supplier_invoices si
     LEFT JOIN suppliers s ON si.supplier_id = s.id
     LEFT JOIN spare_purchases sp ON si.purchase_id = sp.id
     WHERE si.id = $1`,
    [id]
  );

  const itemsResult = await pool.query(
    `SELECT sii.*, sp.name AS sparepart_name, sp.part_number
     FROM supplier_invoice_items sii
     JOIN spareparts sp ON sii.sparepart_id = sp.id
     WHERE sii.invoice_id = $1
     ORDER BY sii.id`,
    [id]
  );

  const paymentsResult = await pool.query(
    `SELECT spa.amount_allocated, sp.id AS payment_id, sp.payment_date,
            sp.payment_method, sp.reference_number, u.username AS recorded_by_name
     FROM supplier_payment_allocations spa
     JOIN supplier_payments sp ON spa.payment_id = sp.id
     LEFT JOIN users u ON sp.created_by = u.id
     WHERE spa.invoice_id = $1
     ORDER BY sp.payment_date DESC`,
    [id]
  );

  return {
    invoice: invoiceResult.rows[0],
    items: itemsResult.rows,
    payments: paymentsResult.rows,
  };
};

// ➤ Cancel — only if nothing has been paid against it yet. Frees up the
//   quantity_invoiced it claimed so those units can be invoiced again
//   (e.g. you recorded the wrong invoice by mistake).
export const cancelSupplierInvoice = async (id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT * FROM supplier_invoices WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (existing.rows.length === 0) {
      throw new Error("Invoice not found");
    }
    const invoice = existing.rows[0];

    if (invoice.status === "cancelled") {
      throw new Error("Invoice is already cancelled");
    }
    if (Number(invoice.amount_paid) > 0) {
      throw new Error(
        "Cannot cancel an invoice that already has payments applied — reverse the payment(s) first"
      );
    }

    const itemsResult = await client.query(
      `SELECT * FROM supplier_invoice_items WHERE invoice_id = $1`,
      [id]
    );

    for (const item of itemsResult.rows) {
      if (item.purchase_item_id) {
        await client.query(
          `UPDATE spare_purchase_items
           SET quantity_invoiced = quantity_invoiced - $1
           WHERE id = $2`,
          [item.quantity, item.purchase_item_id]
        );
      }
    }

    const updated = await client.query(
      `UPDATE supplier_invoices SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ➤ Outstanding (unpaid/partially_paid) invoices for a supplier — feeds
//   the "pay this supplier" screen where one payment gets split across
//   several invoices.
export const getOutstandingInvoicesForSupplier = async (supplier_id) => {
  const result = await pool.query(
    `SELECT si.*, sp.lpo_number, (si.total - si.amount_paid) AS balance
     FROM supplier_invoices si
     LEFT JOIN spare_purchases sp ON si.purchase_id = sp.id
     WHERE si.supplier_id = $1 AND si.status IN ('unpaid', 'partially_paid')
     ORDER BY si.invoice_date ASC`,
    [supplier_id]
  );

  return result.rows;
};