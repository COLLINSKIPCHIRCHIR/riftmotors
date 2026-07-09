// src/controllers/userController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
    createUser,
    findUserByEmail,
    getAllUsers,
    adminCreateUser,
    updateUser,
    toggleUserStatus,
    resetUserPassword
} from "../models/userModel.js";


export const signup = async (req, res) => {
  try {
    const { username, email, password, role_id } = req.body;

    // 1️⃣ Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2️⃣ Check if user exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // 3️⃣ Create user
    const newUser = await createUser(username, email, password, role_id);
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.is_active) {
        return res.status(403).json({
            message: "Your account has been disabled. Please contact an administrator."
        });
    }

    // 2️⃣ Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3️⃣ Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );
    // 4️⃣ Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
          id: user.id,
          username: user.username,
          role: user.role,
          permissions: user.permissions
      },


  });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const fetchUsers = async (req, res) => {

    try {

        const users = await getAllUsers();

        res.json(users);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to fetch users."

        });

    }

};


export const createAdminUser = async (req, res) => {

    try {

        const {
            username,
            email,
            password,
            role_id
        } = req.body;

        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists."
            });
        }

        const user = await adminCreateUser(
            username,
            email,
            password,
            role_id
        );

        res.status(201).json(user);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to create user."
        });

    }

};


export const editUser = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            username,
            email,
            role_id
        } = req.body;

        const user = await updateUser(
            id,
            username,
            email,
            role_id
        );

        res.json(user);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update user."
        });

    }

};


export const changeUserStatus = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await toggleUserStatus(id);

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to change user status."
        });

    }

};



export const changePassword = async (req, res) => {

    try {

        const { id } = req.params;

        const { password } = req.body;

        await resetUserPassword(
            id,
            password
        );

        res.json({
            message: "Password reset successfully."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to reset password."
        });

    }

};