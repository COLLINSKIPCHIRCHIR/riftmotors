import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from "../models/departmentModel.js";

// ➤ Create
export const addDepartment = async (req, res) => {
  try {
    const department = await createDepartment(req.body);
    res.status(201).json(department);
  } catch (err) {
    console.error("❌ Error creating department:", err);

    if (err.code === "23505") {
      return res.status(400).json({
        message: "Department already exists.",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ➤ List
export const listDepartments = async (req, res) => {
  try {
    const departments = await getAllDepartments();
    res.json(departments);
  } catch (err) {
    console.error("❌ Error fetching departments:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ➤ Get Single
export const fetchDepartment = async (req, res) => {
  try {
    const department = await getDepartmentById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json(department);
  } catch (err) {
    console.error("❌ Error fetching department:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ➤ Update
export const editDepartment = async (req, res) => {
  try {
    const department = await updateDepartment(
      req.params.id,
      req.body
    );

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json(department);
  } catch (err) {
    console.error("❌ Error updating department:", err);

    if (err.code === "23505") {
      return res.status(400).json({
        message: "Department already exists.",
      });
    }

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ➤ Delete
export const removeDepartment = async (req, res) => {
  try {
    const department = await deleteDepartment(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json({
      message: "Department deactivated successfully",
      department,
    });
  } catch (err) {
    console.error("❌ Error deleting department:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
};