import express from "express";
import { getStatement, getCustomer360 } from "../controllers/statementController.js";

const router = express.Router();

router.get("/:id/statement", getStatement);

router.get("/:id/360", getCustomer360);


export default router;