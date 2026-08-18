import {
  getActiveAllowancesByEmployee,
} from "../../models/employeeAllowanceModel.js";

// =============================================
// Get Employee Allowances
// =============================================

export const getEmployeeAllowances = async (
  employeeId,
  payrollDate
) => {
  return await getActiveAllowancesByEmployee(
    employeeId,
    payrollDate
  );
};

// =============================================
// Calculate Total Allowances
// =============================================

export const calculateTotalAllowances = (
  allowances = []
) => {
  return allowances.reduce(
    (total, allowance) =>
      total + Number(allowance.amount || 0),
    0
  );
};

// =============================================
// Calculate Taxable Allowances
// =============================================

export const calculateTaxableAllowances = (
  allowances = []
) => {
  return allowances
    .filter((a) => a.is_taxable)
    .reduce(
      (total, allowance) =>
        total + Number(allowance.amount || 0),
      0
    );
};

// =============================================
// Calculate Non-Taxable Allowances
// =============================================

export const calculateNonTaxableAllowances = (
  allowances = []
) => {
  return allowances
    .filter((a) => !a.is_taxable)
    .reduce(
      (total, allowance) =>
        total + Number(allowance.amount || 0),
      0
    );
};

// =============================================
// Convert Allowances To Payslip Earnings
// =============================================

export const buildAllowanceEarnings = (
  allowances = []
) => {
  return allowances.map((allowance) => ({
    description: allowance.name,
    amount: Number(allowance.amount),
    taxable: allowance.is_taxable,
  }));
};

// =============================================
// Build Allowance Breakdown
// =============================================

export const buildAllowanceBreakdown = async (
  employeeId,
  payrollDate
) => {
  const allowances =
    await getEmployeeAllowances(employeeId , payrollDate);

  const totalAllowances =
    calculateTotalAllowances(allowances);

  const taxableAllowances =
    calculateTaxableAllowances(allowances);

  const nonTaxableAllowances =
    calculateNonTaxableAllowances(
      allowances
    );

  const earnings =
    buildAllowanceEarnings(allowances);

  return {
    allowances,

    totalAllowances,

    taxableAllowances,

    nonTaxableAllowances,

    earnings,
  };
};