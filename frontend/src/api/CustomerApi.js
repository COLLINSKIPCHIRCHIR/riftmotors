import API from "./api";


export const getCustomers = () =>
 API.get("/customers");