import API from "./api";


export const getCustomers = () =>
 API.get("/customers");

export const getCustomerStatement = (id, from, to, type = "both") =>
  API.get(`/customers/${id}/statement`, { params: { from, to, type } });


export const getCustomer360 = (id) => API.get(`/customers/${id}/360`);