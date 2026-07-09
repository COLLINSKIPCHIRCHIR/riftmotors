import API from "./api";

// Get all roles
export const getRoles = async () => {
    const response = await API.get("/roles");
    return response.data;
};

// Get permissions assigned to one role
export const getRolePermissions = async (roleId) => {
    const response = await API.get(
        `/roles/${roleId}/permissions`
    );

    return response.data;
};

// Update permissions
export const updateRolePermissions = async (
    roleId,
    permissionIds
) => {
    const response = await API.put(
        `/roles/${roleId}/permissions`,
        {
            permissionIds,
        }
    );

    return response.data;
};