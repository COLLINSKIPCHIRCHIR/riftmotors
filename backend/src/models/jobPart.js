import pool from "../config/db.js";
import { ensureJobEditable } from "../utils/jobGuards.js";


// ADD PART TO JOB
export const addJobPart = async (data) => {
  const {
    job_id,
    sparepart_id,
    customer_supplied,
    is_custom,
    part_name,
    part_number,
    quantity,
    unit_price
  } = data;

  await ensureJobEditable(job_id);

  // CUSTOMER-SUPPLIED: no inventory link, no stock check, no charge.
  if (customer_supplied) {
    if (!part_name || !part_name.trim()) {
      const err = new Error("Part name is required for a customer-supplied part");
      err.statusCode = 400;
      throw err;
    }

    const result = await pool.query(
      `
      INSERT INTO job_parts
      (job_id, sparepart_id, part_name, customer_supplied, is_custom, quantity, unit_price, total_price)
      VALUES($1,NULL,$2,true,false,$3,0,0)
      RETURNING *
      `,
      [job_id, part_name.trim(), quantity]
    );

    return result.rows[0];
  }

  // CUSTOM / NOT-IN-INVENTORY PART: still billable, no stock link, no
  // buying-price floor to check against since there's no inventory row.
  // Price is OPTIONAL at creation — advisor can add the part now with
  // no price, accountant fills it in later via updateJobPart.
  if (is_custom) {
    if (!part_name || !part_name.trim()) {
      const err = new Error("Enter the part name");
      err.statusCode = 400;
      throw err;
    }

    const qty = Number(quantity) || 1;
    const hasPrice = unit_price !== undefined && unit_price !== null && unit_price !== "";
    const finalPrice = hasPrice ? Number(unit_price) : null;

    if (hasPrice && finalPrice <= 0) {
      const err = new Error("Enter a valid selling price for this part");
      err.statusCode = 400;
      throw err;
    }

    const total_price = finalPrice != null ? qty * finalPrice : 0;

    const result = await pool.query(
      `
      INSERT INTO job_parts
      (job_id, sparepart_id, customer_supplied, is_custom, part_name, part_number, quantity, unit_price, total_price)
      VALUES($1,NULL,false,true,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [job_id, part_name.trim(), part_number ? part_number.trim() : null, qty, finalPrice, total_price]
    );

    return result.rows[0];
  }

  // EXISTING INVENTORY-LINKED FLOW — price is now OPTIONAL at creation
  // too. If provided, still enforced against the buying-price floor.
  // If omitted, the part is added with unit_price=NULL / total_price=0
  // ("awaiting price") until edited later.
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

  const hasPrice = unit_price !== undefined && unit_price !== null && unit_price !== "";
  const finalPrice = hasPrice ? Number(unit_price) : null;

  if (hasPrice) {
    if (finalPrice <= 0) {
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
  }

  const total_price = finalPrice != null ? quantity * finalPrice : 0;

  const result = await pool.query(
    `
    INSERT INTO job_parts
    (job_id, sparepart_id, customer_supplied, is_custom, quantity, unit_price, total_price)
    VALUES($1,$2,false,false,$3,$4,$5)
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
    jp.is_custom,
    jp.sparepart_id,
    COALESCE(sp.name, jp.part_name) AS name,
    COALESCE(sp.part_number, jp.part_number) AS part_number,
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
    `SELECT job_id, sparepart_id, customer_supplied, is_custom FROM job_parts WHERE id=$1`,
    [id]
  );

  if (!existing.rows[0]) {
    const err = new Error("Job part not found");
    err.statusCode = 404;
    throw err;
  }

  await ensureJobEditable(existing.rows[0].job_id);

  const { quantity } = data;

  // Customer-supplied rows have no price to validate.
  if (existing.rows[0].customer_supplied) {
    const result = await pool.query(
      `UPDATE job_parts SET quantity=$1 WHERE id=$2 RETURNING *`,
      [quantity, id]
    );
    return result.rows[0];
  }

  const { unit_price } = data;
  const finalPrice = Number(unit_price);

  // Custom parts have no inventory row, so no buying-price floor to check.
  if (existing.rows[0].is_custom) {
    if (!finalPrice || finalPrice <= 0) {
      const err = new Error("Enter a valid selling price for this part");
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
  }

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