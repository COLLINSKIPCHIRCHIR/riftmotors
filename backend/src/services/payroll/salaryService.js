import { getCurrentSalary } from "../../models/employeeSalaryHistoryModel.js";

// =============================================
// Get Employee Salary
// =============================================

export const getEmployeeSalary = async (employeeId, payrollDate) => {
  const salary = await getCurrentSalary(employeeId, payrollDate);

  if (!salary) {
    throw new Error(`No active salary found for employee ${employeeId}`);
  }

  return salary;
};

// =============================================
// Calculate Daily Salary
// =============================================

export const calculateDailySalary = (
  monthlySalary
) => {
  return Number(monthlySalary) / 30;
};

// =============================================
// Calculate Hourly Salary
// =============================================

export const calculateHourlySalary = (
  monthlySalary
) => {
  return Number(monthlySalary) / 30 / 8;
};

// =============================================
// Calculate Unpaid Leave Deduction
// =============================================

export const calculateUnpaidLeaveDeduction = (
  monthlySalary,
  unpaidLeaveDays
) => {
  const dailyRate =
    calculateDailySalary(monthlySalary);

  return dailyRate * Number(unpaidLeaveDays || 0);
};

// =============================================
// Calculate Overtime Pay
// =============================================

export const calculateOvertimePay = (
  monthlySalary,
  overtimeHours,
  multiplier = 1.5
) => {
  const hourlyRate =
    calculateHourlySalary(monthlySalary);

  return (
    hourlyRate *
    Number(overtimeHours || 0) *
    multiplier
  );
};

// =============================================
// Build Salary Breakdown
// =============================================

export const buildSalaryBreakdown = async (
  employeeId,
  payrollDate,
  unpaidLeaveDays = 0,
  overtimeHours = 0
) => {
  const salary = await getEmployeeSalary(
    employeeId,
    payrollDate
  );

  const basicSalary = Number(
    salary.basic_salary
  );

  const unpaidLeaveDeduction =
    calculateUnpaidLeaveDeduction(
      basicSalary,
      unpaidLeaveDays
    );

  const overtimePay =
    calculateOvertimePay(
      basicSalary,
      overtimeHours
    );

  return {
    salaryRecord: salary,

    basicSalary,

    dailyRate:
      calculateDailySalary(basicSalary),

    hourlyRate:
      calculateHourlySalary(basicSalary),

    unpaidLeaveDays,

    unpaidLeaveDeduction,

    overtimeHours,

    overtimePay,
  };
};