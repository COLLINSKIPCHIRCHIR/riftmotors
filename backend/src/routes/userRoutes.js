// src/routes/userRoutes.js
import express from "express";
import {
    signup,
    login,
    fetchUsers,
    createAdminUser,
    editUser,
    changeUserStatus,
    changePassword
} from "../controllers/userController.js";
import {
    protect,
    requirePermission
} from "../middleware/authMiddleware.js";

const router = express.Router();

//router.post("/signup", signup);
router.post("/login", login);

router.get(

    "/",

    protect,

    requirePermission("users.view"),

    fetchUsers

);

// Create user
router.post(
    "/",
    protect,
    requirePermission("users.create"),
    createAdminUser
);

// Update user
router.put(
    "/:id",
    protect,
    requirePermission("users.edit"),
    editUser
);

// Enable / Disable
router.patch(
    "/:id/status",
    protect,
    requirePermission("users.edit"),
    changeUserStatus
);

// Reset password
router.patch(
    "/:id/password",
    protect,
    requirePermission("users.resetpassword"),
    changePassword
);


export default router;
