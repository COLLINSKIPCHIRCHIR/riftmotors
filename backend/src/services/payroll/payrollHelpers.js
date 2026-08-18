// ============================================================
// PAYROLL HELPERS
// ============================================================

/**
 * Convert a value safely to a number.
 */
export const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

/**
 * Round money to 2 decimal places.
 */
export const roundMoney = (value) => {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
};

/**
 * Round hours to 2 decimal places.
 */
export const roundHours = (value) => {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
};

/**
 * Return YYYY-MM-DD.
 */
export const formatDate = (date) => {
  if (!date) return null;

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString().split("T")[0];
};

/**
 * Check whether a date falls inside a date range.
 */
export const isDateInRange = (
  date,
  effectiveFrom,
  effectiveTo = null
) => {
  const target = new Date(date);
  const from = new Date(effectiveFrom);

  if (Number.isNaN(target.getTime())) return false;
  if (Number.isNaN(from.getTime())) return false;

  if (target < from) {
    return false;
  }

  if (effectiveTo) {
    const to = new Date(effectiveTo);

    if (target > to) {
      return false;
    }
  }

  return true;
};

/**
 * Get number of calendar days between two dates.
 */
export const getCalendarDays = (
  startDate,
  endDate
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  const difference =
    end.getTime() - start.getTime();

  return Math.floor(
    difference / (1000 * 60 * 60 * 24)
  ) + 1;
};

/**
 * Get number of days in a month.
 */
export const getDaysInMonth = (date) => {
  const d = new Date(date);

  return new Date(
    d.getFullYear(),
    d.getMonth() + 1,
    0
  ).getDate();
};

/**
 * Calculate daily salary.
 *
 * Payroll currently uses calendar days in the payroll
 * period/month for unpaid leave calculation.
 */
export const calculateDailySalary = (
  basicSalary,
  daysInPeriod
) => {
  if (toNumber(daysInPeriod) <= 0) {
    return 0;
  }

  return roundMoney(
    toNumber(basicSalary) /
      toNumber(daysInPeriod)
  );
};

/**
 * Calculate unpaid leave deduction.
 */
export const calculateUnpaidLeaveDeduction = ({
  basicSalary,
  unpaidLeaveDays,
  daysInPeriod,
}) => {
  const dailySalary = calculateDailySalary(
    basicSalary,
    daysInPeriod
  );

  return roundMoney(
    dailySalary *
      toNumber(unpaidLeaveDays)
  );
};

/**
 * Calculate gross pay.
 */
export const calculateGrossPay = ({
  basicSalary,
  allowances = 0,
  unpaidLeaveDeduction = 0,
}) => {
  return roundMoney(
    toNumber(basicSalary) +
      toNumber(allowances) -
      toNumber(unpaidLeaveDeduction)
  );
};

/**
 * Calculate taxable pay.
 *
 * taxableDeductions are deductions configured with
 * reduces_taxable_income = true.
 */
export const calculateTaxablePay = ({
  grossPay,
  taxableDeductions = 0,
}) => {
  return roundMoney(
    Math.max(
      0,
      toNumber(grossPay) -
        toNumber(taxableDeductions)
    )
  );
};

/**
 * Calculate total deductions.
 */
export const calculateTotalDeductions = ({
  statutoryDeductions = 0,
  otherDeductions = 0,
}) => {
  return roundMoney(
    toNumber(statutoryDeductions) +
      toNumber(otherDeductions)
  );
};

/**
 * Calculate net pay.
 */
export const calculateNetPay = ({
  grossPay,
  totalDeductions,
}) => {
  return roundMoney(
    toNumber(grossPay) -
      toNumber(totalDeductions)
  );
};

/**
 * Determine whether an employee should be processed
 * for a payroll period.
 */
export const isEmployeeEligibleForPayroll = (
  employee,
  period
) => {
  if (!employee) {
    return false;
  }

  if (employee.is_active === false) {
    return false;
  }

  if (
    employee.employment_status &&
    !["Active", "On Leave"].includes(
      employee.employment_status
    )
  ) {
    return false;
  }

  const periodStart = new Date(period.start_date);
  const periodEnd = new Date(period.end_date);

  if (employee.employment_date) {
    const employmentDate =
      new Date(employee.employment_date);

    if (employmentDate > periodEnd) {
      return false;
    }
  }

  if (employee.termination_date) {
    const terminationDate =
      new Date(employee.termination_date);

    if (terminationDate < periodStart) {
      return false;
    }
  }

  return true;
};

/**
 * Normalize calculation method.
 */
export const normalizeCalculationMethod = (
  method
) => {
  return String(method || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
};

/**
 * Create a standard earning item.
 */
export const createEarning = (
  description,
  amount
) => {
  return {
    description,
    amount: roundMoney(amount),
  };
};

/**
 * Create a standard deduction item.
 */
export const createDeduction = ({
  deduction_type_id = null,
  description,
  amount,
}) => {
  return {
    deduction_type_id,
    description,
    amount: roundMoney(amount),
  };
};

/**
 * Sum an array of monetary items.
 */
export const sumAmounts = (items = []) => {
  return roundMoney(
    items.reduce(
      (total, item) =>
        total + toNumber(item.amount),
      0
    )
  );
};