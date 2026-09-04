import API from "./api";

export const getBusinessInvoiceReport = ({ preset, from, to, type = "both" }) =>
  API.get("/reports/invoices", { params: { preset, from, to, type } });