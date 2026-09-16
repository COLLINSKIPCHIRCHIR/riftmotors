import pool from "../config/db.js";
import { ensureJobEditable } from "../utils/jobGuards.js";

// assign mechanic to job
export const createAssignment = async(data)=>{

const {
    job_id,
    mechanic_id
} = data;

await ensureJobEditable(job_id);

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
JOIN mechanics m ON sa.mechanic_id = m.id
WHERE sa.job_id=$1
ORDER BY sa.assigned_at DESC
`,

[job_id]

);

return result.rows;

};


// remove mechanic from job
export const deleteAssignment = async(assignment_id)=>{

  const existing = await pool.query(
    `
    SELECT job_id
    FROM service_assignments
    WHERE id=$1
    `,
    [assignment_id]
  );

  if(existing.rows.length === 0){

    const error = new Error("Assignment not found");
    error.statusCode = 404;

    throw error;

  }

  const job_id = existing.rows[0].job_id;

  // Do not allow changes to completed jobs
  await ensureJobEditable(job_id);

  const result = await pool.query(
    `
    DELETE FROM service_assignments
    WHERE id=$1
    RETURNING *
    `,
    [assignment_id]
  );

  return result.rows[0];

};