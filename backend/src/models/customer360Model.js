import pool from "../config/db.js";

export const getCustomerVehicleList = async (customer_id) => {
  const result = await pool.query(
    `SELECT * FROM customer_vehicles WHERE customer_id=$1 ORDER BY created_at DESC`,
    [customer_id]
  );
  return result.rows;
};

export const getCustomerServiceJobs = async (customer_id) => {
  const result = await pool.query(
    `
    SELECT
      sj.id, sj.job_number, sj.status, sj.complaint, sj.created_at,
      cv.registration_number, cv.make, cv.model
    FROM service_jobs sj
    JOIN customer_vehicles cv ON sj.vehicle_id = cv.id
    WHERE sj.customer_id=$1
    ORDER BY sj.created_at DESC
    `,
    [customer_id]
  );
  return result.rows;
};

// Jobs done on someone else's vehicle but billed to this customer — e.g.
// an insurer covering repairs on a policyholder's car. Kept separate from
// getCustomerServiceJobs (that customer's own vehicles) since these aren't
// jobs this customer brought in, just ones they're financially responsible
// for.
export const getCustomerBilledJobs = async (customer_id) => {
  const result = await pool.query(
    `
    SELECT
      sj.id, sj.job_number, sj.status, sj.complaint, sj.created_at,
      cv.registration_number, cv.make, cv.model,
      c.name AS vehicle_owner_name
    FROM service_jobs sj
    JOIN customer_vehicles cv ON sj.vehicle_id = cv.id
    JOIN customers c ON sj.customer_id = c.id
    WHERE sj.bill_to_customer_id = $1
      AND sj.customer_id != $1
    ORDER BY sj.created_at DESC
    `,
    [customer_id]
  );
  return result.rows;
};

// Split into separate aggregate queries per metric rather than one query
// joining invoices to receipts/sales — a join there would multiply each
// invoice row by every matching payment row and silently inflate the
// revenue sums. Billing party follows COALESCE(invoice.bill_to_customer_id,
// job.customer_id) — see statementModel.js for the same rule.
export const getCustomerFinancials = async (customer_id) => {
  const [serviceInvoices, serviceLastPayment, sparePartsInvoices, sparePartsLastPayment] =
    await Promise.all([
      pool.query(
        `
        SELECT
          COALESCE(SUM(si.total),0) AS lifetime_revenue,
          COALESCE(SUM(si.total - COALESCE(si.amount_paid,0) - COALESCE(si.amount_credited,0))
            FILTER (WHERE si.status IN ('unpaid','partial')), 0) AS outstanding
        FROM service_invoices si
        JOIN service_jobs sj ON si.job_id = sj.id
        WHERE COALESCE(si.bill_to_customer_id, sj.customer_id) = $1
        `,
        [customer_id]
      ),
      pool.query(
        `
        SELECT MAX(sr.created_at) AS last_payment_date
        FROM service_receipts sr
        JOIN service_invoices si ON sr.invoice_id = si.id
        JOIN service_jobs sj ON si.job_id = sj.id
        WHERE COALESCE(si.bill_to_customer_id, sj.customer_id) = $1
        `,
        [customer_id]
      ),
      pool.query(
        `
        SELECT
          COALESCE(SUM(total),0) AS lifetime_revenue,
          COALESCE(SUM(total - COALESCE(amount_paid,0))
            FILTER (WHERE status IN ('unpaid','partial')), 0) AS outstanding
        FROM spare_invoices
        WHERE customer_id=$1
        `,
        [customer_id]
      ),
      pool.query(
        `SELECT MAX(sale_date) AS last_payment_date FROM spare_sales WHERE customer_id=$1`,
        [customer_id]
      ),
    ]);

  return {
    service: {
      ...serviceInvoices.rows[0],
      last_payment_date: serviceLastPayment.rows[0].last_payment_date,
    },
    spareparts: {
      ...sparePartsInvoices.rows[0],
      last_payment_date: sparePartsLastPayment.rows[0].last_payment_date,
    },
  };
};

// Merged, most-recent-first feed across both divisions' invoices and
// payments — a quick-glance timeline, not the full statement ledger.
export const getCustomerRecentActivity = async (customer_id, limit = 15) => {
  const result = await pool.query(
    `
    SELECT * FROM (
      SELECT si.created_at AS date, 'service_invoice' AS doc_type,
             si.invoice_number AS reference, si.total AS amount, si.status
      FROM service_invoices si
      JOIN service_jobs sj ON si.job_id = sj.id
      WHERE COALESCE(si.bill_to_customer_id, sj.customer_id) = $1

      UNION ALL

      SELECT sr.created_at AS date, 'service_payment' AS doc_type,
             sr.receipt_number AS reference, sr.total AS amount, NULL AS status
      FROM service_receipts sr
      JOIN service_invoices si ON sr.invoice_id = si.id
      JOIN service_jobs sj ON si.job_id = sj.id
      WHERE COALESCE(si.bill_to_customer_id, sj.customer_id) = $1

      UNION ALL

      SELECT si.created_at AS date, 'spare_invoice' AS doc_type,
             si.invoice_number AS reference, si.total AS amount, si.status
      FROM spare_invoices si
      WHERE si.customer_id = $1

      UNION ALL

      SELECT ss.sale_date AS date, 'spare_payment' AS doc_type,
             ss.receipt_number AS reference, ss.total AS amount, NULL AS status
      FROM spare_sales ss
      WHERE ss.customer_id = $1
    ) activity
    ORDER BY date DESC
    LIMIT $2
    `,
    [customer_id, limit]
  );
  return result.rows;
};

export const getCustomerOverview = async (customer_id) => {
  const [vehicles, jobs, billedJobs, financials, activity] = await Promise.all([
    getCustomerVehicleList(customer_id),
    getCustomerServiceJobs(customer_id),
    getCustomerBilledJobs(customer_id),
    getCustomerFinancials(customer_id),
    getCustomerRecentActivity(customer_id),
  ]);

  return { vehicles, jobs, billedJobs, financials, activity };
};