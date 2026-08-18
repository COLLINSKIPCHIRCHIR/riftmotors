import {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from "../models/branchModel.js";

// ➤ Create
export const addBranch = async (req, res) => {
  try {
    const branch = await createBranch(req.body);

    res.status(201).json(branch);
  } catch (err) {
    console.error("❌ Error creating branch:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ➤ List
export const listBranches = async (req, res) => {
  try {
    const branches = await getAllBranches();

    res.json(branches);
  } catch (err) {
    console.error("❌ Error fetching branches:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ➤ Single
export const fetchBranch = async (req, res) => {
  try {
    const branch = await getBranchById(req.params.id);

    if (!branch)
      return res.status(404).json({
        message: "Branch not found",
      });

    res.json(branch);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ➤ Update
export const editBranch = async (req, res) => {
  try {
    const branch = await updateBranch(req.params.id, req.body);

    res.json(branch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ➤ Delete
export const removeBranch = async (req, res) => {
  try {
    const branch = await deleteBranch(req.params.id);

    res.json({
      message: "Branch deactivated",
      branch,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};