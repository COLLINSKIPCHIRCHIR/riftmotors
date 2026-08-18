import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";

import {
  addEmployee,
  listEmployees,
  fetchEmployee,
  editEmployee,
  removeEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

// Upload one image called "photo"
router.post(
  "/",
  (req, res, next) => {
    upload.single("photo")(req, res, (err) => {
      if (err) {
        console.error("MULTER ERROR:", err);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  addEmployee
);

router.get("/", listEmployees);

router.get("/:id", fetchEmployee);

router.put("/:id", upload.single("photo"), editEmployee);

router.delete("/:id", removeEmployee);

export default router;