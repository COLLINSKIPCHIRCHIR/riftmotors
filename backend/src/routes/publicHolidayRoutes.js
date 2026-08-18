import express from "express";

import {
  addPublicHoliday,
  listPublicHolidays,
  fetchPublicHoliday,
  editPublicHoliday,
  removePublicHoliday,
} from "../controllers/publicHolidayController.js";

const router = express.Router();

// Create
router.post("/", addPublicHoliday);

// Get All
router.get("/", listPublicHolidays);

// Get One
router.get("/:id", fetchPublicHoliday);

// Update
router.put("/:id", editPublicHoliday);

// Delete
router.delete("/:id", removePublicHoliday);

export default router;