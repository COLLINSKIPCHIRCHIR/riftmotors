import API from "./api";

export const getPurchases = (status) =>
  API.get("/purchases", { params: status ? { status } : {} });

export const getPurchase = (id) => API.get(`/purchases/${id}`);

export const createPurchase = (data) => API.post("/purchases", data);

export const sendPurchase = (id) => API.patch(`/purchases/${id}/send`);

export const cancelPurchase = (id) => API.patch(`/purchases/${id}/cancel`);

export const receiveGoods = (id, data) => API.post(`/purchases/${id}/receive`, data);