import {
  createEstimate,
  getEstimateById,
  getAllEstimates
} from "../models/spareEstimateModel.js";
import pool from "../config/db.js"

// ➤ Create Estimate
export const newEstimate = async (req, res) => {
  try {
    const estimate = await createEstimate(req.body);
    res.status(201).json({
      message: "Estimate created successfully",
      estimate,
    });
  } catch (error) {
    next(error);
  }
};

// ➤ Get Estimate
export const fetchEstimate = async (req, res) => {
  try {
    const estimate = await getEstimateById(req.params.id);
    if (!estimate) return res.status(404).json({ message: "Not found" });

    res.json(estimate);
  } catch (error) {
    next(error);
  }
};

// ➤ List Estimates
export const listEstimates = async (req, res, next) => {
  try {
    const { status, customer_name, from, to } = req.query;
    const estimates = await getAllEstimates({ status, customer_name, from, to });
    res.json(estimates);
  } catch (err) {
    next(err);
  }
};


// ➤ Update Estimate
export const updateEstimate = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    // ✅ Check estimate exists
    const existingRes = await client.query(
      "SELECT * FROM spare_estimates WHERE id = $1",
      [id]
    );

    if (existingRes.rows.length === 0) {
      return res.status(404).json({ message: "Estimate not found" });
    }

    const estimate = existingRes.rows[0];

    // ✅ Allow only pending
    if (estimate.status !== "pending") {
      return res.status(400).json({
        message: "Only pending estimates can be edited",
      });
    }

    const {
      customer_id,
      items,
      subtotal,
      discount,
      tax_rate,
      tax_amount,
      total,
    } = req.body;

    await client.query("BEGIN");

    // ✅ Update estimate
      await client.query(
      `
      UPDATE spare_estimates
      SET 
      customer_id=$1,
      subtotal=$2,
      discount=$3,
      tax_rate=$4,
      tax_amount=$5,
      total=$6

      WHERE id=$7
      `,
      [
      customer_id || null,
      subtotal,
      discount,
      tax_rate,
      tax_amount,
      total,
      id
      ]
      );
    // ✅ Delete old items
    await client.query(
      `DELETE FROM spare_estimate_items WHERE estimate_id=$1`,
      [id]
    );

    // ✅ Insert updated items
    for (const item of items) {
      await client.query(
        `INSERT INTO spare_estimate_items
         (estimate_id, sparepart_id, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          id,
          item.sparepart_id,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({ message: "Estimate updated successfully" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating estimate:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

