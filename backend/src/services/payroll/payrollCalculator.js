import pool from "../../config/db.js";

import { getEmployeeSalary } from "./salaryService.js";
import { buildAllowanceBreakdown } from "./allowanceService.js";
import { getEmployeeLeaveSummary } from "./leaveService.js";
import { buildAttendanceBreakdown } from "./attendanceService.js";
import { calculateEmployeeRecurringDeductions } from "./deductionService.js";
import { calculatePAYE } from "./payeService.js";

import {
  roundMoney,
  toNumber,
  getCalendarDays,
  calculateGrossPay,
  calculateTaxablePay,
  calculateTotalDeductions,
  calculateNetPay,
  createEarning,
  createDeduction,
} from "./payrollHelpers.js";


// ============================================================
// UNPAID LEAVE DEDUCTION
// ============================================================
//
// Daily rate uses calendar days in the payroll period (not a
// fixed /30), since periods have explicit start/end dates and
// may not always be exactly one month.
//

const calculateUnpaidLeaveDeduction = ({
  basicSalary,
  unpaidLeaveDays,
  daysInPeriod,
}) => {
  if (toNumber(daysInPeriod) <= 0) {
    return 0;
  }

  const dailyRate = roundMoney(
    toNumber(basicSalary) / toNumber(daysInPeriod)
  );

  return roundMoney(dailyRate * toNumber(unpaidLeaveDays));
};


// ============================================================
// FIND PAYE DEDUCTION TYPE
// ============================================================

const getPayeDeductionType = async () => {
  const result = await pool.query(`
    SELECT *
    FROM deduction_types
    WHERE (UPPER(code)='PAYE' OR UPPER(name)='PAYE')
      AND is_active=true
    LIMIT 1
  `);

  return result.rows[0] || null;
};


// ============================================================
// CALCULATE EMPLOYEE PAYROLL
// ============================================================

export const calculateEmployeePayroll = async ({
  employee,
  payrollPeriod,
}) => {
  const payrollDate = payrollPeriod.end_date;

  const daysInPeriod = getCalendarDays(
    payrollPeriod.start_date,
    payrollPeriod.end_date
  );


  // ----------------------------------------------------------
  // SALARY
  // ----------------------------------------------------------

  let salaryRecord;

  try {
    salaryRecord = await getEmployeeSalary(employee.id, payrollDate);
  } catch {
    throw new Error(
      `No salary found for employee ${employee.employee_number}.`
    );
  }

  const basicSalary = roundMoney(salaryRecord.basic_salary);


  // ----------------------------------------------------------
  // ALLOWANCES
  // ----------------------------------------------------------

  const { earnings: allowanceEarningsRaw, totalAllowances } =
    await buildAllowanceBreakdown(employee.id, payrollDate);

  const allowanceEarnings = allowanceEarningsRaw.map((a) =>
    createEarning(a.description, a.amount)
  );


  // ----------------------------------------------------------
  // LEAVE — approved, overlap-aware unpaid leave days
  // ----------------------------------------------------------

  const leaveSummary = await getEmployeeLeaveSummary(
    employee.id,
    payrollPeriod.start_date,
    payrollPeriod.end_date
  );

  const unpaidLeaveDays = leaveSummary.unpaidLeaveDays;

  const unpaidLeaveDeduction = calculateUnpaidLeaveDeduction({
    basicSalary,
    unpaidLeaveDays,
    daysInPeriod,
  });


  // ----------------------------------------------------------
  // ATTENDANCE — overtime pay
  // ----------------------------------------------------------
  //
  // attendance.attendanceDeductionDays (unauthorized absence) is
  // intentionally NOT deducted here to avoid double-counting
  // against approved unpaid leave above. Add it explicitly if
  // your attendance records are independent of leave requests.
  //

  const attendance = await buildAttendanceBreakdown(
    employee.id,
    payrollPeriod.start_date,
    payrollPeriod.end_date
  );

  const hourlyRate = roundMoney(basicSalary / daysInPeriod / 8);

  const overtimePay = roundMoney(
    hourlyRate * toNumber(attendance.overtimeHours) * 1.5
  );

  const overtimeEarning =
    overtimePay > 0 ? [createEarning("Overtime", overtimePay)] : [];


  // ----------------------------------------------------------
  // GROSS PAY
  // ----------------------------------------------------------

  const grossPay = calculateGrossPay({
    basicSalary,
    allowances: totalAllowances + overtimePay,
    unpaidLeaveDeduction,
  });


  // ----------------------------------------------------------
  // RECURRING DEDUCTIONS (statutory + other)
  // ----------------------------------------------------------

  const {
    deductions: deductionItems,
    statutoryDeductionTotal,
    otherDeductionTotal,
    taxableDeductions,
  } = await calculateEmployeeRecurringDeductions({
    employeeId: employee.id,
    payrollDate,
    calculationBase: grossPay,
  });


  // ----------------------------------------------------------
  // TAXABLE PAY
  // ----------------------------------------------------------

  const taxablePay = calculateTaxablePay({
    grossPay,
    taxableDeductions,
  });


  // ----------------------------------------------------------
  // PAYE
  // ----------------------------------------------------------

  const paye = await calculatePAYE({
    taxableIncome: taxablePay,
    payrollDate,
  });

  const payeType = await getPayeDeductionType();

  const finalDeductionItems = [...deductionItems];
  let totalStatutoryDeductions = statutoryDeductionTotal;

  if (paye.paye > 0) {
    finalDeductionItems.push(
      createDeduction({
        deduction_type_id: payeType?.id || null,
        description: "PAYE",
        amount: paye.paye,
      })
    );

    totalStatutoryDeductions = roundMoney(
      totalStatutoryDeductions + paye.paye
    );
  }


  // ----------------------------------------------------------
  // TOTALS
  // ----------------------------------------------------------

  const totalOtherDeductions = roundMoney(otherDeductionTotal);

  const totalDeductions = calculateTotalDeductions({
    statutoryDeductions: totalStatutoryDeductions,
    otherDeductions: totalOtherDeductions,
  });

  const netPay = calculateNetPay({ grossPay, totalDeductions });


  // ----------------------------------------------------------
  // EARNINGS
  // ----------------------------------------------------------

  const earnings = [
    createEarning("Basic Salary", basicSalary),
    ...allowanceEarnings,
    ...overtimeEarning,
  ];

  return {
    employee,
    payroll_period: payrollPeriod,
    basic_salary: basicSalary,
    total_allowances: roundMoney(totalAllowances + overtimePay),
    gross_pay: grossPay,
    unpaid_leave_days: unpaidLeaveDays,
    unpaid_leave_deduction: unpaidLeaveDeduction,
    taxable_pay: taxablePay,
    paye_amount: paye.paye,
    personal_relief: paye.personalRelief,
    total_statutory_deductions: totalStatutoryDeductions,
    total_other_deductions: totalOtherDeductions,
    total_deductions: totalDeductions,
    net_pay: netPay,
    earnings,
    deductions: finalDeductionItems,
  };
};