import pool from "../../config/db.js";

/**
 * ============================================================
 * Get Approved Leave For Employee Within Payroll Period
 * ============================================================
 *
 * Finds approved leave requests that overlap the payroll period.
 *
 * We intentionally check for overlap instead of simply checking
 * whether start_date or end_date falls inside the period.
 *
 * Example:
 *
 * Payroll:
 * 01 - 31 July
 *
 * Leave:
 * 28 June - 05 July
 *
 * This leave MUST be detected because part of it falls in July.
 */
export const getApprovedLeaveForEmployee = async (
  employeeId,
  periodStart,
  periodEnd
) => {
  const result = await pool.query(
    `
    SELECT
        lr.id,
        lr.employee_id,
        lr.leave_type_id,
        lr.start_date,
        lr.end_date,
        lr.days_requested,
        lr.status,
        lt.name AS leave_type,
        lt.is_paid

    FROM leave_requests lr

    JOIN leave_types lt
        ON lt.id = lr.leave_type_id

    WHERE
        lr.employee_id = $1

        AND lr.status = 'Approved'

        AND lr.start_date <= $3
        AND lr.end_date >= $2

    ORDER BY
        lr.start_date ASC
    `,
    [
      employeeId,
      periodStart,
      periodEnd,
    ]
  );

  return result.rows;
};


/**
 * ============================================================
 * Calculate Leave Days Inside Payroll Period
 * ============================================================
 *
 * A leave request may start before the payroll period or end
 * after the payroll period.
 *
 * Therefore we calculate only the days that fall inside the
 * payroll period.
 */
const calculateOverlappingDays = (
  leaveStart,
  leaveEnd,
  periodStart,
  periodEnd
) => {
  const start = new Date(leaveStart);
  const end = new Date(leaveEnd);

  const payrollStart = new Date(periodStart);
  const payrollEnd = new Date(periodEnd);

  const effectiveStart =
    start > payrollStart
      ? start
      : payrollStart;

  const effectiveEnd =
    end < payrollEnd
      ? end
      : payrollEnd;

  if (effectiveStart > effectiveEnd) {
    return 0;
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return (
    Math.floor(
      (
        effectiveEnd - effectiveStart
      ) / millisecondsPerDay
    ) + 1
  );
};


/**
 * ============================================================
 * Get Employee Leave Summary
 * ============================================================
 *
 * Returns:
 *
 * {
 *   totalLeaveDays,
 *   paidLeaveDays,
 *   unpaidLeaveDays,
 *   leaves
 * }
 *
 * This is what payrollCalculator will use.
 */
export const getEmployeeLeaveSummary = async (
  employeeId,
  periodStart,
  periodEnd
) => {
  const leaves =
    await getApprovedLeaveForEmployee(
      employeeId,
      periodStart,
      periodEnd
    );

  let totalLeaveDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;

  const processedLeaves = leaves.map(
    (leave) => {
      const days = calculateOverlappingDays(
        leave.start_date,
        leave.end_date,
        periodStart,
        periodEnd
      );

      const isPaid =
        leave.is_paid === true;

      totalLeaveDays += days;

      if (isPaid) {
        paidLeaveDays += days;
      } else {
        unpaidLeaveDays += days;
      }

      return {
        ...leave,
        payroll_period_days: days,
        paid: isPaid,
        unpaid: !isPaid,
      };
    }
  );

  return {
    totalLeaveDays,
    paidLeaveDays,
    unpaidLeaveDays,
    leaves: processedLeaves,
  };
};


/**
 * ============================================================
 * Get Unpaid Leave Days
 * ============================================================
 *
 * Convenience function for payroll calculation.
 */
export const getUnpaidLeaveDays = async (
  employeeId,
  periodStart,
  periodEnd
) => {
  const summary =
    await getEmployeeLeaveSummary(
      employeeId,
      periodStart,
      periodEnd
    );

  return summary.unpaidLeaveDays;
};


/**
 * ============================================================
 * Get Paid Leave Days
 * ============================================================
 *
 * Convenience function.
 */
export const getPaidLeaveDays = async (
  employeeId,
  periodStart,
  periodEnd
) => {
  const summary =
    await getEmployeeLeaveSummary(
      employeeId,
      periodStart,
      periodEnd
    );

  return summary.paidLeaveDays;
};


/**
 * ============================================================
 * Get Leave Summary For All Employees
 * ============================================================
 *
 * Useful when processing an entire payroll period.
 *
 * Returns one summary per employee.
 */
export const getPayrollPeriodLeaveSummary = async (
  periodStart,
  periodEnd
) => {
  const result = await pool.query(
    `
    SELECT DISTINCT
        lr.employee_id

    FROM leave_requests lr

    WHERE
        lr.status = 'Approved'

        AND lr.start_date <= $2
        AND lr.end_date >= $1
    `,
    [
      periodStart,
      periodEnd,
    ]
  );

  const summaries = {};

  for (const row of result.rows) {
    summaries[row.employee_id] =
      await getEmployeeLeaveSummary(
        row.employee_id,
        periodStart,
        periodEnd
      );
  }

  return summaries;
};