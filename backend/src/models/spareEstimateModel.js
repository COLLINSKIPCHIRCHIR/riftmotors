import pool from "../config/db.js";




/* =========================
   CREATE ESTIMATE
========================= */
export const createEstimate = async (data) => {
  const {
    customer_name,
    customer_phone,
    items,
    discount = 0
  } = data;

  let subtotal = 0;
  items.forEach(i => {
    subtotal += i.quantity * i.unit_price;
  });

  const taxRate = data.tax_rate || 0;


  const taxAmount =
  subtotal * (Number(taxRate)/100);


  const total =
  subtotal 
  + taxAmount
  - discount;


  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const estimateResult = await client.query(
      `INSERT INTO spare_estimates
       (customer_id, customer_name, customer_phone, subtotal, discount, tax_rate, tax_amount, total, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
       RETURNING *`,
      [data.customer_id || null, customer_name, customer_phone, subtotal, discount, taxRate, taxAmount, total]
    );

    const estimateId = estimateResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO spare_estimate_items
         (estimate_id, sparepart_id, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          estimateId,
          item.sparepart_id,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price
        ]
      );
    }

    await client.query("COMMIT");
    return estimateResult.rows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* =========================
   GET ALL ESTIMATES
========================= */
export const getAllEstimates = async ({ status, customer_name, from, to } = {}) => {
  let conditions = [];
  let values = [];
  let i = 1;

  if (status) {
    conditions.push(`status = $${i++}`);
    values.push(status);
  }

  if (customer_name) {
    conditions.push(`customer_name ILIKE $${i++}`);
    values.push(`%${customer_name}%`);
  }

  if (from) {
    conditions.push(`created_at >= $${i++}`);
    values.push(from);
  }

  if (to) {
    conditions.push(`created_at <= $${i++}`);
    values.push(to);
  }

  const where = conditions.length 
    ? `WHERE ${conditions.join(" AND ")}` 
    : "";

  const result = await pool.query(
    `SELECT * FROM spare_estimates ${where} ORDER BY created_at DESC`,
    values
  );

  return result.rows;
};

/* =========================
   GET ESTIMATE BY ID
========================= */
/* =========================
   GET ESTIMATE BY ID
========================= */
export const getEstimateById = async (estimateId) => {
  // Fetch estimate
  const estimateResult = await pool.query(
    `SELECT *
     FROM spare_estimates
     WHERE id = $1`,
    [estimateId]
  );

  if (estimateResult.rows.length === 0) {
    return null;
  }

  // Fetch items and join spareparts for name & part_number
  const itemsResult = await pool.query(
    `SELECT 
        sei.id AS item_id,
        sei.sparepart_id,
        sei.quantity,
        sei.unit_price,
        sei.total_price AS total,
        sp.name,
        sp.part_number
     FROM spare_estimate_items sei
     JOIN spareparts sp ON sp.id = sei.sparepart_id
     WHERE sei.estimate_id = $1`,
    [estimateId]
  );

  // Map items so frontend can use { name, part_number, quantity, unit_price, total, sparepart_id }
  const items = itemsResult.rows.map((item) => ({
    id: item.item_id,
    sparepart_id: item.sparepart_id,
    name: item.name,
    part_number: item.part_number,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
  }));

  return {
    ...estimateResult.rows[0],
    items,
  };
};

