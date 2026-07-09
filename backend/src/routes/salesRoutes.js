// src/routes/salesRoutes.js
import express from "express";
import { createSale, fetchAllSales, fetchSaleById } from "../controllers/salesController.js";

const router = express.Router();

// ✅ Record new sale
router.post("/", createSale);

// ✅ Get all sales
router.get("/", fetchAllSales);

// ✅ Get single sale by ID
router.get("/:id", fetchSaleById);

export default router;
