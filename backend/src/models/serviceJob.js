import pool from "../config/db.js";


export const createServiceJob = async(data)=>{
const {
    job_number,
    customer_id,
    vehicle_id,
    complaint,
    diagnosis,
    notes,
    created_by
} = data;

const insertResult = await pool.query(
    `
    INSERT INTO service_jobs
    (job_number, customer_id, vehicle_id, complaint, diagnosis, notes, created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
    `,
    [job_number, customer_id, vehicle_id, complaint, diagnosis || null, notes || null, created_by || 1]
);

return insertResult.rows[0];
};





export const getServiceJobs = async()=>{


const result = await pool.query(`

SELECT 

sj.*,

c.name AS customer_name,

cv.registration_number,

cv.make,

cv.model


FROM service_jobs sj


JOIN customers c
ON sj.customer_id = c.id


JOIN customer_vehicles cv
ON sj.vehicle_id = cv.id


ORDER BY sj.created_at DESC

`);


return result.rows;

};


// GET SINGLE JOB
// Same join pattern as getServiceEstimateById in serviceEstimate.js - one
// round trip returns the job plus everything JobDetails needs to render
// the customer/vehicle panels, instead of the frontend fetching every
// job and finding this one client-side.
export const getServiceJobById = async (id) => {

  const result = await pool.query(
    `
    SELECT

    sj.*,

    c.name          AS customer_name,
    c.phone         AS customer_phone,
    c.email         AS customer_email,
    c.address       AS customer_address,
    c.kra_pin       AS customer_kra_pin,

    cv.registration_number,
    cv.make,
    cv.model,
    cv.year         AS vehicle_year,
    cv.mileage,
    cv.color        AS vehicle_color,
    cv.vin_no,
    cv.engine_number

    FROM service_jobs sj

    JOIN customers c
    ON sj.customer_id = c.id

    JOIN customer_vehicles cv
    ON sj.vehicle_id = cv.id

    WHERE sj.id=$1

    `,
    [id]
  );

  if (result.rows.length === 0) {

    return null;

  }

  return result.rows[0];

};