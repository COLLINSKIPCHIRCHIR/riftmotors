import {

addJobPart,
getJobParts,
deleteJobPart,
updateJobPart

} from "../models/jobPart.js";




// Add

export const createJobPart = async(req,res)=>{


try{


const part = await addJobPart(req.body);


res.status(201).json({

message:"Part added to job",

part

});


}

catch(error){

res.status(500).json({

message:error.message

});

}


};







// Get parts for job

export const fetchJobParts = async(req,res)=>{


try{


const parts = await getJobParts(req.params.jobId);


res.json(parts);


}

catch(error){

res.status(500).json({

message:error.message

});

}


};







// Delete

export const removeJobPart = async(req,res)=>{


try{


const deleted = await deleteJobPart(req.params.id);


res.json({

message:"Removed",

deleted

});


}

catch(error){

res.status(500).json({

message:error.message

});

}


};







// Update

export const editJobPart = async(req,res)=>{


try{


const updated = await updateJobPart(

req.params.id,

req.body

);



res.json({

message:"Updated",

updated

});


}

catch(error){

res.status(500).json({

message:error.message

});

}


};