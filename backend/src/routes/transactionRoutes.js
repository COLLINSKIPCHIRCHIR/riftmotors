// src/routes/transactionRoutes.js
import express from "express";
import {
  newTransaction,
  fetchTransactions,
  fetchTransaction,
} from "../controllers/transactionController.js";

const router = express.Router();

router.post("/create", newTransaction);
router.get("/", fetchTransactions);
router.get("/:id", fetchTransaction);

export default router;
