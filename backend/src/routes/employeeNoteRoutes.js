import express from "express";

import {
  addEmployeeNote,
  listEmployeeNotes,
  listEmployeeNotesByEmployee,
  fetchEmployeeNote,
  editEmployeeNote,
  removeEmployeeNote,
} from "../controllers/employeeNoteController.js";

const router = express.Router();

router.post("/", addEmployeeNote);

router.get("/", listEmployeeNotes);

router.get(
  "/employee/:employeeId",
  listEmployeeNotesByEmployee
);

router.get("/:id", fetchEmployeeNote);

router.put("/:id", editEmployeeNote);

router.delete("/:id", removeEmployeeNote);

export default router;