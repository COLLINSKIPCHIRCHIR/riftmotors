import API from "./api";


// JOBS

export const getServiceJobs = (search) =>
 API.get("/service-jobs", { params: search ? { search } : {} });


export const getServiceJob = (id) =>
 API.get(`/service-jobs/${id}`);


export const createServiceJob = (data)=>
 API.post("/service-jobs",data);

export const getDailyJobReport = (from, to) =>
  API.get(`/service-jobs/reports/daily?from=${from}&to=${to}`);

export const updateServiceJob = (id, data) =>
 API.put(`/service-jobs/${id}`, data);



// CUSTOMER VEHICLES
export const createCustomerVehicle = (data)=>
 API.post("/service-vehicles", data);

export const getCustomerVehicles = () =>
 API.get("/service-vehicles");

export const updateCustomerVehicle = (id, data) =>
 API.put(`/service-vehicles/${id}`, data);




// SERVICE CATALOG

export const getServices = () =>
 API.get("/service-catalog");

export const getServiceCatalog = () =>
API.get("/service-catalog");


export const createServiceCatalog = (data)=>
 API.post("/service-catalog",data);




// ASSIGNMENTS

export const assignMechanic = (data)=>
 API.post("/service-assignments",data);


export const getJobAssignments = (jobId)=>
 API.get(`/service-assignments/job/${jobId}`);




// JOB SERVICES

export const addJobService = (data)=>
 API.post("/job-services",data);


export const getJobServices = (jobId)=>
 API.get(`/job-services/job/${jobId}`);

export const deleteJobService=(id)=>
API.delete(`/job-services/${id}`);

export const setJobServiceCompletion = (id, is_completed) =>
  API.patch(`/job-services/${id}/completion`, { is_completed });

export const updateJobService = (id, data) =>
  API.put(`/job-services/${id}`, data);

// JOB PARTS

export const addJobPart = (data)=>
 API.post("/job-parts",data);


export const getJobParts = (jobId)=>
 API.get(`/job-parts/job/${jobId}`);

export const deleteJobPart = (id)=>
 API.delete(`/job-parts/${id}`);

export const updateJobPart = (id, data) =>
  API.put(`/job-parts/${id}`, data);

export const getSpareParts = (params = {}) =>
  API.get("/spareparts", { params });

export const getVehicleDetails = (id) =>
 API.get(`/service-vehicles/${id}`);




export const createService = (data)=>
API.post("/service-catalog",data);



export const updateService = (id,data)=>
API.put(`/service-catalog/${id}`,data);



export const deleteService = (id)=>
API.delete(`/service-catalog/${id}`);

// MECHANICS

export const getMechanics = () =>
API.get("/mechanics");


export const createMechanic = (data)=>
API.post("/mechanics",data);

export const updateMechanic = (id,data)=>
API.put(`/mechanics/${id}`,data);



export const deleteMechanic = (id)=>
API.delete(`/mechanics/${id}`);


// SERVICE ESTIMATES


export const createServiceEstimate = (data)=>
 API.post("/service-estimates/create",data);



export const getServiceEstimates = ()=>
 API.get("/service-estimates");



export const getServiceEstimate = (id)=>
 API.get(`/service-estimates/${id}`);

// SERVICE INVOICES


export const getServiceInvoices=()=> 
API.get("/service-invoices");



export const getServiceInvoice=(id)=>
API.get(`/service-invoices/${id}`);



export const convertServiceEstimate = (id, data = {}) =>
 API.post(`/service-invoices/${id}/convert-from-estimate`, data);


// SERVICE RECEIPTS


export const getServiceReceipts = () =>
API.get("/service-receipts");



export const getServiceReceipt = (id) =>
API.get(`/service-receipts/${id}`);


// SERVICE CREDIT NOTES

export const createCreditNote = (data) =>
API.post("/service-credit-notes", data);

export const getServiceCreditNotes = () =>
API.get("/service-credit-notes");

export const getServiceCreditNote = (id) =>
API.get(`/service-credit-notes/${id}`);

export const updateCreditNote = (id, data) =>
API.put(`/service-credit-notes/${id}`, data);



export const payServiceInvoice = (id, payment_method, amount_paid) =>

API.post(
`/service-receipts/${id}/pay`,
{
payment_method,
amount_paid
}
);

export const updateEstimateItem =
(id,data)=>

API.put(

`/service-estimates/item/${id}`,

data

);


