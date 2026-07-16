import pool from "../config/db.js";
import { paginatedQuery } from "../utils/paginate.js";

/* =========================================================
   1️⃣  ADD SPARE PART
   Supports:
   - supplier_id (system supplier)
   - supplier (manual text supplier)
========================================================= */
export const addSparePart = async (data) => {
  const query = `
    INSERT INTO spareparts (
      part_number,
      name,
      category,
      quantity,
      buying_price,
      selling_price,
      discount,
      supplier_id,
      supplier
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;

  const values = [
    data.part_number,
    data.name,
    data.category,
    data.quantity,
    data.buying_price,
    data.selling_price,
    data.discount,
    data.supplier_id || null,  // system supplier
    data.supplier || null      // manual supplier
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};


/* =========================================================
   2️⃣  GET ALL SPARE PARTS
   - Uses COALESCE to show:
     supplier table name OR manual supplier text
   - Excludes soft deleted records
========================================================= */
export const getAllSpareParts = async ({ search, category, page, limit } = {}) => {
  let conditions = ["sp.is_deleted IS NOT TRUE"];
  let values = [];
  let i = 1;

  if (search) {
    conditions.push(
      `(sp.name ILIKE $${i} OR sp.part_number ILIKE $${i})`
    );
    values.push(`%${search}%`);
    i++;
  }

  if (category) {
    conditions.push(`sp.category = $${i++}`);
    values.push(category);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const baseQuery = `
    SELECT 
      sp.*,
      COALESCE(s.name, sp.supplier) AS supplier_name
    FROM spareparts sp
    LEFT JOIN suppliers s ON sp.supplier_id = s.id
    ${where}
    ORDER BY sp.id DESC
  `;

  return paginatedQuery(pool, baseQuery, values, page, limit);
};

/* =========================================================
   3️⃣  GET SINGLE SPARE PART BY ID
========================================================= */
export const getSparePartById = async (id) => {
  const query = `
    SELECT 
      sp.*,
      COALESCE(s.name, sp.supplier) AS supplier_name
    FROM spareparts sp
    LEFT JOIN suppliers s ON sp.supplier_id = s.id
    WHERE sp.id = $1
      AND sp.is_deleted IS NOT TRUE;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};


/* =========================================================
   4️⃣  UPDATE SPARE PART
   Supports hybrid supplier update
========================================================= */
export const updateSparePart = async (id, data) => {
  const query = `
    UPDATE spareparts
    SET part_number = $1,
        name = $2,
        category = $3,
        quantity = $4,
        buying_price = $5,
        selling_price = $6,
        discount = $7,
        supplier_id = $8,
        supplier = $9,
        updated_at = NOW()
    WHERE id = $10
      AND is_deleted IS NOT TRUE
    RETURNING *;
  `;

  const values = [
    data.part_number,
    data.name,
    data.category,
    data.quantity,
    data.buying_price,
    data.selling_price,
    data.discount,
    data.supplier_id || null,
    data.supplier || null,
    id
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};


/* =========================================================
   5️⃣  SOFT DELETE SPARE PART
========================================================= */
export const deleteSparePart = async (id) => {
  const query = `
    UPDATE spareparts
    SET is_deleted = TRUE
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};


/* =========================================================
   6️⃣  LOW STOCK PARTS
========================================================= */
export const getLowStockParts = async () => {
  const query = `
    SELECT 
      sp.*,
      COALESCE(s.name, sp.supplier) AS supplier_name
    FROM spareparts sp
    LEFT JOIN suppliers s ON sp.supplier_id = s.id
    WHERE sp.quantity <= 5
      AND sp.is_deleted IS NOT TRUE
    ORDER BY sp.quantity ASC;
  `;

  const result = await pool.query(query);
  return result.rows;
};


export const getInventoryStats = async () => {
  const query = `
    SELECT
      COUNT(*) AS total_parts,
      COALESCE(SUM(quantity),0) AS total_units,
      COALESCE(SUM(quantity * buying_price),0) AS inventory_value,
      COALESCE(SUM(quantity * selling_price),0) AS potential_sales_value,
      COUNT(*) FILTER (WHERE quantity <= 5) AS low_stock_items,
      COUNT(*) FILTER (WHERE quantity = 0) AS out_of_stock_items
    FROM spareparts
    WHERE is_deleted IS NOT TRUE;
  `;

  const result = await pool.query(query);
  return result.rows[0];
};