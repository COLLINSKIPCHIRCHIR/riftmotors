import API from "./api";

export const getSupplierInvoices = (params) => API.get("/supplier-invoices", { params });

export const getSupplierInvoice = (id) => API.get(`/supplier-invoices/${id}`);

export const createSupplierInvoice = (data) => API.post("/supplier-invoices", data);

export const cancelSupplierInvoice = (id) => API.patch(`/supplier-invoices/${id}/cancel`);

export const getOutstandingInvoices = (supplierId) =>
  API.get(`/supplier-invoices/outstanding/${supplierId}`);