// src/routes/deliveryNoteRoutes.js
import express from "express";
import { createNote, fetchAllNotes, fetchNoteById, checkDeliveryItem } from "../controllers/deliveryNoteController.js";

const router = express.Router();

router.post("/", createNote);
router.get("/", fetchAllNotes);
router.get("/:id", fetchNoteById);
router.patch("/items/:itemId", checkDeliveryItem);

export default router;