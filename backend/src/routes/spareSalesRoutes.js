import express from "express";
import {
  createSpareSale,
  fetchAllSpareSales,
  fetchSpareSaleReceipt
} from "../controllers/spareSalesController.js";

const router = express.Router();

router.post("/", createSpareSale);
router.get("/", fetchAllSpareSales);
router.get("/:id/receipt", fetchSpareSaleReceipt);

export default router;