import pool from "../config/db.js";
import { recordStockMovement } from "./stockMovementModel.js";


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


export const convertServiceEstimateToInvoice = async(estimateId)=>{


const client = await pool.connect();


try{


await client.query("BEGIN");



const estimateRes =
await client.query(
`
SELECT *
FROM service_estimates
WHERE id=$1
AND status='pending'

`,
[estimateId]
);



if(estimateRes.rows.length===0){

throw new Error(
"Estimate not found or already converted"
);

}


const estimate =
estimateRes.rows[0];



const itemsRes =
await client.query(
`
SELECT *
FROM service_estimate_items
WHERE estimate_id=$1

`,
[estimateId]
);


const items =
itemsRes.rows;



const invoiceNumber =
await generateInvoiceNumber(client);

const taxRate = estimate.tax_rate;

const taxAmount = estimate.tax_amount;

const total = estimate.total;

const invoiceRes =
await client.query(

`

INSERT INTO service_invoices

(
invoice_number,
estimate_id,
job_id,
customer_name,
customer_phone,
subtotal,
discount_type,
discount_value,
discount,
tax_rate,
tax_amount,
total
)


VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)

RETURNING *

`,

[
invoiceNumber,

estimateId,

estimate.job_id,

estimate.customer_name,

estimate.customer_phone,

estimate.subtotal,

estimate.discount_type,

estimate.discount,

estimate.discount,

taxRate,

taxAmount,

total
]

);



const invoiceData = invoiceRes.rows[0];


const invoiceItems = await client.query(
`
SELECT *
FROM service_invoice_items
WHERE invoice_id=$1
`,
[
invoiceId
]
);


invoiceData.items = invoiceItems.rows;


const kraResponse =
await sendInvoiceToKRA(invoiceData);




// move items

for(const item of items){



// only deduct spareparts

if(item.item_type==="sparepart"){



const stock =
await client.query(

`
SELECT quantity
FROM spareparts
WHERE id=$1
FOR UPDATE

`,

[item.sparepart_id]

);



if(stock.rows.length===0){

throw new Error(
"Spare part missing"
)

}



if(stock.rows[0].quantity < item.quantity){

throw new Error(
"Insufficient stock"
)

}



await client.query(

`
UPDATE spareparts

SET quantity = quantity - $1

WHERE id=$2

`,

[
item.quantity,
item.sparepart_id
]

);





await recordStockMovement(

client,

item.sparepart_id,

"OUT",

item.quantity,

"service_invoice",

invoiceId

);


}



await client.query(

`

INSERT INTO service_invoice_items

(
invoice_id,
item_type,
service_id,
sparepart_id,
description,
quantity,
unit_price,
original_price,
adjustment,
total_price,
discount_type,
discount_value

)

VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)

`,

[

invoiceId,

item.item_type,

item.service_id,

item.sparepart_id,

item.description,

item.quantity,

item.unit_price,

item.original_price,

item.adjustment,

item.total_price,

item.discount_type,

item.discount_value

]


);


}





await client.query(

`
UPDATE service_estimates

SET status='invoiced'

WHERE id=$1

`,

[estimateId]

);



await client.query("COMMIT");


return invoiceRes.rows[0];


}catch(err){


await client.query("ROLLBACK");

throw err;


}finally{


client.release();

}


}


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
SELECT *
FROM service_invoices
WHERE id=$1

`,
[id]

);



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

