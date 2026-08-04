import express from "express";

import {

    addJobService,
    fetchJobServices,
    removeJobService,
    updateJobServiceCompletion

} from "../controllers/jobServiceController.js";

const router = express.Router();

router.post("/", addJobService);
router.get("/job/:job_id", fetchJobServices);

// mark a service done / pending
router.patch("/:id/completion", updateJobServiceCompletion);

router.delete("/:id", removeJobService);

export default router;