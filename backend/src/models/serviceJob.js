import pool from "../config/db.js";


export const createServiceJob = async(data)=>{


const {
customer_id,
vehicle_id,
complaint,
diagnosis,
notes,
created_by

}=data;


const job_number =
"JOB-" + Date.now();


const result = await pool.query(

`
INSERT INTO service_jobs
(
job_number,
customer_id,
vehicle_id,
complaint,
diagnosis,
notes,
created_by
)

VALUES($1,$2,$3,$4,$5,$6,$7)

RETURNING *

`,

[
job_number,
customer_id,
vehicle_id,
complaint,
diagnosis || null,
notes || null,
created_by || 1
]

);


return result.rows[0];

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