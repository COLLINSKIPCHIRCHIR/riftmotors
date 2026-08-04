import {
createServiceJob,
getServiceJobs,
getServiceJobById,
getDailyJobReport
} from "../models/serviceJob.js";



export const addServiceJob = async(req,res)=>{

try{

const { job_number } = req.body;

if(!job_number || !job_number.trim()){
  return res.status(400).json({
    message:"Job number is required"
  });
}

const job = await createServiceJob(req.body);

res.status(201).json(job);

}catch(error){

console.error(error);

if(error.code === "23505"){
  return res.status(409).json({
    message:"This job number is already in use"
  });
}

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



export const fetchServiceJobById = async(req,res)=>{


try{


const job = await getServiceJobById(req.params.id);


if(!job){

return res.status(404).json({
message:"Job not found"
});

}


res.json(job);



}catch(error){

console.error(error);


res.status(500).json({
message:"Failed fetching job"
});


}

};



export const fetchDailyJobReport = async (req, res) => {

  try {

    const today = new Date().toISOString().split("T")[0];
    const from = req.query.from || today;
    const to = req.query.to || today;

    const rows = await getDailyJobReport(from, to);

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed fetching daily job report"
    });

  }

};