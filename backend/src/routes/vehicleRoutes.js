// src/routes/vehicleRoutes.js

import express from "express";
import multer from "multer";

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

import { compressImages } from "../middleware/compressImages.js";

const router = express.Router();


// Handle vehicle image upload errors
const uploadImages = (req, res, next) => {
  upload.array("images", 10)(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: "One of the images is too large.",
        LIMIT_FILE_COUNT: "Too many images. The maximum is 10.",
        LIMIT_UNEXPECTED_FILE: `Unexpected file field "${err.field}". Images must be sent as "images".`,
      };

      return res.status(400).json({
        error: messages[err.code] || `Upload error: ${err.message}`,
      });
    }

    console.error("❌ Upload error:", err);

    return res.status(400).json({
      error: `Image upload failed: ${err.message}`,
    });
  });
};


// Create vehicle
router.post(
  "/add",
  uploadImages,
  compressImages,
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
  uploadImages,
  compressImages,
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