import express from "express";
import {
  newCustomer,
  listCustomers,
  fetchCustomer,
  editCustomer,
  deleteCustomer
} from "../controllers/customerController.js";

const router = express.Router();

router.post("/", newCustomer);
router.get("/", listCustomers);
router.get("/:id", fetchCustomer);
router.put("/:id", editCustomer);
router.delete("/:id", deleteCustomer);

export default router;
