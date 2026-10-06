// src/routes/salesQuoteRoutes.js
import express from "express";
import {
  createSalesQuote,
  fetchAllQuotes,
  fetchQuoteById,
  changeQuoteStatus,
  fetchLastBankDetails,
  changeBankDetails,
} from "../controllers/salesQuoteController.js";

const router = express.Router();

router.post("/", createSalesQuote);
router.get("/", fetchAllQuotes);
router.get("/last-bank-details", fetchLastBankDetails);
router.get("/:id", fetchQuoteById);
router.patch("/:id/status", changeQuoteStatus);
router.patch("/:id/bank-details", changeBankDetails);

export default router;