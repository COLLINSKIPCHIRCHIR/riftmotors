import pool from "../config/db.js";

/* =========================================================
   SERVICE LEDGER
========================================================= */

// Who owes an invoice is COALESCE(invoice.bill_to_customer_id, job.customer_id):
// the vehicle owner by default, or whoever was explicitly billed instead
// (e.g. an insurer covering a repair on someone else's car). Payments and
// credit notes carry no billing party of their own — they follow whichever
// invoice they were issued against, via invoice_id, not via job_id.

const getServiceInvoiceRows = async (customer_id, from, to) => {
  const result = await pool.query(
    `
    SELECT
      si.id,
      si.created_at::date AS date,
      'invoice' AS type,
      si.invoice_number AS reference,
      'Service Invoice' AS description,
      si.total AS amount,
      si.total - COALESCE(si.amount_paid,0) - COALESCE(si.amount_credited,0) AS remaining,
      si.due_date,
      si.status
    FROM service_invoices si
    JOIN service_jobs sj ON si.job_id = sj.id
    WHERE COALESCE(si.bill_to_customer_id, sj.customer_id) = $1
      AND si.created_at::date BETWEEN $2 AND $3
    `,
    [customer_id, from, to]
  );
  return result.rows;
};

const getServicePaymentRows = async (customer_id, from, to) => {
  const result = await pool.query(
    `
    SELECT
      sr.id,
      sr.created_at::date AS date,
      'payment' AS type,
      sr.receipt_number AS reference,
      ('Payment' || CASE WHEN sr.payment_method IS NOT NULL THEN ' - ' || sr.payment_method ELSE '' END) AS description,
      -sr.total AS amount
    FROM service_receipts sr
    JOIN service_invoices si ON sr.invoice_id = si.id
    JOIN service_jobs sj ON si.job_id = sj.id
    WHERE COALESCE(si.bill_to_customer_id, sj.customer_id) = $1
      AND sr.created_at::date BETWEEN $2 AND $3
    `,
    [customer_id, from, to]
  );
  return result.rows;
};

const getServiceCreditNoteRows = async (customer_id, from, to) => {
  const result = await pool.query(
    `
    SELECT
      scn.id,
      scn.created_at::date AS date,
      'credit_note' AS type,
      scn.credit_note_number AS reference,
      COALESCE('Credit Note - ' || scn.reason, 'Credit Note') AS description,
      -scn.total AS amount
    FROM service_credit_notes scn
    JOIN service_invoices si ON scn.invoice_id = si.id
    JOIN service_jobs sj ON si.job_id = sj.id
    WHERE COALESCE(si.bill_to_customer_id, sj.customer_id) = $1
      AND scn.created_at::date BETWEEN $2 AND $3
    `,
    [customer_id, from, to]
  );
  return result.rows;
};

const getServiceBalanceBefore = async (customer_id, from) => {
  const result = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS balance FROM (
      SELECT si.total AS amount
      FROM service_invoices si
      JOIN service_jobs sj ON si.job_id = sj.id
      WHERE COALESCE(si.bill_to_customer_id, sj.customer_id) = $1 AND si.created_at::date < $2

      UNION ALL

      SELECT -sr.total AS amount
      FROM service_receipts sr
      JOIN service_invoices si ON sr.invoice_id = si.id
      JOIN service_jobs sj ON si.job_id = sj.id
      WHERE COALESCE(si.bill_to_customer_id, sj.customer_id) = $1 AND sr.created_at::date < $2

      UNION ALL

      SELECT -scn.total AS amount
      FROM service_credit_notes scn
      JOIN service_invoices si ON scn.invoice_id = si.id
      JOIN service_jobs sj ON si.job_id = sj.id
      WHERE COALESCE(si.bill_to_customer_id, sj.customer_id) = $1 AND scn.created_at::date < $2
    ) t
    `,
    [customer_id, from]
  );
  return Number(result.rows[0].balance);
};

/* =========================================================
   SPARE PARTS LEDGER
========================================================= */

const getSparePartsInvoiceRows = async (customer_id, from, to) => {
  const result = await pool.query(
    `
    SELECT
      si.id,
      si.created_at::date AS date,
      'invoice' AS type,
      si.invoice_number AS reference,
      'Spare Parts Invoice' AS description,
      si.total AS amount,
      si.total - COALESCE(si.amount_paid,0) AS remaining,
      si.due_date,
      si.status
    FROM spare_invoices si
    WHERE si.customer_id = $1
      AND si.created_at::date BETWEEN $2 AND $3
    `,
    [customer_id, from, to]
  );
  return result.rows;
};

const getSparePartsPaymentRows = async (customer_id, from, to) => {
  const result = await pool.query(
    `
    SELECT
      ss.id,
      ss.sale_date::date AS date,
      'payment' AS type,
      ss.receipt_number AS reference,
      ('Payment' || CASE WHEN ss.payment_method IS NOT NULL THEN ' - ' || ss.payment_method ELSE '' END) AS description,
      -ss.total AS amount
    FROM spare_sales ss
    WHERE ss.customer_id = $1
      AND ss.sale_date::date BETWEEN $2 AND $3
    `,
    [customer_id, from, to]
  );
  return result.rows;
};

const getSparePartsBalanceBefore = async (customer_id, from) => {
  const result = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS balance FROM (
      SELECT si.total AS amount
      FROM spare_invoices si
      WHERE si.customer_id = $1 AND si.created_at::date < $2

      UNION ALL

      SELECT -ss.total AS amount
      FROM spare_sales ss
      WHERE ss.customer_id = $1 AND ss.sale_date::date < $2
    ) t
    `,
    [customer_id, from]
  );
  return Number(result.rows[0].balance);
};

/* =========================================================
   MERGE + RUNNING BALANCE + AGING
========================================================= */

const AGING_BUCKETS = ["current", "d1_30", "d31_60", "d61_90", "over90"];

const bucketFor = (daysOverdue) => {
  if (daysOverdue <= 0) return "current";
  if (daysOverdue <= 30) return "d1_30";
  if (daysOverdue <= 60) return "d31_60";
  if (daysOverdue <= 90) return "d61_90";
  return "over90";
};

const buildLedger = (openingBalance, entries, asOfDate) => {
  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));

  let balance = Number(openingBalance);
  const rows = sorted.map((e) => {
    balance += Number(e.amount);
    return {
      date: e.date,
      type: e.type,
      reference: e.reference,
      description: e.description,
      amount: Number(e.amount),
      balance,
    };
  });

  const asOf = asOfDate ? new Date(asOfDate) : new Date();
  const aging = Object.fromEntries(AGING_BUCKETS.map((b) => [b, 0]));

  sorted
    .filter((e) => e.type === "invoice" && ["unpaid", "partial"].includes(e.status))
    .forEach((inv) => {
      const remaining = Number(inv.remaining);
      if (!(remaining > 0)) return; // fully settled since — nothing to age
      const due = inv.due_date ? new Date(inv.due_date) : new Date(inv.date);
      const daysOverdue = Math.floor((asOf - due) / (1000 * 60 * 60 * 24));
      aging[bucketFor(daysOverdue)] += remaining;
    });

  return {
    opening_balance: Number(openingBalance),
    rows,
    closing_balance: balance,
    aging,
    total_due: AGING_BUCKETS.reduce((sum, b) => sum + aging[b], 0),
  };
};

/* =========================================================
   PUBLIC API
========================================================= */

// type: 'service' | 'spareparts' | 'both'
export const getCustomerStatement = async (customer_id, from, to, type = "both") => {
  const result = { service: null, spareparts: null };

  if (type === "service" || type === "both") {
    const [invoices, payments, creditNotes, opening] = await Promise.all([
      getServiceInvoiceRows(customer_id, from, to),
      getServicePaymentRows(customer_id, from, to),
      getServiceCreditNoteRows(customer_id, from, to),
      getServiceBalanceBefore(customer_id, from),
    ]);
    result.service = buildLedger(opening, [...invoices, ...payments, ...creditNotes], to);
  }

  if (type === "spareparts" || type === "both") {
    const [invoices, payments, opening] = await Promise.all([
      getSparePartsInvoiceRows(customer_id, from, to),
      getSparePartsPaymentRows(customer_id, from, to),
      getSparePartsBalanceBefore(customer_id, from),
    ]);
    result.spareparts = buildLedger(opening, [...invoices, ...payments], to);
  }

  return result;
};
