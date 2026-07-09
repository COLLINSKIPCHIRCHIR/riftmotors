// src/routes/inventoryRoutes.js
import express from "express";
import { getAllInventory } from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/", getAllInventory);

export default router;
