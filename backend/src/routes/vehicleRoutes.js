// src/routes/vehicleRoutes.js

import express from "express";

import {
  createVehicle,
  fetchAllVehicles,
  fetchVehicleById,
  editVehicle,
  removeVehicle,
  removeVehicleImage,
  makeImagePrimary,
  updateStock,
} from "../controllers/vehicleController.js";

import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();


// Create vehicle
router.post(
  "/add",
  upload.array("images", 10),
  createVehicle
);


// Get all vehicles
router.get(
  "/",
  fetchAllVehicles
);


// Get vehicle by ID
router.get(
  "/:id",
  fetchVehicleById
);


// Update vehicle
router.put(
  "/:id",
  upload.array("images", 10),
  editVehicle
);


// Adjust vehicle stock
router.patch(
  "/:id/stock",
  updateStock
);


// Delete vehicle
router.delete(
  "/:id",
  removeVehicle
);


// Delete vehicle image
router.delete(
  "/:id/images/:imageId",
  removeVehicleImage
);


// Make vehicle image primary
router.patch(
  "/:id/images/:imageId/primary",
  makeImagePrimary
);


export default router;