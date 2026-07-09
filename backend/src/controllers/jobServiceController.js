import {
    createJobService,
    getJobServices,
    deleteJobService

} from "../models/jobService.js";





// Add service to job

export const addJobService = async(req,res)=>{


try{


const service =
await createJobService(req.body);


res.status(201).json(service);



}catch(error){


console.log(error);



if(error.code==="23505"){

return res.status(400).json({

message:"Service already added to this job"

});

}



res.status(500).json({

message:"Failed adding service"

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







// Remove service from job

export const removeJobService = async(req,res)=>{


    try{


        const deleted = await deleteJobService(
            req.params.id
        );


        res.json({

            message:"Service removed",
            data:deleted

        });


    }catch(err){


        console.error(err);


        res.status(500).json({

            message:"Failed to delete service"

        });


    }

};