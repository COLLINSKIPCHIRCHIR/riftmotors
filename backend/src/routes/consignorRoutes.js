// src/routes/consignorRoutes.js
import express from "express";
import { addConsignor, fetchConsignors, editConsignor, removeConsignor } from "../controllers/consignorController.js";

const router = express.Router();

router.post("/", addConsignor);
router.get("/", fetchConsignors);
router.put("/:id", editConsignor);
router.delete("/:id", removeConsignor);

export default router;