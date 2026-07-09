import express from "express";


import {

assignUser,
fetchJobAssignments

} from "../controllers/serviceAssignmentController.js";


const router = express.Router();



router.post(
"/",
assignUser
);



router.get(
"/job/:job_id",
fetchJobAssignments
);



export default router;