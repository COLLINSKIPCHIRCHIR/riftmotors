import express from "express";
import { documentUpload } from "../middleware/documentUploadMiddleware.js";

import {
  addEmployeeDocument,
  listEmployeeDocuments,
  listEmployeeDocumentsByEmployee,
  fetchEmployeeDocument,
  editEmployeeDocument,
  removeEmployeeDocument,
} from "../controllers/employeeDocumentController.js";

const router = express.Router();

router.post(
  "/",
  (req, res, next) => {
    documentUpload.single("document")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          message: err.message,
        });
      }

      next();
    });
  },
  addEmployeeDocument
);

router.get("/", listEmployeeDocuments);

router.get("/employee/:employeeId", listEmployeeDocumentsByEmployee);

router.get("/:id", fetchEmployeeDocument);

router.put(
  "/:id",
  documentUpload.single("document"),
  editEmployeeDocument
);

router.delete("/:id", removeEmployeeDocument);

export default router;