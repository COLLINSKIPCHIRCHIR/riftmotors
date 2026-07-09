import express from "express";


import {

addJobService,
fetchJobServices,
removeJobService

} from "../controllers/jobServiceController.js";


const router = express.Router();



// add service to job

router.post(
"/",
addJobService
);



// get services belonging to job

router.get(
"/job/:job_id",
fetchJobServices
);



// delete service

router.delete(
"/:id",
removeJobService
);



export default router;