import {
    getAllRoles,
    getAllPermissions,
    getRolePermissions,
    updateRolePermissions
} from "../models/roleModel.js";


// GET /api/roles
export const fetchRoles = async (req, res) => {
    try {

        const roles = await getAllRoles();

        res.json(roles);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch roles."
        });

    }
};


// GET /api/roles/:id/permissions
export const fetchRolePermissions = async (req, res) => {

    try {

        const roleId = req.params.id;

        const permissions = await getRolePermissions(roleId);

        const allPermissions = await getAllPermissions();

        res.json({
            permissions,
            allPermissions
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch permissions."
        });

    }

};


// PUT /api/roles/:id/permissions
export const saveRolePermissions = async (req, res) => {

    try {

        const roleId = req.params.id;

        const { permissionIds } = req.body;

        await updateRolePermissions(
            roleId,
            permissionIds
        );

        res.json({
            message: "Permissions updated successfully."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update permissions."
        });

    }

};