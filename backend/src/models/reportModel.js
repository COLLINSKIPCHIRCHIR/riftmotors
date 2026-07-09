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