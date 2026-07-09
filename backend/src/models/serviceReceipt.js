import pool from "../config/db.js";


const generateReceiptNumber = async(client)=>{

const year = new Date().getFullYear();


const result = await client.query(
`
SELECT COALESCE(MAX(id),0)+1 AS next
FROM service_receipts
`
);


return `RFT-SRV-${year}-${String(result.rows[0].next).padStart(5,"0")}`;

};





export const convertServiceInvoiceToReceipt = async(
invoiceId,
payment_method
)=>{


const client = await pool.connect();


try{


await client.query("BEGIN");



// get invoice

const invoiceRes =
await client.query(

`
SELECT *
FROM service_invoices
WHERE id=$1
AND status='unpaid'

`,
[invoiceId]

);



if(invoiceRes.rows.length===0){

throw new Error(
"Invoice not found or already paid"
);

}



const invoice =
invoiceRes.rows[0];




// get invoice items

const itemsRes =
await client.query(

`
SELECT *
FROM service_invoice_items
WHERE invoice_id=$1

`,
[invoiceId]

);


const items =
itemsRes.rows;



const receiptNumber =
await generateReceiptNumber(client);





// create receipt

const receiptRes =
await client.query(

`

INSERT INTO service_receipts

(
receipt_number,
invoice_id,
job_id,
customer_name,
customer_phone,
subtotal,
discount,
tax_rate,
tax_amount,
total,
payment_method

)

VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)

RETURNING *

`,

[

receiptNumber,

invoice.id,

invoice.job_id,

invoice.customer_name,

invoice.customer_phone,

invoice.subtotal,

invoice.discount,

invoice.tax_rate,

invoice.tax_amount,

invoice.total,

payment_method

]

);



const receiptId =
receiptRes.rows[0].id;






// copy items

for(const item of items){


await client.query(

`

INSERT INTO service_receipt_items

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

VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)

`,

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





// update invoice

await client.query(

`

UPDATE service_invoices

SET status='paid'

WHERE id=$1

`,

[invoiceId]

);






// update estimate

await client.query(

`

UPDATE service_estimates

SET status='sold'

WHERE id=$1

`,

[invoice.estimate_id]

);


await client.query(
`
UPDATE service_jobs
SET status='completed'
WHERE id=$1
`,
[
invoice.job_id
]
);





await client.query("COMMIT");


return receiptRes.rows[0];



}catch(err){


await client.query("ROLLBACK");

throw err;


}finally{


client.release();

}


}









export const getServiceReceipts = async()=>{


const result =
await pool.query(

`
SELECT *
FROM service_receipts
ORDER BY created_at DESC

`

);


return result.rows;


};







export const getServiceReceiptById = async(id)=>{


const receipt =
await pool.query(

`

SELECT *
FROM service_receipts
WHERE id=$1

`,
[id]

);



if(receipt.rows.length===0){

return null;

}




const items =
await pool.query(

`

SELECT *
FROM service_receipt_items
WHERE receipt_id=$1

`,
[id]

);





return {

...receipt.rows[0],

items:items.rows

};


};