import pool from "../config/db.js";

export const getSalesSummary = async (from, to) => {
  const result = await pool.query(
    `SELECT 
       COUNT(*) AS total_sales,
       COALESCE(SUM(total), 0) AS revenue,
       COALESCE(SUM(discount), 0) AS total_discounts,
       COALESCE(AVG(total), 0) AS avg_sale_value
     FROM spare_sales
     WHERE sale_date BETWEEN $1 AND $2`,
    [from, to]
  );
  return result.rows[0];
};

export const getSalesByDay = async (from, to) => {
  const result = await pool.query(
    `SELECT 
       DATE(sale_date) AS day,
       COUNT(*) AS sales_count,
       COALESCE(SUM(total), 0) AS revenue
     FROM spare_sales
     WHERE sale_date BETWEEN $1 AND $2
     GROUP BY DATE(sale_date)
     ORDER BY day ASC`,
    [from, to]
  );
  return result.rows;
};

export const getTopSellingParts = async (from, to, limit = 10) => {
  const result = await pool.query(
    `SELECT 
       sp.id,
       sp.name,
       sp.part_number,
       SUM(ssi.quantity) AS total_sold,
       SUM(ssi.total_price) AS total_revenue
     FROM spare_sale_items ssi
     JOIN spareparts sp ON sp.id = ssi.sparepart_id
     JOIN spare_sales ss ON ss.id = ssi.sale_id
     WHERE ss.sale_date BETWEEN $1 AND $2
     GROUP BY sp.id, sp.name, sp.part_number
     ORDER BY total_sold DESC
     LIMIT $3`,
    [from, to, limit]
  );
  return result.rows;
};

export const getLowStockAlert = async () => {
  const result = await pool.query(
    `SELECT 
       sp.*,
       COALESCE(s.name, sp.supplier) AS supplier_name
     FROM spareparts sp
     LEFT JOIN suppliers s ON sp.supplier_id = s.id
     WHERE sp.quantity <= 5 
       AND sp.is_deleted IS NOT TRUE
     ORDER BY sp.quantity ASC`
  );
  return result.rows;
};

export const getDashboardStats = async () => {
  const today = new Date().toISOString().split("T")[0];

  const [todaySales, pendingInvoices, lowStock, totalParts] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(total), 0) AS today_revenue, COUNT(*) AS today_sales
       FROM spare_sales WHERE DATE(sale_date) = $1`,
      [today]
    ),
    pool.query(
      `SELECT COUNT(*) AS pending FROM spare_invoices WHERE status='unpaid'`
    ),
    pool.query(
      `SELECT COUNT(*) AS low_stock FROM spareparts 
       WHERE quantity <= 5 AND is_deleted IS NOT TRUE`
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM spareparts WHERE is_deleted IS NOT TRUE`
    ),
  ]);

  return {
    today_revenue: todaySales.rows[0].today_revenue,
    today_sales: todaySales.rows[0].today_sales,
    pending_invoices: pendingInvoices.rows[0].pending,
    low_stock_count: lowStock.rows[0].low_stock,
    total_parts: totalParts.rows[0].total,
  };
};



/* =========================================================
   BUSINESS-WIDE INVOICE REPORT (services + spareparts, all customers)
========================================================= */

const getServiceInvoiceReportRows = async (from, to) => {
  const result = await pool.query(
    `
    SELECT
      si.id,
      'service' AS type,
      si.invoice_number,
      si.customer_name,
      si.created_at::date AS date,
      si.subtotal,
      si.discount,
      si.tax_amount,
      si.total,
      si.status,
      COALESCE(si.amount_paid,0) AS amount_paid,
      si.total - COALESCE(si.amount_paid,0) - COALESCE(si.amount_credited,0) AS balance,
      latest.receipt_number,
      latest.payment_method,
      latest.receipt_date
    FROM service_invoices si
    LEFT JOIN LATERAL (
      SELECT sr.receipt_number, sr.payment_method, sr.created_at AS receipt_date
      FROM service_receipts sr
      WHERE sr.invoice_id = si.id
      ORDER BY sr.created_at DESC
      LIMIT 1
    ) latest ON true
    WHERE si.created_at::date BETWEEN $1 AND $2
    `,
    [from, to]
  );
  return result.rows;
};

const getSparePartsInvoiceReportRows = async (from, to) => {
  const result = await pool.query(
    `
    SELECT
      spi.id,
      'sparepart' AS type,
      spi.invoice_number,
      spi.customer_name,
      spi.created_at::date AS date,
      spi.subtotal,
      spi.discount,
      spi.tax_amount,
      spi.total,
      spi.status,
      COALESCE(spi.amount_paid,0) AS amount_paid,
      spi.total - COALESCE(spi.amount_paid,0) AS balance,
      latest.receipt_number,
      latest.payment_method,
      latest.receipt_date
    FROM spare_invoices spi
    LEFT JOIN LATERAL (
      SELECT ss.receipt_number, ss.payment_method, ss.sale_date AS receipt_date
      FROM spare_sales ss
      WHERE ss.invoice_id = spi.id
      ORDER BY ss.sale_date DESC
      LIMIT 1
    ) latest ON true
    WHERE spi.created_at::date BETWEEN $1 AND $2
    `,
    [from, to]
  );
  return result.rows;
};

// type: 'service' | 'sparepart' | 'both'
export const getBusinessInvoiceReport = async (from, to, type = "both") => {
  let rows = [];

  if (type === "service" || type === "both") {
    rows = rows.concat(await getServiceInvoiceReportRows(from, to));
  }
  if (type === "sparepart" || type === "both") {
    rows = rows.concat(await getSparePartsInvoiceReportRows(from, to));
  }

  rows.sort((a, b) => new Date(b.date) - new Date(a.date));

  const summary = rows.reduce(
    (acc, r) => {
      acc.total_invoiced += Number(r.total);
      acc.total_paid += Number(r.amount_paid);
      acc.total_outstanding += Number(r.balance);
      acc.count += 1;
      return acc;
    },
    { total_invoiced: 0, total_paid: 0, total_outstanding: 0, count: 0 }
  );

  return { rows, summary };
};