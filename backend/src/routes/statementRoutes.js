import express from "express";
import { getStatement } from "../controllers/statementController.js";

const router = express.Router();

router.get("/:id/statement", getStatement);

export default router;