import API from "./api";

export const getUsers = async () => {
    const { data } = await API.get("/users");
    return data;
};

export const getRoles = async () => {
    const { data } = await API.get("/roles");
    return data;
};

export const createUser = async (user) => {
    const { data } = await API.post("/users", user);
    return data;
};

export const updateUser = async (id, user) => {
    const { data } = await API.put(`/users/${id}`, user);
    return data;
};

export const toggleUserStatus = async (id) => {
    const { data } = await API.patch(`/users/${id}/status`);
    return data;
};

export const resetPassword = async (id, password) => {
    const { data } = await API.patch(
        `/users/${id}/password`,
        {
            password
        }
    );

    return data;
};