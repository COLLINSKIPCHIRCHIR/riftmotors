import express from "express";

import {
    fetchRoles,
    fetchRolePermissions,
    saveRolePermissions
} from "../controllers/roleController.js";

import {
    protect,
    requirePermission
} from "../middleware/authMiddleware.js";

const router = express.Router();


// View roles
router.get(
    "/",
    protect,
    requirePermission("roles.view"),
    fetchRoles
);


// View permissions for one role
router.get(
    "/:id/permissions",
    protect,
    requirePermission("roles.view"),
    fetchRolePermissions
);


// Update permissions
router.put(
    "/:id/permissions",
    protect,
    requirePermission("permissions.assign"),
    saveRolePermissions
);

export default router;