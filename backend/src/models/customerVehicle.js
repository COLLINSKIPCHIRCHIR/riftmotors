import pool from "../config/db.js";


export const createCustomerVehicle = async (data) => {
  const {
    customer_id,
    registration_number,
    make,
    model,
    year,
    mileage,
    color,
    fuel_type,
    transmission,
    vin_no,
    engine_number
  } = data;

  const result = await pool.query(
    `
    INSERT INTO customer_vehicles
    (customer_id, registration_number, make, model, year, mileage, color, fuel_type, transmission, vin_no, engine_number)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *
    `,
    [
      customer_id,
      registration_number,
      make || null,
      model || null,
      year === "" ? null : year,       // <-- this was the crash
      mileage,
      color || null,
      fuel_type || null,
      transmission || null,
      vin_no,
      engine_number
    ]
  );

  return result.rows[0];
};

// NOTE: SELECT * already picks up vin_no / engine_number automatically
// now that the columns exist on customer_vehicles - no change needed here.
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