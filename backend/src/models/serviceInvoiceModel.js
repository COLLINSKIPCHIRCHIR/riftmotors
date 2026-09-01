import pool from "../config/db.js";
import { recordStockMovement } from "./stockMovementModel.js";
import { queryWithDiagnostics } from "../utils/dbDebug.js";

export const createServiceInvoiceTables = async()=>{

const query = `

CREATE TABLE IF NOT EXISTS service_invoices(

id SERIAL PRIMARY KEY,

invoice_number VARCHAR(50) UNIQUE,

estimate_id INTEGER REFERENCES service_estimates(id),

job_id INTEGER REFERENCES service_jobs(id),

customer_name VARCHAR(100),

customer_phone VARCHAR(30),

subtotal NUMERIC DEFAULT 0,

discount_type VARCHAR(20) DEFAULT 'amount',

discount_value NUMERIC DEFAULT 0,

discount NUMERIC DEFAULT 0,

tax_rate NUMERIC DEFAULT 0,

tax_amount NUMERIC DEFAULT 0,

total NUMERIC DEFAULT 0,

status VARCHAR(30) DEFAULT 'unpaid',

created_at TIMESTAMP DEFAULT NOW()

);



CREATE TABLE IF NOT EXISTS service_invoice_items(

id SERIAL PRIMARY KEY,

invoice_id INTEGER REFERENCES service_invoices(id)
ON DELETE CASCADE,


item_type VARCHAR(20),

service_id INTEGER,

sparepart_id INTEGER,


description VARCHAR(200),


quantity INTEGER,

unit_price NUMERIC,

total_price NUMERIC

);


`;

await pool.query(query);

console.log("Service invoice tables ready");

}


const generateInvoiceNumber = async(client)=>{

const year = new Date().getFullYear();


const result =
await client.query(
`
SELECT COALESCE(MAX(id),0)+1 AS next
FROM service_invoices
`
);


return `SRV-${year}-${String(result.rows[0].next).padStart(5,"0")}`;

}


// NOTE ON KRA e-INVOICING:
// KRA submission (sendInvoiceToKRA) isn't built yet. The kra_invoice_number /
// kra_control_number / kra_qr_code / kra_status / kra_response columns on
// service_invoices are already nullable, so we simply leave them NULL for
// now. When the KRA integration exists, insert a call + UPDATE here (right
// after the invoice items are inserted, using invoiceId) rather than before
// items exist like the old broken version did.
export const convertServiceEstimateToInvoice = async (estimateId, overrides = {}) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const estimateRes = await queryWithDiagnostics(
      client,
      "fetch pending estimate",
      `SELECT * FROM service_estimates WHERE id=$1 AND status='pending'`,
      [estimateId]
    );

    if (estimateRes.rows.length === 0) {
      throw new Error("Estimate not found or already converted");
    }

    const estimate = estimateRes.rows[0];

    // Invoice bill-to can differ from the estimate's — e.g. the estimate
    // went to the customer, but the actual invoice bills a company or
    // department instead. Falls back to whatever was on the estimate
    // (which itself already falls back to the customer name/pin) when
    // nothing is provided at conversion time.
    const billToName = overrides.bill_to_name?.trim() || estimate.bill_to_name;
    const billToKraPin = overrides.bill_to_kra_pin?.trim() || estimate.bill_to_kra_pin;

    const itemsRes = await queryWithDiagnostics(
      client,
      "fetch estimate items",
      `SELECT * FROM service_estimate_items WHERE estimate_id=$1`,
      [estimateId]
    );

    const items = itemsRes.rows;

    const invoiceNumber = await generateInvoiceNumber(client);
    const taxRate = estimate.tax_rate;
    const taxAmount = estimate.tax_amount;
    const total = estimate.total;

    const invoiceRes = await queryWithDiagnostics(
  client,
  "insert invoice",
  `
  INSERT INTO service_invoices
(invoice_number, estimate_id, job_id, customer_name, customer_phone,
 driver_name, driver_phone, bill_to_name, bill_to_kra_pin,
 subtotal, discount_type, discount_value, discount, tax_rate, tax_amount, total)
VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
RETURNING *
  `,
  [
  invoiceNumber,
  estimateId,
  estimate.job_id,
  estimate.customer_name,
  estimate.customer_phone,
  estimate.driver_name,
  estimate.driver_phone,
  billToName,
  billToKraPin,
  estimate.subtotal,
  estimate.discount_type,
  estimate.discount,
  estimate.discount,
  taxRate,
  taxAmount,
  total
]
);

    const invoiceId = invoiceRes.rows[0].id;

    for (const item of items) {

  // Keep the real quantity (may be fractional — e.g. 1.5 labour hours)
  // for anything that lands on the invoice or feeds total_price math.
  const quantity = Number(item.quantity);

  if (item.item_type === "sparepart" && !item.customer_supplied && !item.is_custom) {

    // Physical stock only moves in whole units — round ONLY here.
    const stockQuantity = Math.round(quantity);

    const stock = await queryWithDiagnostics(
      client,
      `lock sparepart stock (id=${item.sparepart_id})`,
      `SELECT quantity FROM spareparts WHERE id=$1 FOR UPDATE`,
      [item.sparepart_id]
    );

    if (stock.rows.length === 0) throw new Error("Spare part missing");
    if (stock.rows[0].quantity < stockQuantity) throw new Error("Insufficient stock");

    await queryWithDiagnostics(
      client,
      `deduct sparepart stock (id=${item.sparepart_id})`,
      `UPDATE spareparts SET quantity = quantity - $1 WHERE id=$2`,
      [stockQuantity, item.sparepart_id]
    );

    await recordStockMovement(client, item.sparepart_id, "OUT", stockQuantity, "service_invoice", invoiceId);
  }

  await queryWithDiagnostics(
    client,
    `insert invoice item (estimate_item_id=${item.id})`,
    `
    INSERT INTO service_invoice_items
    (invoice_id, item_type, service_id, sparepart_id, customer_supplied, description,
     quantity, unit_price, original_price, adjustment, total_price,
     discount_type, discount_value)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `,
    [
      invoiceId, item.item_type, item.service_id, item.sparepart_id, item.customer_supplied,
      item.description, quantity, item.unit_price, item.original_price, item.adjustment,
      item.total_price, item.discount_type, item.discount_value
    ]
  );
}

    await queryWithDiagnostics(
      client,
      "mark estimate invoiced",
      `UPDATE service_estimates SET status='invoiced' WHERE id=$1`,
      [estimateId]
    );

    await client.query("COMMIT");

    return invoiceRes.rows[0];

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {

    client.release();

  }

};


export const getServiceInvoices = async()=>{


const result =
await pool.query(

`
SELECT *
FROM service_invoices
ORDER BY created_at DESC

`

);


return result.rows;


}

export const getServiceInvoiceById = async(id)=>{


const invoice =
await pool.query(

`
SELECT

si.*,

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

FROM service_invoices si

LEFT JOIN service_jobs sj
ON si.job_id = sj.id

LEFT JOIN customer_vehicles cv
ON sj.vehicle_id = cv.id

LEFT JOIN customers c
ON sj.customer_id = c.id

WHERE si.id=$1

`,
[id]

);



if(invoice.rows.length===0){

return null;

}



const items =
await pool.query(

`
SELECT *
FROM service_invoice_items
WHERE invoice_id=$1

`,
[id]

);



return {

...invoice.rows[0],

items:items.rows

}


}