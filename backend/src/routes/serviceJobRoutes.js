import express from "express";

import {
addServiceJob,
fetchServiceJobs

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



export default router;