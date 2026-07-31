import pool from "../config/db.js";
import { ensureJobEditable } from "../utils/jobGuards.js";


// ADD PART TO JOB
export const addJobPart = async (data) => {
  const { job_id, sparepart_id, customer_supplied, part_name, quantity, unit_price } = data;

  await ensureJobEditable(job_id);

  // CUSTOMER-SUPPLIED: no inventory link, no stock check, no charge.
  // Just a name and a quantity, priced at zero so it never adds to the
  // estimate/invoice total — labour and any other services still bill
  // normally.
  if (customer_supplied) {
    if (!part_name || !part_name.trim()) {
      const err = new Error("Part name is required for a customer-supplied part");
      err.statusCode = 400;
      throw err;
    }

    const result = await pool.query(
      `
      INSERT INTO job_parts
      (job_id, sparepart_id, part_name, customer_supplied, quantity, unit_price, total_price)
      VALUES($1,NULL,$2,true,$3,0,0)
      RETURNING *
      `,
      [job_id, part_name.trim(), quantity]
    );

    return result.rows[0];
  }

  const stockResult = await pool.query(
    `SELECT quantity, buying_price FROM spareparts WHERE id=$1`,
    [sparepart_id]
  );

  if (stockResult.rows.length === 0) {
    const err = new Error("Spare part not found");
    err.statusCode = 404;
    throw err;
  }

  const { buying_price } = stockResult.rows[0];

  const finalPrice = Number(unit_price);

  if (!finalPrice || finalPrice <= 0) {
    const err = new Error("A valid selling price is required");
    err.statusCode = 400;
    throw err;
  }

  if (finalPrice < Number(buying_price)) {
    const err = new Error(
      `Selling price (KES ${finalPrice}) cannot be below buying price (KES ${buying_price})`
    );
    err.statusCode = 400;
    throw err;
  }

  // NOTE: no "insufficient stock" block here anymore. An estimate can
  // always be built regardless of current stock levels - stock is only
  // ever checked/decremented when the estimate is converted to an
  // invoice. The frontend still surfaces a shortage warning for
  // visibility, it just no longer prevents adding the part.

  const total_price = quantity * finalPrice;

  const result = await pool.query(
    `
    INSERT INTO job_parts
    (job_id, sparepart_id, customer_supplied, quantity, unit_price, total_price)
    VALUES($1,$2,false,$3,$4,$5)
    RETURNING *
    `,
    [job_id, sparepart_id, quantity, finalPrice, total_price]
  );

  return result.rows[0];
};


// GET JOB PARTS
export const getJobParts = async(job_id)=>{

const result = await pool.query(
    `
    SELECT
    jp.id,
    jp.quantity,
    jp.unit_price,
    jp.total_price,
    jp.customer_supplied,
    jp.sparepart_id,
    COALESCE(sp.name, jp.part_name) AS name,
    sp.part_number,
    sp.quantity AS available_stock
    FROM job_parts jp
    LEFT JOIN spareparts sp ON jp.sparepart_id = sp.id
    WHERE jp.job_id=$1
    ORDER BY jp.id DESC
    `,
    [job_id]
);

return result.rows;

};


// UPDATE PART
export const updateJobPart = async (id, data) => {
  const existing = await pool.query(
    `SELECT job_id, sparepart_id, customer_supplied FROM job_parts WHERE id=$1`,
    [id]
  );

  if (!existing.rows[0]) {
    const err = new Error("Job part not found");
    err.statusCode = 404;
    throw err;
  }

  await ensureJobEditable(existing.rows[0].job_id);

  const { quantity } = data;

  // Customer-supplied rows have no price to validate - only quantity
  // can change, and total_price stays at zero.
  if (existing.rows[0].customer_supplied) {
    const result = await pool.query(
      `UPDATE job_parts SET quantity=$1 WHERE id=$2 RETURNING *`,
      [quantity, id]
    );
    return result.rows[0];
  }

  const { unit_price } = data;
  const finalPrice = Number(unit_price);

  const partResult = await pool.query(
    `SELECT buying_price FROM spareparts WHERE id=$1`,
    [existing.rows[0].sparepart_id]
  );
  const buying_price = Number(partResult.rows[0]?.buying_price ?? 0);

  if (finalPrice < buying_price) {
    const err = new Error(
      `Selling price (KES ${finalPrice}) cannot be below buying price (KES ${buying_price})`
    );
    err.statusCode = 400;
    throw err;
  }

  const total_price = quantity * finalPrice;

  const result = await pool.query(
    `
    UPDATE job_parts
    SET quantity=$1, unit_price=$2, total_price=$3
    WHERE id=$4
    RETURNING *
    `,
    [quantity, finalPrice, total_price, id]
  );

  return result.rows[0];
};


// DELETE PART
export const deleteJobPart = async(id)=>{

const existing = await pool.query(
    `SELECT job_id FROM job_parts WHERE id=$1`,
    [id]
);

if(!existing.rows[0]){
    return null;
}

await ensureJobEditable(existing.rows[0].job_id);

const result = await pool.query(
    `DELETE FROM job_parts WHERE id=$1 RETURNING *`,
    [id]
);

return result.rows[0];

};