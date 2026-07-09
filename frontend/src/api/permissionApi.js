import API from "./api";

export const getPermissions = async () => {
    const response = await API.get("/permissions");

    return response.data;
};