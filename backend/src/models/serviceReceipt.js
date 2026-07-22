import pool from "../config/db.js";

const generateReceiptNumber = async (client) => {
  const year = new Date().getFullYear();

  const result = await client.query(
    `SELECT COALESCE(MAX(id),0)+1 AS next FROM service_receipts`
  );

  return `RFT-SRV-${year}-${String(result.rows[0].next).padStart(5, "0")}`;
};

export const convertServiceInvoiceToReceipt = async (invoiceId, payment_method, amount_paid) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const invoiceRes = await client.query(
      `SELECT * FROM service_invoices WHERE id=$1 AND status IN ('unpaid','partial')`,
      [invoiceId]
    );

    if (invoiceRes.rows.length === 0) {
      throw new Error("Invoice not found or already fully paid");
    }

    const invoice = invoiceRes.rows[0];

    const balanceBefore = Number(invoice.total) - Number(invoice.amount_paid || 0);
    const payment = Math.min(Number(amount_paid), balanceBefore);

    if (!(payment > 0)) {
      throw new Error("Payment amount must be greater than zero");
    }

    const balanceAfter = balanceBefore - payment;

    const itemsRes = await client.query(
      `SELECT * FROM service_invoice_items WHERE invoice_id=$1`,
      [invoiceId]
    );
    const items = itemsRes.rows;

    const receiptNumber = await generateReceiptNumber(client);

    const receiptRes = await client.query(
      `INSERT INTO service_receipts
        (
        receipt_number,
        invoice_id,
        job_id,
        customer_name,
        customer_phone,
        subtotal,
        discount_type,
        discount_value,
        discount,
        tax_rate,
        tax_amount,
        total,
        payment_method,
        account_balance_before,
        account_balance_after
        )

        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)

        RETURNING *`,
      [
        receiptNumber,
        invoice.id,
        invoice.job_id,
        invoice.customer_name,
        invoice.customer_phone,
        invoice.subtotal,
        invoice.discount_type,
        invoice.discount_value,
        invoice.discount,
        invoice.tax_rate,
        invoice.tax_amount,
        payment,
        payment_method,
        balanceBefore,
        balanceAfter
      ]
    );

    const receiptId = receiptRes.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO service_receipt_items
         (
         receipt_id,
         item_type,
         service_id,
         sparepart_id,
         description,
         quantity,
         unit_price,
         original_price,
         adjustment,
         discount_type,
         discount_value,
         total_price
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          receiptId,
          item.item_type,
          item.service_id,
          item.sparepart_id,
          item.description,
          item.quantity,
          item.unit_price,
          item.original_price,
          item.adjustment,
          item.discount_type,
          item.discount_value,
          item.total_price
        ]
      );
    }

    const newAmountPaid = Number(invoice.amount_paid || 0) + payment;
    const newStatus = balanceAfter <= 0 ? "paid" : "partial";

    await client.query(
      `UPDATE service_invoices SET amount_paid=$1, status=$2 WHERE id=$3`,
      [newAmountPaid, newStatus, invoiceId]
    );

    if (newStatus === "paid") {
      await client.query(
        `UPDATE service_estimates SET status='sold' WHERE id=$1`,
        [invoice.estimate_id]
      );
      await client.query(
        `UPDATE service_jobs SET status='completed' WHERE id=$1`,
        [invoice.job_id]
      );
    }

    await client.query("COMMIT");
    return receiptRes.rows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getServiceReceipts = async () => {
  const result = await pool.query(
    `SELECT * FROM service_receipts ORDER BY created_at DESC`
  );
  return result.rows;
};

/*
  Same LEFT JOIN pattern as getServiceInvoiceById / getServiceEstimateById:
  pulls vehicle details (via service_jobs -> customer_vehicles) and
  customer kra_pin/address/email (via service_jobs -> customers) so the
  receipt shows the same fields the invoice does. All LEFT JOINs, so a job
  with no vehicle attached, or a customer with no kra_pin, still returns
  cleanly - those fields just come back null and the frontend renders "N/A".
*/
export const getServiceReceiptById = async (id) => {
  const receipt = await pool.query(
    `SELECT
        sr.*,

        cv.registration_number,
        cv.make      AS vehicle_make,
        cv.model     AS vehicle_model,
        cv.year      AS vehicle_year,
        cv.mileage,
        cv.color     AS vehicle_color,
        cv.vin_no,
        cv.engine_number,

        c.kra_pin  AS customer_kra_pin,
        c.address  AS customer_address,
        c.email    AS customer_email

     FROM service_receipts sr

     LEFT JOIN service_jobs sj
     ON sr.job_id = sj.id

     LEFT JOIN customer_vehicles cv
     ON sj.vehicle_id = cv.id

     LEFT JOIN customers c
     ON sj.customer_id = c.id

     WHERE sr.id=$1`,
    [id]
  );

  if (receipt.rows.length === 0) {
    return null;
  }

  const items = await pool.query(
    `SELECT * FROM service_receipt_items WHERE receipt_id=$1`,
    [id]
  );

  return {
    ...receipt.rows[0],
    items: items.rows
  };
};