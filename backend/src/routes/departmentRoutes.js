import express from "express";
import {
  addDepartment,
  listDepartments,
  fetchDepartment,
  editDepartment,
  removeDepartment,
} from "../controllers/departmentController.js";

const router = express.Router();

router.post("/", addDepartment);

router.get("/", listDepartments);

router.get("/:id", fetchDepartment);

router.put("/:id", editDepartment);

router.delete("/:id", removeDepartment);

export default router;