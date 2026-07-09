import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getAllPermissions } from "../controllers/permissionController.js";

const router = express.Router();

router.get(
    "/",
    protect,
    getAllPermissions
);

export default router;