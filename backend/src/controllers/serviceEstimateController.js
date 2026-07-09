import pool from "../config/db.js";
import {

createServiceEstimate,
getServiceEstimates,
getServiceEstimateById,
recalculateEstimateTotals

} from "../models/serviceEstimate.js";





// CREATE

export const createEstimate = async(req,res)=>{


try{


const estimate =
await createServiceEstimate(req.body);


res.json({
estimate
});


}catch(err){

console.error("CREATE ESTIMATE ERROR:", err);

res.status(500).json({
error:err.message
});


}


}






// GET ALL


export const fetchEstimates = async(req,res)=>{


try{


const estimates =
await getServiceEstimates();


res.json(estimates);



}catch(error){


res.status(500).json({

message:error.message

});


}


};







// GET ONE


export const fetchEstimate = async(req,res)=>{


try{


const estimate =
await getServiceEstimateById(
req.params.id
);



if(!estimate){

return res.status(404).json({

message:"Estimate not found"

});

}



res.json(estimate);



}catch(error){


res.status(500).json({

message:error.message

});


}


};


export const updateEstimateItem = async(req,res)=>{


const client = await pool.connect();


try{


await client.query("BEGIN");


const {id}=req.params;


const {
adjustment,
discount_type,
discount_value
}=req.body;



const item = await client.query(

`
SELECT *

FROM service_estimate_items

WHERE id=$1

`,
[id]

);


if(item.rows.length===0){

throw new Error("Item not found");

}


const data=item.rows[0];

const estimateStatus = await client.query(

`
SELECT status
FROM service_estimates
WHERE id=$1
`,
[data.estimate_id]

);


if(
estimateStatus.rows[0].status !== "pending"
){

throw new Error(
"Converted estimates cannot be edited"
);

}



let finalPrice =
Number(data.original_price);



if(data.item_type==="service"){


finalPrice =
Number(data.original_price)
-
Number(adjustment || 0);



if(finalPrice < Number(data.min_price)){


finalPrice =
Number(data.min_price);


}



if(
data.max_price > 0 &&
finalPrice > Number(data.max_price)

){


finalPrice =
Number(data.max_price);


}



await client.query(

`

UPDATE service_estimate_items

SET

adjustment=$1,

total_price=$2

WHERE id=$3


`,

[
adjustment,
finalPrice,
id
]

);


}






if(data.item_type==="sparepart"){


if(discount_type==="percentage"){


finalPrice =
Number(data.original_price)
-
(
Number(data.original_price)
*
(Number(discount_value)/100)
);



}else{


finalPrice =
Number(data.original_price)
-
Number(discount_value);


}




await client.query(

`

UPDATE service_estimate_items

SET

discount_type=$1,

discount_value=$2,

total_price=$3


WHERE id=$4


`,

[
discount_type,
discount_value,
finalPrice,
id

]

);


}



await recalculateEstimateTotals(
client,
data.estimate_id
);



await client.query("COMMIT");



res.json({
message:"Estimate updated"
});


}catch(err){


await client.query("ROLLBACK");


res.status(500).json({
error:err.message
});


}finally{


client.release();


}


}