import express from "express";

import {
  addPayePersonalRelief,
  listPayePersonalReliefs,
  fetchPayePersonalRelief,
  editPayePersonalRelief,
  removePayePersonalRelief,
  currentPayePersonalRelief,
  payePersonalReliefByDate,
} from "../controllers/payePersonalReliefController.js";

const router = express.Router();

// =============================================
// Special Routes
// =============================================

router.get(
  "/current",
  currentPayePersonalRelief
);

router.get(
  "/date/:date",
  payePersonalReliefByDate
);

// =============================================
// CRUD
// =============================================

router.post(
  "/",
  addPayePersonalRelief
);

router.get(
  "/",
  listPayePersonalReliefs
);

router.get(
  "/:id",
  fetchPayePersonalRelief
);

router.put(
  "/:id",
  editPayePersonalRelief
);

router.delete(
  "/:id",
  removePayePersonalRelief
);

export default router;