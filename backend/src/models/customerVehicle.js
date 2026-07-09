import pool from "../config/db.js";


export const createCustomerVehicle = async(data)=>{

const {
customer_id,
registration_number,
make,
model,
year,
mileage,
color,
fuel_type,
transmission

}=data;


const result = await pool.query(

`
INSERT INTO customer_vehicles
(
customer_id,
registration_number,
make,
model,
year,
mileage,
color,
fuel_type,
transmission
)

VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)

RETURNING *
`,

[
customer_id,
registration_number,
make,
model,
year,
mileage,
color,
fuel_type,
transmission
]

);


return result.rows[0];

}


export const getCustomerVehicles = async()=>{


const result = await pool.query(`

SELECT 
customer_vehicles.*,
customers.name,
customers.phone

FROM customer_vehicles

LEFT JOIN customers
ON customer_vehicles.customer_id = customers.id

ORDER BY customer_vehicles.id DESC


`);


return result.rows;


}


export const getCustomerVehicleById = async(id)=>{


const result = await pool.query(`

SELECT

customer_vehicles.*,

customers.name,
customers.phone,
customers.email


FROM customer_vehicles


LEFT JOIN customers

ON customer_vehicles.customer_id = customers.id


WHERE customer_vehicles.id=$1


`,
[id]
);



return result.rows[0];


}