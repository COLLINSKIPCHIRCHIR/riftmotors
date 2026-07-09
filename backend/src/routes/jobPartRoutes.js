import express from "express";

import {

createJobPart,
fetchJobParts,
removeJobPart,
editJobPart

} from "../controllers/jobPartController.js";


const router = express.Router();



// add part to job

router.post(
"/",
createJobPart
);



// get parts belonging to job

router.get(
"/job/:jobId",
fetchJobParts
);



// update

router.put(
"/:id",
editJobPart
);



// delete

router.delete(
"/:id",
removeJobPart
);



export default router;