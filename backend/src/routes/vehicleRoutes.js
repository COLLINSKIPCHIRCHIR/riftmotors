// src/routes/vehicleRoutes.js
import express from "express";
import {
  createVehicle,
  fetchAllVehicles,
  fetchVehicleById,
  editVehicle,
  removeVehicle,
} from "../controllers/vehicleController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ✅ Add a new vehicle (with image upload)
router.post("/add", upload.array("images", 5), createVehicle);

// ✅ Get all vehicles
router.get("/", fetchAllVehicles);

// ✅ Get one vehicle by ID
router.get("/:id", fetchVehicleById);

// ✅ Update vehicle (with image upload)
router.put("/:id", upload.array("images", 5), editVehicle);

// ✅ Delete vehicle
router.delete("/:id", removeVehicle);

export default router;
