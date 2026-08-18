import express from "express";

import {
  addBranch,
  listBranches,
  fetchBranch,
  editBranch,
  removeBranch,
} from "../controllers/branchController.js";

const router = express.Router();

router.post("/", addBranch);

router.get("/", listBranches);

router.get("/:id", fetchBranch);

router.put("/:id", editBranch);

router.delete("/:id", removeBranch);

export default router;