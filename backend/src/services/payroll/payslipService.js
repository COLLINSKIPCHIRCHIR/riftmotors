import pool from "../../config/db.js";

import {
  createPayslip,
  getPayslipById,
  getPayslipsByPayrollPeriod,
  getEmployeePayslips,
  updatePayslip,
  markPayslipPaid,
  deletePayslip,
} from "../../models/payslipModel.js";

import {
  createPayslipEarning,
  getPayslipEarningsByPayslip,
} from "../../models/payslipEarningModel.js";

import {
  createPayslipDeduction,
  getPayslipDeductionsByPayslip,
} from "../../models/payslipDeductionModel.js";

// ============================================================
// Create Complete Payslip
// ============================================================

export const createCompletePayslip = async (data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // --------------------------------------------------------
    // Check whether payslip already exists
    // --------------------------------------------------------

    const existingResult = await client.query(
      `
      SELECT id
      FROM payslips
      WHERE payroll_period_id=$1
      AND employee_id=$2
      LIMIT 1
      `,
      [
        data.payroll_period_id,
        data.employee_id,
      ]
    );

    if (existingResult.rows.length > 0) {
      throw new Error(
        "A payslip already exists for this employee in this payroll period."
      );
    }

    // --------------------------------------------------------
    // Create Payslip Header
    // --------------------------------------------------------

    const payslipResult = await client.query(
      `
      INSERT INTO payslips
      (
        payroll_period_id,
        employee_id,
        basic_salary,
        total_allowances,
        gross_pay,
        unpaid_leave_days,
        unpaid_leave_deduction,
        taxable_pay,
        paye_amount,
        total_statutory_deductions,
        total_other_deductions,
        net_pay,
        status,
        paid_at
      )

      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14
      )

      RETURNING *;
      `,
      [
        data.payroll_period_id,
        data.employee_id,
        data.basic_salary || 0,
        data.total_allowances || 0,
        data.gross_pay || 0,
        data.unpaid_leave_days || 0,
        data.unpaid_leave_deduction || 0,
        data.taxable_pay || 0,
        data.paye_amount || 0,
        data.total_statutory_deductions || 0,
        data.total_other_deductions || 0,
        data.net_pay || 0,
        data.status || "Draft",
        data.paid_at || null,
      ]
    );

    const payslip = payslipResult.rows[0];

    // --------------------------------------------------------
    // Create Earnings
    // --------------------------------------------------------

    const earnings = [];

    if (Array.isArray(data.earnings)) {
      for (const earning of data.earnings) {
        const result = await client.query(
          `
          INSERT INTO payslip_earnings
          (
            payslip_id,
            description,
            amount
          )

          VALUES ($1,$2,$3)

          RETURNING *;
          `,
          [
            payslip.id,
            earning.description,
            earning.amount || 0,
          ]
        );

        earnings.push(result.rows[0]);
      }
    }

    // --------------------------------------------------------
    // Create Deductions
    // --------------------------------------------------------

    const deductions = [];

    if (Array.isArray(data.deductions)) {
      for (const deduction of data.deductions) {
        const result = await client.query(
          `
          INSERT INTO payslip_deductions
          (
            payslip_id,
            deduction_type_id,
            description,
            amount
          )

          VALUES ($1,$2,$3,$4)

          RETURNING *;
          `,
          [
            payslip.id,
            deduction.deduction_type_id || null,
            deduction.description,
            deduction.amount || 0,
          ]
        );

        deductions.push(result.rows[0]);
      }
    }

    await client.query("COMMIT");

    return {
      ...payslip,
      earnings,
      deductions,
    };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};

// ============================================================
// Get Complete Payslip
// ============================================================

export const getCompletePayslip = async (payslipId) => {
  const payslip = await getPayslipById(payslipId);

  if (!payslip) {
    throw new Error("Payslip not found.");
  }

  const earnings =
    await getPayslipEarningsByPayslip(
      payslipId
    );

  const deductions =
    await getPayslipDeductionsByPayslip(
      payslipId
    );

  return {
    ...payslip,
    earnings,
    deductions,
  };
};

// ============================================================
// Get Payroll Period Payslips
// ============================================================

export const getPayrollPeriodPayslips = async (
  payrollPeriodId
) => {
  const payslips =
    await getPayslipsByPayrollPeriod(
      payrollPeriodId
    );

  const completePayslips = [];

  for (const payslip of payslips) {
    const earnings =
      await getPayslipEarningsByPayslip(
        payslip.id
      );

    const deductions =
      await getPayslipDeductionsByPayslip(
        payslip.id
      );

    completePayslips.push({
      ...payslip,
      earnings,
      deductions,
    });
  }

  return completePayslips;
};

// ============================================================
// Get Employee Payslips
// ============================================================

export const getEmployeePayrollHistory = async (
  employeeId
) => {
  const payslips =
    await getEmployeePayslips(
      employeeId
    );

  const completePayslips = [];

  for (const payslip of payslips) {
    const earnings =
      await getPayslipEarningsByPayslip(
        payslip.id
      );

    const deductions =
      await getPayslipDeductionsByPayslip(
        payslip.id
      );

    completePayslips.push({
      ...payslip,
      earnings,
      deductions,
    });
  }

  return completePayslips;
};

// ============================================================
// Update Payslip
// ============================================================

export const updateCompletePayslip = async (
  payslipId,
  data
) => {
  const existing =
    await getPayslipById(payslipId);

  if (!existing) {
    throw new Error("Payslip not found.");
  }

  // ----------------------------------------------------------
  // Do not allow modification of a paid payslip
  // ----------------------------------------------------------

  if (existing.status === "Paid") {
    throw new Error(
      "Paid payslips cannot be modified."
    );
  }

  const updated = await updatePayslip(
    payslipId,
    data
  );

  if (!updated) {
    throw new Error(
      "Failed to update payslip."
    );
  }

  return getCompletePayslip(
    payslipId
  );
};

// ============================================================
// Mark Payslip As Paid
// ============================================================

export const payPayslip = async (
  payslipId
) => {
  const existing =
    await getPayslipById(payslipId);

  if (!existing) {
    throw new Error("Payslip not found.");
  }

  if (existing.status === "Paid") {
    throw new Error(
      "Payslip is already marked as paid."
    );
  }

  if (existing.status === "Cancelled") {
    throw new Error(
      "Cancelled payslips cannot be paid."
    );
  }

  const paid =
    await markPayslipPaid(
      payslipId
    );

  if (!paid) {
    throw new Error(
      "Failed to mark payslip as paid."
    );
  }

  return getCompletePayslip(
    payslipId
  );
};

// ============================================================
// Delete Payslip
// ============================================================

export const removePayslip = async (
  payslipId
) => {
  const existing =
    await getPayslipById(payslipId);

  if (!existing) {
    throw new Error("Payslip not found.");
  }

  if (existing.status === "Paid") {
    throw new Error(
      "Paid payslips cannot be deleted."
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // --------------------------------------------------------
    // Delete earnings
    // --------------------------------------------------------

    await client.query(
      `
      DELETE FROM payslip_earnings
      WHERE payslip_id=$1
      `,
      [payslipId]
    );

    // --------------------------------------------------------
    // Delete deductions
    // --------------------------------------------------------

    await client.query(
      `
      DELETE FROM payslip_deductions
      WHERE payslip_id=$1
      `,
      [payslipId]
    );

    // --------------------------------------------------------
    // Delete payslip
    // --------------------------------------------------------

    const result = await client.query(
      `
      DELETE FROM payslips
      WHERE id=$1
      RETURNING *;
      `,
      [payslipId]
    );

    if (result.rows.length === 0) {
      throw new Error(
        "Payslip not found."
      );
    }

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};

// ============================================================
// Calculate Payslip Totals
// ============================================================

export const calculatePayslipTotals = async (
  payslipId
) => {
  const payslip =
    await getPayslipById(payslipId);

  if (!payslip) {
    throw new Error(
      "Payslip not found."
    );
  }

  const earnings =
    await getPayslipEarningsByPayslip(
      payslipId
    );

  const deductions =
    await getPayslipDeductionsByPayslip(
      payslipId
    );

  // ----------------------------------------------------------
  // Earnings
  // ----------------------------------------------------------

  const totalEarnings = earnings.reduce(
    (total, earning) =>
      total + Number(earning.amount || 0),
    0
  );

  // ----------------------------------------------------------
  // Deductions
  // ----------------------------------------------------------

  const totalDeductions = deductions.reduce(
    (total, deduction) =>
      total + Number(deduction.amount || 0),
    0
  );

  // ----------------------------------------------------------
  // Net Pay
  // ----------------------------------------------------------

  const netPay =
    Number(payslip.gross_pay || 0) -
    totalDeductions -
    Number(
      payslip.unpaid_leave_deduction || 0
    );

  return {
    payslip_id: payslipId,

    basic_salary: Number(
      payslip.basic_salary || 0
    ),

    total_earnings: roundMoney(
      totalEarnings
    ),

    gross_pay: Number(
      payslip.gross_pay || 0
    ),

    total_deductions: roundMoney(
      totalDeductions
    ),

    unpaid_leave_deduction:
      Number(
        payslip.unpaid_leave_deduction || 0
      ),

    calculated_net_pay:
      roundMoney(netPay),

    stored_net_pay:
      Number(payslip.net_pay || 0),

    difference: roundMoney(
      netPay -
      Number(payslip.net_pay || 0)
    ),
  };
};

// ============================================================
// Round Money
// ============================================================

const roundMoney = (amount) => {
  return Math.round(
    (Number(amount) + Number.EPSILON) * 100
  ) / 100;
};