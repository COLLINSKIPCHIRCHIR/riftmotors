import express from "express";

import {
addServiceJob,
fetchServiceJobs,
fetchServiceJobById

} from "../controllers/serviceJobController.js";


const router = express.Router();



router.post(
"/",
addServiceJob
);



router.get(
"/",
fetchServiceJobs
);



router.get(
"/:id",
fetchServiceJobById
);



export default router;