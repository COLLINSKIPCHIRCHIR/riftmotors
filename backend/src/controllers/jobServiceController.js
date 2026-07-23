import {
    createJobService,
    getJobServices,
    deleteJobService

} from "../models/jobService.js";





// Add service to job

export const addJobService = async(req,res)=>{
try{
    const service = await createJobService(req.body);
    res.status(201).json(service);
}catch(error){
    console.log(error);

    if(error.code==="23505"){
        return res.status(400).json({ message:"Service already added to this job" });
    }

    res.status(error.statusCode || 500).json({
        message: error.statusCode ? error.message : "Failed adding service"
    });
}
};

export const removeJobService = async(req,res)=>{
try{
    const deleted = await deleteJobService(req.params.id);
    res.json({ message:"Service removed", data:deleted });
}catch(err){
    console.error(err);
    res.status(err.statusCode || 500).json({
        message: err.statusCode ? err.message : "Failed to delete service"
    });
}
};





// Get services of a job

export const fetchJobServices = async(req,res)=>{


    try{


        const services = await getJobServices(
            req.params.job_id
        );


        res.json(services);



    }catch(err){

        console.error(err);

        res.status(500).json({

            message:"Failed to fetch services"

        });

    }


};