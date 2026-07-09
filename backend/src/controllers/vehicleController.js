// src/controllers/vehicleController.js
import {
  addVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from "../models/vehicleModel.js";



// ✅ Add a new vehicle
export const createVehicle = async (req, res) => {
  try {
    const vehicleData = req.body;

    // ✅ Handle single or multiple images
    if (req.files && req.files.length > 0) {
      // Store the first image path (since DB currently has only one image_url column)
      vehicleData.image_url = `/uploads/${req.files[0].filename}`;
    }

    // ✅ Validate required fields
    if (!vehicleData.make || !vehicleData.model || !vehicleData.selling_price) {
      return res.status(400).json({
        error: "Brand, name, and selling price are required.",
      });
    }

    const newVehicle = await addVehicle(vehicleData);

    res.status(201).json({
      message: "✅ Vehicle added successfully",
      vehicle: newVehicle,
    });
  } catch (error) {
    console.error("❌ Error adding vehicle:", error);
    res.status(500).json({ error: "Server error while adding vehicle" });
  }
};




// ✅ Get all vehicles
export const fetchAllVehicles = async (req, res) => {
  try {
    const vehicles = await getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("❌ Error fetching vehicles:", error);
    res.status(500).json({ error: "Server error while fetching vehicles" });
  }
};

// ✅ Get single vehicle by ID
export const fetchVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await getVehicleById(id);

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json(vehicle);
  } catch (error) {
    console.error("❌ Error fetching vehicle:", error);
    res.status(500).json({ error: "Server error while fetching vehicle" });
  }
};

// ✅ Update vehicle
export const editVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedVehicle = await updateVehicle(id, updatedData);
    if (!updatedVehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json({
      message: "✅ Vehicle updated successfully",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error("❌ Error updating vehicle:", error);
    res.status(500).json({ error: "Server error while updating vehicle" });
  }
};

// ✅ Delete vehicle
export const removeVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVehicle = await deleteVehicle(id);

    if (!deletedVehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json({ message: "✅ Vehicle deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting vehicle:", error);
    res.status(500).json({ error: "Server error while deleting vehicle" });
  }
};
