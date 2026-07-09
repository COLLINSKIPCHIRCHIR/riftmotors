import express from "express";
import { processRefund } from "../controllers/refundController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, processRefund);

export default router;