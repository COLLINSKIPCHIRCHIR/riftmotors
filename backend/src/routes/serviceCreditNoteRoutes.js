import express from "express";

import {
  createCreditNote,
  getCreditNotes,
  getCreditNote,
  updateCreditNote
} from "../controllers/serviceCreditNoteController.js";

const router = express.Router();

router.get("/", getCreditNotes);

router.get("/:id", getCreditNote);

router.put("/:id", updateCreditNote);

router.post("/", createCreditNote);

export default router;