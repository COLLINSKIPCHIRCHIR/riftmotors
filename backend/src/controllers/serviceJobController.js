import {
createServiceJob,
getServiceJobs
} from "../models/serviceJob.js";



export const addServiceJob = async(req,res)=>{


try{


const job = await createServiceJob(req.body);


res.status(201).json(job);



}catch(error){

console.error(error);

res.status(500).json({
message:"Failed creating service job"
});

}

};





export const fetchServiceJobs = async(req,res)=>{


try{


const jobs = await getServiceJobs();


res.json(jobs);



}catch(error){

console.error(error);


res.status(500).json({
message:"Failed fetching jobs"
});


}

};