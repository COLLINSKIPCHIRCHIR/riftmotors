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

  if (!items || items.length === 0) {
    const err = new Error("Estimate must have at least one item");
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch buying_price for every sparepart in the cart in one query,
    // then validate each item's unit_price against it before anything
    // gets inserted. This is the real enforcement point — the frontend
    // check is just UX, this is what actually stops underpriced sales,
    // whether they come from SellSpareParts.jsx, a future screen, or a
    // direct API call.
    const sparepartIds = items.map(i => i.sparepart_id);

    const stockResult = await client.query(
      `SELECT id, buying_price, quantity FROM spareparts WHERE id = ANY($1::int[])`,
      [sparepartIds]
    );

    const stockById = {};
    stockResult.rows.forEach(row => {
      stockById[row.id] = row;
    });

    for (const item of items) {
      const stock = stockById[item.sparepart_id];

      if (!stock) {
        const err = new Error(`Spare part ${item.sparepart_id} not found`);
        err.statusCode = 404;
        throw err;
      }

      if (Number(item.quantity) > Number(stock.quantity)) {
        const err = new Error(
          `Insufficient stock for one of the items. Available: ${stock.quantity}`
        );
        err.statusCode = 400;
        throw err;
      }

      const price = Number(item.unit_price);

      if (!price || price <= 0) {
        const err = new Error("Every item needs a valid selling price");
        err.statusCode = 400;
        throw err;
      }

      if (price < Number(stock.buying_price)) {
        const err = new Error(
          `Selling price (KES ${price}) cannot be below buying price (KES ${stock.buying_price}) for one of the items`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    let subtotal = 0;
    items.forEach(i => {
      subtotal += i.quantity * i.unit_price;
    });

    const taxRate = data.tax_rate || 0;

    const taxAmount =
      subtotal * (Number(taxRate) / 100);

    const total =
      subtotal
      + taxAmount
      - discount;

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
   Now left-joins customers so we can pull kra_pin/address/email
   when customer_id is set. Uses LEFT JOIN + COALESCE so legacy
   rows with no customer_id (or walk-in customers) still work fine -
   they just fall back to the plain text columns on the estimate itself.
========================= */
export const getEstimateById = async (estimateId) => {
  const estimateResult = await pool.query(
    `SELECT
        se.*,
        COALESCE(c.name, se.customer_name)   AS customer_name,
        COALESCE(c.phone, se.customer_phone) AS customer_phone,
        c.kra_pin  AS customer_kra_pin,
        c.address  AS customer_address,
        c.email    AS customer_email
     FROM spare_estimates se
     LEFT JOIN customers c ON c.id = se.customer_id
     WHERE se.id = $1`,
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