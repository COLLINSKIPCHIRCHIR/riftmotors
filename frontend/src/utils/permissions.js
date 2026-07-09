export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("user") || "null");
};

export const hasPermission = (permission) => {
    const user = getCurrentUser();

    if (!user) return false;

    return user.permissions?.includes(permission);
};

export const hasAnyPermission = (permissions = []) => {
    const user = getCurrentUser();

    if (!user) return false;

    return permissions.some(permission =>
        user.permissions?.includes(permission)
    );
};