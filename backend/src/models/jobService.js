import pool from "../config/db.js";


// Create service attached to a job
export const createJobService = async(data)=>{


const {
job_id,
service_id,
quantity,
price
}=data;



const result = await pool.query(

`

INSERT INTO job_services
(
job_id,
service_id,
quantity,
price
)

VALUES($1,$2,$3,$4)


ON CONFLICT(job_id,service_id)

DO UPDATE SET

quantity = job_services.quantity + EXCLUDED.quantity


RETURNING *

`,


[
job_id,
service_id,
quantity || 1,
price
]


);


return result.rows[0];


};





// Get services for one job
export const getJobServices = async(job_id)=>{


    const result = await pool.query(

        `
        SELECT 
        js.*,

        sc.name AS service_name,
        sc.description


        FROM job_services js


        JOIN service_catalog sc
        ON js.service_id = sc.id


        WHERE js.job_id=$1


        ORDER BY js.id DESC

        `,

        [job_id]

    );


    return result.rows;

};






// Delete service from job
export const deleteJobService = async(id)=>{


    const result = await pool.query(

        `
        DELETE FROM job_services

        WHERE id=$1

        RETURNING *

        `,

        [id]

    );


    return result.rows[0];

};