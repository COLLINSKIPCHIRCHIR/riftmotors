// src/controllers/vehicleController.js
import fs from "fs/promises";
import path from "path";
import {
  addVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  adjustVehicleStock,
} from "../models/vehicleModel.js";

import {
  addVehicleImages,
  deleteVehicleImage,
  setPrimaryImage,
} from "../models/vehicleImageModel.js";

import pool from "../config/db.js";


/*
|--------------------------------------------------------------------------
| Database Error Helper
|--------------------------------------------------------------------------
*/

const describeVehicleError = (error) => {
  switch (error.code) {
    case "23505":
      return {
        status: 409,
        message: `Duplicate value: ${
          error.detail || error.constraint
        }. A vehicle with this chassis/registration number may already exist.`,
      };

    case "23502":
      return {
        status: 400,
        message: `Missing required field: "${error.column}".`,
      };

    case "23503":
      return {
        status: 400,
        message: "The selected consignor does not exist.",
      };

    case "22P02":
      return {
        status: 400,
        message: `A field has an invalid format (${error.message}). Check the number and date fields.`,
      };

    case "22003":
      return {
        status: 400,
        message: "A number is too large for its field.",
      };

    case "42703":
      return {
        status: 500,
        message: `Database is missing a column (${error.message}). Run the latest migration on this server.`,
      };

    case "42P01":
      return {
        status: 500,
        message: `Database table missing (${error.message}).`,
      };

    case "EACCES":
    case "ENOENT":
      return {
        status: 500,
        message:
          "The server cannot write to the uploads folder. Check folder permissions.",
      };

    default:
      return {
        status: 500,
        message:
          "Server error while saving the vehicle. Check the server logs.",
      };
  }
};


/*
|--------------------------------------------------------------------------
| Create Vehicle
|--------------------------------------------------------------------------
*/

export const createVehicle = async (req, res) => {
  const client = await pool.connect();

  try {
    const vehicleData = req.body;

    if (
      !vehicleData.make ||
      !vehicleData.model ||
      !vehicleData.selling_price
    ) {
      return res.status(400).json({
        error: "Make, model, and selling price are required.",
      });
    }

    await client.query("BEGIN");

    const newVehicle = await addVehicle(vehicleData);

    let images = [];

    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map(
        (f) => `/uploads/${f.filename}`
      );

      images = await addVehicleImages(
        newVehicle.id,
        imagePaths
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "✅ Vehicle added successfully",
      vehicle: {
        ...newVehicle,
        images,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("❌ Error adding vehicle:", {
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      message: error.message,
    });

    const { status, message } = describeVehicleError(error);

    res.status(status).json({
      error: message,
    });
  } finally {
    client.release();
  }
};


/*
|--------------------------------------------------------------------------
| Fetch All Vehicles
|--------------------------------------------------------------------------
*/

export const fetchAllVehicles = async (req, res) => {
  try {
    const vehicles = await getAllVehicles();

    res.json(vehicles);
  } catch (error) {
    console.error("❌ Error fetching vehicles:", error);

    res.status(500).json({
      error: "Server error while fetching vehicles",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Fetch Vehicle By ID
|--------------------------------------------------------------------------
*/

export const fetchVehicleById = async (req, res) => {
  try {
    const vehicle = await getVehicleById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        error: "Vehicle not found",
      });
    }

    res.json(vehicle);
  } catch (error) {
    console.error("❌ Error fetching vehicle:", error);

    res.status(500).json({
      error: "Server error while fetching vehicle",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Update Vehicle
|--------------------------------------------------------------------------
*/

export const editVehicle = async (req, res) => {
  try {
    const updatedVehicle = await updateVehicle(
      req.params.id,
      req.body
    );

    if (!updatedVehicle) {
      return res.status(404).json({
        error: "Vehicle not found",
      });
    }

    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map(
        (f) => `/uploads/${f.filename}`
      );

      await addVehicleImages(
        updatedVehicle.id,
        imagePaths
      );
    }

    res.json({
      message: "✅ Vehicle updated successfully",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error("❌ Error updating vehicle:", {
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      message: error.message,
    });

    const { status, message } = describeVehicleError(error);

    res.status(status).json({
      error: message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| Adjust Vehicle Stock
|--------------------------------------------------------------------------
|
| PATCH /vehicles/:id/stock
|
| Body:
| {
|   "delta": 1
| }
|
| +1 = add vehicle to stock
| -1 = remove vehicle from stock
|
*/

export const updateStock = async (req, res) => {
  try {
    const { delta } = req.body;

    if (delta === undefined || delta === null) {
      return res.status(400).json({
        error: "Delta is required.",
      });
    }

    const numericDelta = Number(delta);

    if (Number.isNaN(numericDelta)) {
      return res.status(400).json({
        error: "Delta must be a valid number.",
      });
    }

    const updatedVehicle = await adjustVehicleStock(
      req.params.id,
      numericDelta
    );

    res.json({
      message: "✅ Stock updated successfully",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error("❌ Error adjusting vehicle stock:", error);

    res.status(400).json({
      error:
        error.message ||
        "Server error while adjusting vehicle stock",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Remove Vehicle Image
|--------------------------------------------------------------------------
*/

export const removeVehicleImage = async (req, res) => {
  try {
    const deleted = await deleteVehicleImage(
      req.params.imageId
    );

    if (!deleted) {
      return res.status(404).json({
        error: "Image not found",
      });
    }

    res.json({
      message: "✅ Image deleted",
    });
  } catch (error) {
    console.error("❌ Error deleting image:", error);

    res.status(500).json({
      error: "Server error while deleting image",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Make Image Primary
|--------------------------------------------------------------------------
*/

export const makeImagePrimary = async (req, res) => {
  try {
    const updated = await setPrimaryImage(
      req.params.id,
      req.params.imageId
    );

    if (!updated) {
      return res.status(404).json({
        error: "Image not found",
      });
    }

    res.json({
      message: "✅ Primary image updated",
      image: updated,
    });
  } catch (error) {
    console.error("❌ Error setting primary image:", error);

    res.status(500).json({
      error: "Server error while setting primary image",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Remove Vehicle
|--------------------------------------------------------------------------
*/

export const removeVehicle = async (req, res) => {
  try {
    const deletedVehicle = await deleteVehicle(req.params.id);

    if (!deletedVehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    // Remove image files from disk (after the DB delete succeeded)
    await Promise.allSettled(
      (deletedVehicle.deletedImagePaths || [])
        .filter((p) => p && p.startsWith("/uploads/"))
        .map((p) =>
          fs.unlink(path.join(process.cwd(), "uploads", path.basename(p)))
        )
    );

    res.json({ message: "✅ Vehicle deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting vehicle:", {
      code: error.code,
      detail: error.detail,
      table: error.table,
      message: error.message,
    });

    if (error.code === "23503") {
      return res.status(409).json({
        error:
          "This vehicle can't be deleted because it is used in other records (quotes, invoices or delivery notes). " +
          "Set its status to Sold or hide it from inventory instead.",
      });
    }

    res.status(500).json({ error: "Server error while deleting vehicle" });
  }
};