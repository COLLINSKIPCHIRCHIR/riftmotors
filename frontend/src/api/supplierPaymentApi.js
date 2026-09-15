import API from "./api";

export const getSupplierPayments = (supplierId) =>
  API.get("/supplier-payments", { params: supplierId ? { supplier_id: supplierId } : {} });

export const getSupplierPayment = (id) => API.get(`/supplier-payments/${id}`);

export const createSupplierPayment = (data) => API.post("/supplier-payments", data);

export const getSupplierStatement = (supplierId) =>
  API.get(`/supplier-payments/statement/${supplierId}`);