import express from "express";


import {

assignUser,
fetchJobAssignments,
removeAssignment

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

router.delete(
 "/:id",
 removeAssignment
);



export default router;