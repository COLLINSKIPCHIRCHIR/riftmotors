import express from "express";
import { fetchStockHistory } from "../controllers/stockMovementController.js";

const router = express.Router();

router.get("/:sparepartId", fetchStockHistory);

export default router;
