import express from "express";

import {
  addEmployeeContact,
  listEmployeeContacts,
  listEmployeeContactsByEmployee,
  fetchEmployeeContact,
  editEmployeeContact,
  removeEmployeeContact,
} from "../controllers/employeeContactController.js";

const router = express.Router();

router.post("/", addEmployeeContact);

router.get("/", listEmployeeContacts);

router.get("/employee/:employeeId", listEmployeeContactsByEmployee);

router.get("/:id", fetchEmployeeContact);

router.put("/:id", editEmployeeContact);

router.delete("/:id", removeEmployeeContact);

export default router;