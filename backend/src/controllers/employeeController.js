import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../models/employeeModel.js";

// Create
export const addEmployee = async (req, res) => {
  try {
    const dateFields = ["date_of_birth", "probation_end_date", "termination_date"];
    const data = { ...req.body };

    dateFields.forEach((field) => {
      if (data[field] === "") data[field] = null;
    });

    data.photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const employee = await createEmployee(data);
    res.status(201).json(employee);
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      // Extract which field caused it, e.g. "employees_national_id_key"
      const field = err.constraint?.replace("employees_", "").replace("_key", "");
      return res.status(409).json({
        message: `An employee with this ${field?.replace("_", " ") || "value"} already exists.`,
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// List
export const listEmployees = async (req, res) => {
  try {
    const employees = await getAllEmployees();
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Single
export const fetchEmployee = async (req, res) => {
  try {
    const employee = await getEmployeeById(req.params.id);

    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update
export const editEmployee = async (req, res) => {
  try {
    const dateFields = ["date_of_birth", "probation_end_date", "termination_date"];

    const data = { ...req.body };

    dateFields.forEach((field) => {
      if (data[field] === "") {
        data[field] = null;
      }
    });

    if (req.file) {
      data.photo_url = `/uploads/${req.file.filename}`;
    }

    const employee = await updateEmployee(req.params.id, data);

    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// Delete
export const removeEmployee = async (req, res) => {
  try {
    const employee = await deleteEmployee(req.params.id);

    res.json({
      message: "Employee deactivated",
      employee,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};