import pool from "../config/db.js";


// create mechanic

export const createMechanic = async(data)=>{


const {
name,
phone,
specialization

}=data;



const result = await pool.query(

`
INSERT INTO mechanics
(
name,
phone,
specialization
)

VALUES($1,$2,$3)

RETURNING *

`,

[
name,
phone,
specialization
]

);


return result.rows[0];


};






// get all mechanics

export const getMechanics = async()=>{


const result = await pool.query(

`
SELECT *

FROM mechanics

WHERE active=true

ORDER BY id DESC

`

);


return result.rows;


};






// get single mechanic

export const getMechanicById = async(id)=>{


const result = await pool.query(

`
SELECT *

FROM mechanics

WHERE id=$1

`,

[id]

);


return result.rows[0];


};







// update mechanic

export const updateMechanic = async(id,data)=>{


const {

name,
phone,
specialization

}=data;



const result = await pool.query(

`
UPDATE mechanics

SET

name=$1,
phone=$2,
specialization=$3


WHERE id=$4


RETURNING *

`,

[
name,
phone,
specialization,
id
]

);



return result.rows[0];


};






// delete mechanic

export const deleteMechanic = async(id)=>{


await pool.query(

`
UPDATE mechanics

SET active=false

WHERE id=$1

`,

[id]

);


};