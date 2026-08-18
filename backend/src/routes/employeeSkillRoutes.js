import express from "express";

import {
  addEmployeeSkill,
  listEmployeeSkills,
  listEmployeeSkillsByEmployee,
  fetchEmployeeSkill,
  editEmployeeSkill,
  removeEmployeeSkill,
} from "../controllers/employeeSkillController.js";

const router = express.Router();

router.post("/", addEmployeeSkill);

router.get("/", listEmployeeSkills);

router.get(
  "/employee/:employeeId",
  listEmployeeSkillsByEmployee
);

router.get("/:id", fetchEmployeeSkill);

router.put("/:id", editEmployeeSkill);

router.delete("/:id", removeEmployeeSkill);

export default router;