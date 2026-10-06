// src/models/salesQuoteModel.js
import pool from "../config/db.js";

const generateQuoteRef = async (client) => {
  const result = await client.query(
    `UPDATE document_sequences
     SET last_number = last_number + 1
     WHERE doc_type = 'sales_quote'
     RETURNING prefix, last_number;`
  );
  const { prefix, last_number } = result.rows[0];
  return `${prefix}${last_number}`;
};

export const createQuote = async (quoteData) => {
  const {
    vehicle_id,
    customer_id,
    quoted_price,
    trade_in_reg_no,
    trade_in_amount,
    vat_amount,
    registration_fee,
    valid_until,
    created_by,
    quote_ref: manualQuoteRef, // optional manual override
    bank_name,
    bank_account_name,
    bank_account_no,
    bank_branch,
    items,
  } = quoteData;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const quote_ref = manualQuoteRef?.trim()
      ? manualQuoteRef.trim()
      : await generateQuoteRef(client);

    const itemsTotal = (items || []).reduce(
      (sum, it) => sum + Number(it.price) * Number(it.quantity || 1),
      0
    );
    const total_price =
      Number(quoted_price)
      - Number(trade_in_amount || 0)
      + itemsTotal
      + Number(vat_amount || 0)
      + Number(registration_fee || 0);

        const insertQuery = `
          INSERT INTO sales_quotes
            (quote_ref, vehicle_id, customer_id, quoted_price, trade_in_reg_no,
            trade_in_amount, vat_amount, registration_fee, total_price,
            valid_until, status, created_by,
            bank_name, bank_account_name, bank_account_no, bank_branch)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',$11,$12,$13,$14,$15)
          RETURNING *;
        `;
        const values = [
          quote_ref, vehicle_id, customer_id, quoted_price,
          trade_in_reg_no || null, trade_in_amount || 0,
          vat_amount || 0, registration_fee || 0, total_price,
          valid_until || null, created_by || null,
          bank_name?.trim() || null,
          bank_account_name?.trim() || null,
          bank_account_no?.trim() || null,
          bank_branch?.trim() || null,
        ];

    let result;
    try {
      result = await client.query(insertQuery, values);
    } catch (err) {
      if (err.code === "23505") {
        throw new Error(`Quote reference "${quote_ref}" already exists.`);
      }
      throw err;
    }

    const quote = result.rows[0];

    let insertedItems = [];
    if (items && items.length > 0) {
      const itemValues = [];
      const placeholders = items
        .map((it, i) => {
          itemValues.push(quote.id, it.item_name, it.price, it.quantity || 1);
          const base = i * 4;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
        })
        .join(", ");

      const itemsResult = await client.query(
        `INSERT INTO sales_quote_items (quote_id, item_name, price, quantity)
         VALUES ${placeholders} RETURNING *;`,
        itemValues
      );
      insertedItems = itemsResult.rows;
    }

    await client.query("COMMIT");
    return { ...quote, items: insertedItems };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getAllQuotes = async () => {
  const query = `
    SELECT q.*, v.make, v.model, v.year, v.chassis_no, c.name AS customer_name, c.phone AS customer_phone
    FROM sales_quotes q
    JOIN vehicles v ON q.vehicle_id = v.id
    JOIN customers c ON q.customer_id = c.id
    ORDER BY q.created_at DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};


export const getQuoteById = async (id) => {
  const query = `
    SELECT q.*,
           v.make, v.model, v.model_code, v.year, v.condition,
           v.chassis_no, v.color, v.mileage, v.transmission, v.fuel_type,
           v.engine_rating, v.max_power, v.max_torque, v.braking,
           v.seating_capacity, v.fuel_tank_litres, v.suspension, v.tyre_size,
           v.warranty_text, v.free_service_text,
           c.name AS customer_name,
           c.phone AS customer_phone,
           c.email AS customer_email,
           c.address AS customer_address,
           vi.image_url AS vehicle_image_url
    FROM sales_quotes q
    JOIN vehicles v ON q.vehicle_id = v.id
    JOIN customers c ON q.customer_id = c.id
    LEFT JOIN vehicle_images vi ON vi.vehicle_id = v.id AND vi.is_primary = true
    WHERE q.id = $1;
  `;

  const result = await pool.query(query, [id]);
  const quote = result.rows[0];

  if (!quote) return null;

  const itemsResult = await pool.query(
    `SELECT * FROM sales_quote_items WHERE quote_id = $1 ORDER BY id ASC`,
    [id]
  );

  quote.items = itemsResult.rows;

  return quote;
};


export const updateQuoteStatus = async (id, status) => {
  const validStatuses = ["pending", "accepted", "expired", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid quote status");
  }
  const result = await pool.query(
    `UPDATE sales_quotes SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0];
};


export const getLastBankDetails = async () => {
  const result = await pool.query(
    `SELECT bank_name, bank_account_name, bank_account_no, bank_branch
     FROM sales_quotes
     WHERE bank_name IS NOT NULL OR bank_account_no IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 1;`
  );
  return result.rows[0] || null;
};


export const updateQuoteBankDetails = async (id, details) => {
  const existing = await pool.query(
    `SELECT status FROM sales_quotes WHERE id = $1`,
    [id]
  );
  if (existing.rows.length === 0) return null;
  if (existing.rows[0].status !== "pending") {
    throw new Error("Bank details can only be edited on pending quotes");
  }

  const { bank_name, bank_account_name, bank_account_no, bank_branch } = details;

  const result = await pool.query(
    `UPDATE sales_quotes
     SET bank_name = $1, bank_account_name = $2,
         bank_account_no = $3, bank_branch = $4
     WHERE id = $5
     RETURNING *`,
    [
      bank_name?.trim() || null,
      bank_account_name?.trim() || null,
      bank_account_no?.trim() || null,
      bank_branch?.trim() || null,
      id,
    ]
  );
  return result.rows[0];
};