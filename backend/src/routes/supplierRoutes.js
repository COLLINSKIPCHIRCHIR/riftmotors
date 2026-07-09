import express from "express";
import {
  addSupplier,
  listSuppliers,
  fetchSupplier,
  editSupplier,
  removeSupplier,
} from "../controllers/supplierController.js";

const router = express.Router();

router.post("/", addSupplier);
router.get("/", listSuppliers);
router.get("/:id", fetchSupplier);
router.put("/:id", editSupplier);
router.delete("/:id", removeSupplier);

export default router;
