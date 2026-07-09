import pool from "../config/db.js";


export const addJobPart = async(data)=>{


const {
job_id,
sparepart_id,
quantity,
unit_price

}=data;



const total_price =
quantity * unit_price;



const result =
await pool.query(

`
INSERT INTO job_parts
(
job_id,
sparepart_id,
quantity,
unit_price,
total_price
)

VALUES($1,$2,$3,$4,$5)

RETURNING *

`,
[
job_id,
sparepart_id,
quantity,
unit_price,
total_price
]

);


return result.rows[0];


};





export const getJobParts = async(job_id)=>{


const result =
await pool.query(

`

SELECT

jp.id,

jp.quantity,

jp.unit_price,

jp.total_price,


sp.name,

sp.part_number


FROM job_parts jp


JOIN spareparts sp

ON sp.id = jp.sparepart_id


WHERE jp.job_id=$1


ORDER BY jp.id DESC


`,
[job_id]


);


return result.rows;


};





export const deleteJobPart = async(id)=>{


await pool.query(

`
DELETE FROM job_parts

WHERE id=$1

`,
[id]

);


return true;

};