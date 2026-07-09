import {

createAssignment,
getJobAssignments

} from "../models/serviceAssignment.js";





export const assignUser = async(req,res)=>{


try{


const assignment = await createAssignment(req.body);


res.status(201).json({

message:"User assigned successfully",

assignment

});


}catch(error){

console.error(error);


if(error.code==="23505"){

return res.status(400).json({

message:"Mechanic already assigned to this job"

});

}


res.status(500).json({

message:"Failed assigning mechanic"

});

}
};







export const fetchJobAssignments = async(req,res)=>{


try{


const assignments = await getJobAssignments(
req.params.job_id
);



res.json(assignments);



}catch(error){


console.error(error);


res.status(500).json({

message:"Failed fetching assignments"

});


}

};