// src/routes/salesQuoteRoutes.js
import express from "express";
import {
  createSalesQuote,
  fetchAllQuotes,
  fetchQuoteById,
  changeQuoteStatus,
} from "../controllers/salesQuoteController.js";

const router = express.Router();

router.post("/", createSalesQuote);
router.get("/", fetchAllQuotes);
router.get("/:id", fetchQuoteById);
router.patch("/:id/status", changeQuoteStatus);

export default router;