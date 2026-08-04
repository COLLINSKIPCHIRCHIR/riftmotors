import express from "express";

import {
  addServiceJob,
  fetchServiceJobs,
  fetchServiceJobById,
  fetchDailyJobReport
} from "../controllers/serviceJobController.js";

const router = express.Router();

router.post("/", addServiceJob);
router.get("/", fetchServiceJobs);

// must come before "/:id"
router.get("/reports/daily", fetchDailyJobReport);

router.get("/:id", fetchServiceJobById);

export default router;