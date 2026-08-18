import API from "./api";

/* ===============================
   DEPARTMENTS
=============================== */

export const getDepartments = () =>
  API.get("/departments");

export const getDepartment = (id) =>
  API.get(`/departments/${id}`);

export const createDepartment = (data) =>
  API.post("/departments", data);

export const updateDepartment = (id, data) =>
  API.put(`/departments/${id}`, data);

export const deleteDepartment = (id) =>
  API.delete(`/departments/${id}`);



/* ===============================
   BRANCHES
=============================== */

export const getBranches = () =>
  API.get("/branches");

export const getBranch = (id) =>
  API.get(`/branches/${id}`);

export const createBranch = (data) =>
  API.post("/branches", data);

export const updateBranch = (id, data) =>
  API.put(`/branches/${id}`, data);

export const deleteBranch = (id) =>
  API.delete(`/branches/${id}`);


/* ===============================
   EMPLOYEES
=============================== */

export const getEmployees = () =>
  API.get("/employees");

export const getEmployee = (id) =>
  API.get(`/employees/${id}`);

export const createEmployee = (data) =>
  API.post("/employees", data);

export const updateEmployee = (id, data) =>
  API.put(`/employees/${id}`, data);

export const deleteEmployee = (id) =>
  API.delete(`/employees/${id}`);


/* ===============================
   EMPLOYEE CONTACTS
=============================== */

export const getEmployeeContacts = () =>
  API.get("/employee-contacts");

export const getEmployeeContact = (id) =>
  API.get(`/employee-contacts/${id}`);

export const getEmployeeContactsByEmployee = (employeeId) =>
  API.get(`/employee-contacts/employee/${employeeId}`);

export const createEmployeeContact = (data) =>
  API.post("/employee-contacts", data);

export const updateEmployeeContact = (id, data) =>
  API.put(`/employee-contacts/${id}`, data);

export const deleteEmployeeContact = (id) =>
  API.delete(`/employee-contacts/${id}`);


/* ===============================
   EMPLOYEE DOCUMENTS
=============================== */

export const getEmployeeDocuments = () =>
  API.get("/employee-documents");

export const getEmployeeDocument = (id) =>
  API.get(`/employee-documents/${id}`);

export const getEmployeeDocumentsByEmployee = (employeeId) =>
  API.get(`/employee-documents/employee/${employeeId}`);

export const createEmployeeDocument = (data) =>
  API.post("/employee-documents", data);

export const updateEmployeeDocument = (id, data) =>
  API.put(`/employee-documents/${id}`, data);

export const deleteEmployeeDocument = (id) =>
  API.delete(`/employee-documents/${id}`);


/* ===============================
   EMPLOYEE SKILLS
=============================== */

export const getEmployeeSkills = () =>
  API.get("/employee-skills");

export const getEmployeeSkill = (id) =>
  API.get(`/employee-skills/${id}`);

export const getEmployeeSkillsByEmployee = (employeeId) =>
  API.get(`/employee-skills/employee/${employeeId}`);

export const createEmployeeSkill = (data) =>
  API.post("/employee-skills", data);

export const updateEmployeeSkill = (id, data) =>
  API.put(`/employee-skills/${id}`, data);

export const deleteEmployeeSkill = (id) =>
  API.delete(`/employee-skills/${id}`);

/* ===============================
   EMPLOYEE NOTES
=============================== */

export const getEmployeeNotes = () =>
  API.get("/employee-notes");

export const getEmployeeNote = (id) =>
  API.get(`/employee-notes/${id}`);

export const getEmployeeNotesByEmployee = (employeeId) =>
  API.get(`/employee-notes/employee/${employeeId}`);

export const createEmployeeNote = (data) =>
  API.post("/employee-notes", data);

export const updateEmployeeNote = (id, data) =>
  API.put(`/employee-notes/${id}`, data);

export const deleteEmployeeNote = (id) =>
  API.delete(`/employee-notes/${id}`);

/* ===============================
   LEAVE TYPES
=============================== */

export const getLeaveTypes = () =>
  API.get("/leave-types");

export const getLeaveType = (id) =>
  API.get(`/leave-types/${id}`);

export const createLeaveType = (data) =>
  API.post("/leave-types", data);

export const updateLeaveType = (id, data) =>
  API.put(`/leave-types/${id}`, data);

export const deleteLeaveType = (id) =>
  API.delete(`/leave-types/${id}`);


/* ===============================
   LEAVE BALANCES
=============================== */

export const getLeaveBalances = () =>
  API.get("/leave-balances");

export const getLeaveBalance = (id) =>
  API.get(`/leave-balances/${id}`);

export const getEmployeeLeaveBalances = (employeeId) =>
  API.get(`/leave-balances/employee/${employeeId}`);

export const createLeaveBalance = (data) =>
  API.post("/leave-balances", data);

export const updateLeaveBalance = (id, data) =>
  API.put(`/leave-balances/${id}`, data);

export const deleteLeaveBalance = (id) =>
  API.delete(`/leave-balances/${id}`);

export const getEmployeeLeaveBalance = (
    employeeId,
    leaveTypeId,
    year
) =>
    API.get(
        `/leave-balances/employee/${employeeId}/${leaveTypeId}/${year}`
    );


/* ===============================
   LEAVE REQUESTS
=============================== */

export const getLeaveRequests = () =>
  API.get("/leave-requests");

export const getLeaveRequest = (id) =>
  API.get(`/leave-requests/${id}`);

export const getEmployeeLeaveRequests = (employeeId) =>
  API.get(`/leave-requests/employee/${employeeId}`);

export const createLeaveRequest = (data) =>
  API.post("/leave-requests", data);

export const updateLeaveRequest = (id, data) =>
  API.put(`/leave-requests/${id}`, data);

export const deleteLeaveRequest = (id) =>
  API.delete(`/leave-requests/${id}`);

export const approveLeaveRequest = (id) =>
  API.put(`/leave-requests/${id}/approve`);

export const rejectLeaveRequest = (id) =>
  API.put(`/leave-requests/${id}/reject`);


/* ===============================
   PUBLIC HOLIDAYS
=============================== */

export const getPublicHolidays = () =>
  API.get("/public-holidays");

export const getPublicHoliday = (id) =>
  API.get(`/public-holidays/${id}`);

export const createPublicHoliday = (data) =>
  API.post("/public-holidays", data);

export const updatePublicHoliday = (id, data) =>
  API.put(`/public-holidays/${id}`, data);

export const deletePublicHoliday = (id) =>
  API.delete(`/public-holidays/${id}`);


/* ===============================
   EMPLOYEE ATTENDANCE
=============================== */

export const getAttendance = () =>
  API.get("/employee-attendance");

export const getAttendanceRecord = (id) =>
  API.get(`/employee-attendance/${id}`);

export const createAttendance = (data) =>
  API.post("/employee-attendance", data);

export const updateAttendance = (id, data) =>
  API.put(`/employee-attendance/${id}`, data);

export const deleteAttendance = (id) =>
  API.delete(`/employee-attendance/${id}`);



/* ===============================
   EMPLOYEE SALARY HISTORY
=============================== */

export const getEmployeeSalaries = () =>
  API.get("/employee-salary-history");

export const getEmployeeSalary = (id) =>
  API.get(`/employee-salary-history/${id}`);

export const getEmployeeSalaryHistory = (employeeId) =>
  API.get(`/employee-salary-history/employee/${employeeId}`);

export const createEmployeeSalary = (data) =>
  API.post("/employee-salary-history", data);

export const updateEmployeeSalary = (id, data) =>
  API.put(`/employee-salary-history/${id}`, data);

export const deleteEmployeeSalary = (id) =>
  API.delete(`/employee-salary-history/${id}`);


/* ===============================
   EMPLOYEE ALLOWANCES
=============================== */

export const getEmployeeAllowances = () =>
  API.get("/employee-allowances");

export const getEmployeeAllowance = (id) =>
  API.get(`/employee-allowances/${id}`);

export const getEmployeeAllowancesByEmployee = (employeeId) =>
  API.get(`/employee-allowances/employee/${employeeId}`);

export const createEmployeeAllowance = (data) =>
  API.post("/employee-allowances", data);

export const updateEmployeeAllowance = (id, data) =>
  API.put(`/employee-allowances/${id}`, data);

export const deleteEmployeeAllowance = (id) =>
  API.delete(`/employee-allowances/${id}`);


/* =====================================================
   DEDUCTION TYPES
===================================================== */

export const getDeductionTypes = () =>
  API.get("/deduction-types");

export const getDeductionType = (id) =>
  API.get(`/deduction-types/${id}`);

export const createDeductionType = (data) =>
  API.post("/deduction-types", data);

export const updateDeductionType = (id, data) =>
  API.put(`/deduction-types/${id}`, data);

export const deleteDeductionType = (id) =>
  API.delete(`/deduction-types/${id}`);



/* ======================================================
   DEDUCTION RATE VERSIONS
====================================================== */

export const getDeductionRateVersions = () =>
  API.get("/deduction-rate-versions");

export const getDeductionRateVersion = (id) =>
  API.get(`/deduction-rate-versions/${id}`);

export const getDeductionRateVersionsByType = (deductionTypeId) =>
  API.get(`/deduction-rate-versions/deduction-type/${deductionTypeId}`);

export const createDeductionRateVersion = (data) =>
  API.post("/deduction-rate-versions", data);

export const updateDeductionRateVersion = (id, data) =>
  API.put(`/deduction-rate-versions/${id}`, data);

export const deleteDeductionRateVersion = (id) =>
  API.delete(`/deduction-rate-versions/${id}`);


/* ======================================================
   PAYE TAX BANDS
====================================================== */

export const getPayeTaxBands = () =>
  API.get("/paye-tax-bands");

export const getPayeTaxBand = (id) =>
  API.get(`/paye-tax-bands/${id}`);

export const getCurrentPayeBands = () =>
  API.get("/paye-tax-bands/current");

export const getPayeBandsByDate = (date) =>
  API.get(`/paye-tax-bands/date/${date}`);

export const createPayeTaxBand = (data) =>
  API.post("/paye-tax-bands", data);

export const updatePayeTaxBand = (id, data) =>
  API.put(`/paye-tax-bands/${id}`, data);

export const deletePayeTaxBand = (id) =>
  API.delete(`/paye-tax-bands/${id}`);


/* ======================================================
   PAYE PERSONAL RELIEF
====================================================== */

export const getPayePersonalReliefs = () =>
  API.get("/paye-personal-relief");

export const getPayePersonalRelief = (id) =>
  API.get(`/paye-personal-relief/${id}`);

export const getCurrentPayePersonalRelief = () =>
  API.get("/paye-personal-relief/current");

export const getPayePersonalReliefByDate = (date) =>
  API.get(`/paye-personal-relief/date/${date}`);

export const createPayePersonalRelief = (data) =>
  API.post("/paye-personal-relief", data);

export const updatePayePersonalRelief = (id, data) =>
  API.put(`/paye-personal-relief/${id}`, data);

export const deletePayePersonalRelief = (id) =>
  API.delete(`/paye-personal-relief/${id}`);




/* ======================================================
   EMPLOYEE RECURRING DEDUCTIONS
====================================================== */

export const getEmployeeRecurringDeductions = () =>
  API.get("/employee-recurring-deductions");

export const getEmployeeRecurringDeduction = (id) =>
  API.get(`/employee-recurring-deductions/${id}`);

export const getRecurringDeductionsByEmployee = (employeeId) =>
  API.get(`/employee-recurring-deductions/employee/${employeeId}`);

export const getActiveRecurringDeductions = (
  employeeId,
  payrollDate
) =>
  API.get(
    `/employee-recurring-deductions/active/${employeeId}/${payrollDate}`
  );

export const createEmployeeRecurringDeduction = (data) =>
  API.post("/employee-recurring-deductions", data);

export const updateEmployeeRecurringDeduction = (id, data) =>
  API.put(`/employee-recurring-deductions/${id}`, data);

export const deleteEmployeeRecurringDeduction = (id) =>
  API.delete(`/employee-recurring-deductions/${id}`);




/* ======================================================
   PAYROLL PERIODS
====================================================== */

export const getPayrollPeriods = () =>
  API.get("/payroll-periods");

export const getPayrollPeriod = (id) =>
  API.get(`/payroll-periods/${id}`);

export const getOpenPayrollPeriod = () =>
  API.get("/payroll-periods/open");

export const createPayrollPeriod = (data) =>
  API.post("/payroll-periods", data);

export const updatePayrollPeriod = (id, data) =>
  API.put(`/payroll-periods/${id}`, data);

export const processPayrollPeriod = (
  id,
  processed_by
) =>
  API.put(`/payroll-periods/${id}/process`, {
    processed_by,
  });

export const closePayrollPeriod = (id) =>
  API.put(`/payroll-periods/${id}/close`);

export const deletePayrollPeriod = (id) =>
  API.delete(`/payroll-periods/${id}`);


/* ======================================================
   PAYSLIPS
====================================================== */

export const getPayslips = () =>
  API.get("/payslips");

export const getPayslip = (id) =>
  API.get(`/payslips/${id}`);

export const getEmployeePayslips = (employeeId) =>
  API.get(`/payslips/employee/${employeeId}`);

export const getPayslipsByPayrollPeriod = (payrollPeriodId) =>
  API.get(`/payslips/payroll/${payrollPeriodId}`);

export const createPayslip = (data) =>
  API.post("/payslips", data);

export const updatePayslip = (id, data) =>
  API.put(`/payslips/${id}`, data);

export const markPayslipPaid = (id) =>
  API.put(`/payslips/${id}/pay`);

export const deletePayslip = (id) =>
  API.delete(`/payslips/${id}`);


/* ======================================================
   PAYSLIP EARNINGS
====================================================== */

export const getPayslipEarnings = () =>
  API.get("/payslip-earnings");

export const getPayslipEarning = (id) =>
  API.get(`/payslip-earnings/${id}`);

export const getPayslipEarningsByPayslip = (payslipId) =>
  API.get(`/payslip-earnings/payslip/${payslipId}`);

export const createPayslipEarning = (data) =>
  API.post("/payslip-earnings", data);

export const updatePayslipEarning = (id, data) =>
  API.put(`/payslip-earnings/${id}`, data);

export const deletePayslipEarning = (id) =>
  API.delete(`/payslip-earnings/${id}`);


/* ======================================================
   PAYSLIP DEDUCTIONS
====================================================== */

export const getPayslipDeductions = () =>
  API.get("/payslip-deductions");

export const getPayslipDeduction = (id) =>
  API.get(`/payslip-deductions/${id}`);

export const getPayslipDeductionsByPayslip = (payslipId) =>
  API.get(`/payslip-deductions/payslip/${payslipId}`);

export const createPayslipDeduction = (data) =>
  API.post("/payslip-deductions", data);

export const updatePayslipDeduction = (id, data) =>
  API.put(`/payslip-deductions/${id}`, data);

export const deletePayslipDeduction = (id) =>
  API.delete(`/payslip-deductions/${id}`);


/* ======================================================
   PAYROLL PROCESSING
====================================================== */

export const previewPayrollPeriod = (payrollPeriodId) =>
  API.get(`/payroll-processing/preview/${payrollPeriodId}`);

export const runPayrollPeriod = (payrollPeriodId, processed_by) =>
  API.post(`/payroll-processing/process/${payrollPeriodId}`, { processed_by });

export const getPayrollPeriodSummary = (payrollPeriodId) =>
  API.get(`/payroll-processing/summary/${payrollPeriodId}`);

export const getPayrollPeriodResult = (payrollPeriodId) =>
  API.get(`/payroll-processing/result/${payrollPeriodId}`);