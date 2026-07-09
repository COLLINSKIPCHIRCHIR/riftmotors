import pool from "../config/db.js";


export  const recalculateEstimateTotals = async(client, estimate_id)=>{


const items = await client.query(

`
SELECT 
total_price

FROM service_estimate_items

WHERE estimate_id=$1

`,
[
estimate_id
]

);



let subtotal = 0;


items.rows.forEach(item=>{

subtotal += Number(item.total_price);

});





const estimate = await client.query(

`
SELECT

tax_rate,
discount_type,
discount

FROM service_estimates

WHERE id=$1

`,
[
estimate_id
]

);


const data = estimate.rows[0];



const taxAmount =
subtotal * (Number(data.tax_rate)/100);





let discountAmount = 0;



if(data.discount_type==="percentage"){


discountAmount =
subtotal *
(Number(data.discount)/100);


}else{


discountAmount =
Number(data.discount);


}






const total =
subtotal +
taxAmount -
discountAmount;





await client.query(

`

UPDATE service_estimates

SET

subtotal=$1,

tax_amount=$2,

total=$3

WHERE id=$4


`,

[

subtotal,

taxAmount,

total,

estimate_id

]

);



}


// CREATE SERVICE ESTIMATE FROM JOB
export const createServiceEstimate = async(
    {
        job_id,
        discount_type="amount",
        discount=0,
        tax_rate=0
    })=>{


const client = await pool.connect();


try{


await client.query("BEGIN");



// get job customer details

const jobResult = await client.query(

`
SELECT
sj.id,
c.name AS customer_name,
c.phone AS customer_phone

FROM service_jobs sj

LEFT JOIN customers c
ON sj.customer_id = c.id

WHERE sj.id=$1

`,
[job_id]

);



if(jobResult.rows.length===0){

throw new Error("Job not found");

}


const job = jobResult.rows[0];




// get services

const services = await client.query(

`
SELECT

js.service_id,

sc.name,

js.quantity,

js.price,

sc.min_price,

sc.max_price

FROM job_services js


JOIN service_catalog sc

ON js.service_id=sc.id


WHERE js.job_id=$1

`,
[job_id]

);




// get parts

const parts = await client.query(

`
SELECT

jp.sparepart_id,

sp.name,

jp.quantity,

jp.unit_price

FROM job_parts jp


JOIN spareparts sp

ON jp.sparepart_id=sp.id


WHERE jp.job_id=$1

`,
[job_id]

);




let subtotal = 0;




services.rows.forEach(item=>{

subtotal += 
Number(item.price) *
Number(item.quantity);

});


parts.rows.forEach(item=>{

subtotal +=
Number(item.unit_price) *
Number(item.quantity);

});


const taxAmount =
subtotal * (Number(tax_rate)/100);



let discountAmount = 0;



if(discount_type==="percentage"){


discountAmount =
subtotal * (Number(discount)/100);


}else{


discountAmount =
Number(discount);


}




const total =
subtotal +
taxAmount -
discountAmount;




// create estimate


const estimate = await client.query(

`
INSERT INTO service_estimates

(
job_id,
customer_name,
customer_phone,
subtotal,
discount_type,
discount,
tax_rate,
tax_amount,
total,
status

)

VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')


RETURNING *

`,

[

job_id,

job.customer_name,

job.customer_phone,

subtotal,

discount_type,

discount,
tax_rate,
taxAmount,
total

]

);



const estimate_id =
estimate.rows[0].id;





// insert services


for(const service of services.rows){


const originalPrice =
Number(service.price) *
Number(service.quantity);


const adjustment = 0;


const finalPrice =
originalPrice - adjustment;



await client.query(

`
INSERT INTO service_estimate_items

(
estimate_id,
item_type,
service_id,
description,
quantity,
unit_price,
original_price,
adjustment,
total_price,
min_price,
max_price

)

VALUES($1,'service',$2,$3,$4,$5,$6,$7,$8,$9,$10)

`,

[

estimate_id,

service.service_id,

service.name,

service.quantity,

service.price,

originalPrice,

adjustment,

finalPrice,

service.min_price,

service.max_price


]

);


}




// insert parts


for(const part of parts.rows){


const originalPrice =
Number(part.unit_price) *
Number(part.quantity);


const adjustment = 0;


const finalPrice =
originalPrice;


await client.query(

`
INSERT INTO service_estimate_items

(
estimate_id,
item_type,
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

VALUES($1,'sparepart',$2,$3,$4,$5,$6,$7,$8,$9,$10)

`,

[

estimate_id,

part.sparepart_id,

part.name,

part.quantity,

part.unit_price,

originalPrice,

adjustment,

finalPrice,

"amount",

0

]

);


}

await recalculateEstimateTotals(
client,
estimate_id
);


await client.query("COMMIT");


return estimate.rows[0];



}catch(error){


await client.query("ROLLBACK");

throw error;


}finally{


client.release();


}


};






// GET ALL ESTIMATES

export const getServiceEstimates = async()=>{


const result = await pool.query(

`
SELECT *

FROM service_estimates

ORDER BY created_at DESC

`

);


return result.rows;


};








// GET SINGLE ESTIMATE


export const getServiceEstimateById = async(id)=>{


const estimate = await pool.query(

`
SELECT *

FROM service_estimates

WHERE id=$1

`,
[id]

);



if(estimate.rows.length===0){

return null;

}




const items = await pool.query(

`
SELECT *

FROM service_estimate_items

WHERE estimate_id=$1

ORDER BY id

`,
[id]

);




return {


...estimate.rows[0],

items:items.rows


};


};