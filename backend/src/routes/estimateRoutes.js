import express from "express";
import {
  newEstimate,
  fetchEstimate,
  listEstimates,
  updateEstimate
} from "../controllers/estimateController.js";
import { convertEstimate } from "../controllers/spareInvoiceController.js";

import { validateEstimate } from "../validators/estimateValidators.js";
import { validateRequest } from "../middleware/validateRequest.js";


const router = express.Router();

router.post("/create", validateEstimate, validateRequest, newEstimate);
router.get("/", listEstimates);   
router.get("/:id", fetchEstimate);
router.post("/:id/convert", convertEstimate);
router.put("/:id", updateEstimate);

export default router;
