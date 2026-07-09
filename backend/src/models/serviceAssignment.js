import pool from "../config/db.js";


// assign mechanic to job
export const createAssignment = async(data)=>{


const {
job_id,
mechanic_id

}=data;



const result = await pool.query(

`
INSERT INTO service_assignments
(
job_id,
mechanic_id
)

VALUES($1,$2)

RETURNING *

`,

[
job_id,
mechanic_id
]

);



return result.rows[0];

};







// get assignments for a job

export const getJobAssignments = async(job_id)=>{


const result = await pool.query(

`

SELECT

sa.id,

sa.job_id,

sa.assigned_at,


m.id AS mechanic_id,

m.name,

m.phone,

m.specialization



FROM service_assignments sa


JOIN mechanics m

ON sa.mechanic_id = m.id


WHERE sa.job_id=$1


ORDER BY sa.assigned_at DESC


`,

[job_id]

);



return result.rows;


};