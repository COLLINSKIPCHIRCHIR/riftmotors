import {
  createEmployeeSkill,
  getAllEmployeeSkills,
  getEmployeeSkills,
  getEmployeeSkillById,
  updateEmployeeSkill,
  deleteEmployeeSkill,
} from "../models/employeeSkillModel.js";

// ===============================
// Create
// ===============================
export const addEmployeeSkill = async (req, res) => {
  try {
    const skill = await createEmployeeSkill(req.body);

    res.status(201).json(skill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// List All
// ===============================
export const listEmployeeSkills = async (req, res) => {
  try {
    const skills = await getAllEmployeeSkills();

    res.json(skills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Skills By Employee
// ===============================
export const listEmployeeSkillsByEmployee = async (req, res) => {
  try {
    const skills = await getEmployeeSkills(req.params.employeeId);

    res.json(skills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Get One
// ===============================
export const fetchEmployeeSkill = async (req, res) => {
  try {
    const skill = await getEmployeeSkillById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        message: "Skill not found",
      });
    }

    res.json(skill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Update
// ===============================
export const editEmployeeSkill = async (req, res) => {
  try {
    const skill = await updateEmployeeSkill(
      req.params.id,
      req.body
    );

    res.json(skill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Delete
// ===============================
export const removeEmployeeSkill = async (req, res) => {
  try {
    const skill = await deleteEmployeeSkill(req.params.id);

    res.json({
      message: "Skill deleted",
      skill,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};