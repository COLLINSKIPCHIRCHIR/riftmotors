import pool from "../config/db.js";


export const createServiceJob = async(data)=>{
const {
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
    (customer_id, vehicle_id, complaint, diagnosis, notes, created_by)
    VALUES($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
    [customer_id, vehicle_id, complaint, diagnosis || null, notes || null, created_by || 1]
);

const job = insertResult.rows[0];
const job_number = "JOB-" + String(job.id).padStart(6, "0");

const updateResult = await pool.query(
    `
    UPDATE service_jobs
    SET job_number=$1
    WHERE id=$2
    RETURNING *
    `,
    [job_number, job.id]
);

return updateResult.rows[0];
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