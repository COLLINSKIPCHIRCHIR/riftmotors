import express from "express";

import {
  createCreditNote,
  getCreditNotes,
  getCreditNote
} from "../controllers/serviceCreditNoteController.js";

const router = express.Router();

router.get("/", getCreditNotes);

router.get("/:id", getCreditNote);

router.post("/", createCreditNote);

export default router;