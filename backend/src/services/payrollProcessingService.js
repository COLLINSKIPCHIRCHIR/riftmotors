import pool from "../config/db.js";

import {
  calculateEmployeePayroll,
} from "./payroll/payrollCalculator.js";

import {
  isEmployeeEligibleForPayroll,
} from "./payroll/payrollHelpers.js";


// ============================================================
// GET PAYROLL PERIOD
// ============================================================

const getPayrollPeriod = async (
  client,
  payrollPeriodId
) => {
  const result = await client.query(
    `
    SELECT *
    FROM payroll_periods
    WHERE id=$1
    `,
    [payrollPeriodId]
  );

  if (!result.rows.length) {
    throw new Error(
      "Payroll period not found."
    );
  }

  return result.rows[0];
};


// ============================================================
// GET EMPLOYEES
// ============================================================

const getEmployees = async (client) => {
  const result = await client.query(
    `
    SELECT *
    FROM employees
    WHERE is_active=true
    ORDER BY first_name,last_name
    `
  );

  return result.rows;
};


// ============================================================
// CREATE PAYSLIP
// ============================================================

const createPayslip = async (
  client,
  calculation
) => {
  const result = await client.query(
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
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,$12,$13,$14
    )
    RETURNING *
    `,
    [
      calculation.payroll_period.id,
      calculation.employee.id,
      calculation.basic_salary,
      calculation.total_allowances,
      calculation.gross_pay,
      calculation.unpaid_leave_days,
      calculation.unpaid_leave_deduction,
      calculation.taxable_pay,
      calculation.paye_amount,
      calculation.total_statutory_deductions,
      calculation.total_other_deductions,
      calculation.net_pay,
      "Draft",
      null,
    ]
  );

  return result.rows[0];
};


// ============================================================
// CREATE PAYSLIP EARNINGS
// ============================================================

const createPayslipEarnings = async (
  client,
  payslipId,
  earnings
) => {
  for (const earning of earnings) {
    await client.query(
      `
      INSERT INTO payslip_earnings
      (
        payslip_id,
        description,
        amount
      )
      VALUES ($1,$2,$3)
      `,
      [
        payslipId,
        earning.description,
        earning.amount,
      ]
    );
  }
};


// ============================================================
// CREATE PAYSLIP DEDUCTIONS
// ============================================================

const createPayslipDeductions = async (
  client,
  payslipId,
  deductions
) => {
  for (const deduction of deductions) {
    await client.query(
      `
      INSERT INTO payslip_deductions
      (
        payslip_id,
        deduction_type_id,
        description,
        amount
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        payslipId,
        deduction.deduction_type_id,
        deduction.description,
        deduction.amount,
      ]
    );
  }
};


// ============================================================
// CHECK EXISTING PAYSLIP
// ============================================================

const getExistingPayslip = async (
  client,
  payrollPeriodId,
  employeeId
) => {
  const result = await client.query(
    `
    SELECT *
    FROM payslips
    WHERE payroll_period_id=$1
      AND employee_id=$2
    LIMIT 1
    `,
    [
      payrollPeriodId,
      employeeId,
    ]
  );

  return result.rows[0] || null;
};


// ============================================================
// DELETE EXISTING DRAFT PAYSLIP
// ============================================================
//
// Must delete child rows (earnings/deductions) before the parent
// payslip row, otherwise this throws a foreign-key violation on
// re-processing an Open period whose draft payslips already have
// earnings/deductions attached.
//

const deleteExistingDraftPayslip = async (
  client,
  payslip
) => {
  if (!payslip) {
    return;
  }

  if (payslip.status !== "Draft") {
    throw new Error(
      `Payslip ${payslip.id} has already been processed and cannot be regenerated.`
    );
  }

  await client.query(
    `
    DELETE FROM payslip_earnings
    WHERE payslip_id=$1
    `,
    [payslip.id]
  );

  await client.query(
    `
    DELETE FROM payslip_deductions
    WHERE payslip_id=$1
    `,
    [payslip.id]
  );

  await client.query(
    `
    DELETE FROM payslips
    WHERE id=$1
    `,
    [payslip.id]
  );
};


// ============================================================
// PREVIEW PAYROLL
// ============================================================

export const previewPayroll = async (
  payrollPeriodId
) => {
  const client = await pool.connect();

  try {
    const payrollPeriod =
      await getPayrollPeriod(
        client,
        payrollPeriodId
      );

    if (
      payrollPeriod.status !== "Open"
    ) {
      throw new Error(
        "Only an Open payroll period can be previewed."
      );
    }

    const employees =
      await getEmployees(client);

    const calculations = [];

    const errors = [];

    for (const employee of employees) {
      if (
        !isEmployeeEligibleForPayroll(
          employee,
          payrollPeriod
        )
      ) {
        continue;
      }

      try {
        const calculation =
          await calculateEmployeePayroll({
            employee,
            payrollPeriod,
          });

        calculations.push(
          calculation
        );
      } catch (error) {
        errors.push({
          employee_id:
            employee.id,

          employee_number:
            employee.employee_number,

          employee_name:
            `${employee.first_name} ${employee.last_name}`,

          error:
            error.message,
        });
      }
    }

    return {
      payroll_period:
        payrollPeriod,

      employee_count:
        calculations.length,

      error_count:
        errors.length,

      calculations,

      errors,
    };
  } finally {
    client.release();
  }
};


// ============================================================
// PROCESS PAYROLL
// ============================================================

export const processPayroll = async ({
  payrollPeriodId,
  processedBy,
}) => {
  const client = await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    // --------------------------------------------------------
    // PERIOD
    // --------------------------------------------------------

    const payrollPeriod =
      await getPayrollPeriod(
        client,
        payrollPeriodId
      );

    if (!payrollPeriod) {
      throw new Error(
        "Payroll period not found."
      );
    }

    if (
      payrollPeriod.status !== "Open"
    ) {
      throw new Error(
        `Payroll period is already ${payrollPeriod.status}.`
      );
    }


    // --------------------------------------------------------
    // EMPLOYEES
    // --------------------------------------------------------

    const employees =
      await getEmployees(client);

    const results = [];

    const errors = [];


    // --------------------------------------------------------
    // CALCULATE
    // --------------------------------------------------------

    for (const employee of employees) {
      if (
        !isEmployeeEligibleForPayroll(
          employee,
          payrollPeriod
        )
      ) {
        continue;
      }

      try {
        const calculation =
          await calculateEmployeePayroll({
            employee,
            payrollPeriod,
          });


        // ----------------------------------------------------
        // EXISTING PAYSLIP
        // ----------------------------------------------------

        const existingPayslip =
          await getExistingPayslip(
            client,
            payrollPeriod.id,
            employee.id
          );

        await deleteExistingDraftPayslip(
          client,
          existingPayslip
        );


        // ----------------------------------------------------
        // CREATE PAYSLIP
        // ----------------------------------------------------

        const payslip =
          await createPayslip(
            client,
            calculation
          );


        // ----------------------------------------------------
        // EARNINGS
        // ----------------------------------------------------

        await createPayslipEarnings(
          client,
          payslip.id,
          calculation.earnings
        );


        // ----------------------------------------------------
        // DEDUCTIONS
        // ----------------------------------------------------

        await createPayslipDeductions(
          client,
          payslip.id,
          calculation.deductions
        );


        results.push({
          employee_id:
            employee.id,

          employee_number:
            employee.employee_number,

          employee_name:
            `${employee.first_name} ${employee.last_name}`,

          payslip_id:
            payslip.id,

          gross_pay:
            calculation.gross_pay,

          net_pay:
            calculation.net_pay,
        });

      } catch (error) {
        errors.push({
          employee_id:
            employee.id,

          employee_number:
            employee.employee_number,

          employee_name:
            `${employee.first_name} ${employee.last_name}`,

          error:
            error.message,
        });
      }
    }


    // --------------------------------------------------------
    // STOP IF ANY EMPLOYEE FAILED
    // --------------------------------------------------------

    if (errors.length > 0) {
      throw new Error(
        `Payroll could not be completed. ${errors.length} employee(s) have calculation errors.`
      );
    }


    // --------------------------------------------------------
    // UPDATE PAYROLL PERIOD
    // --------------------------------------------------------

    await client.query(
      `
      UPDATE payroll_periods
      SET
        status='Processed',
        processed_at=NOW(),
        processed_by=$1
      WHERE id=$2
      `,
      [
        processedBy || null,
        payrollPeriod.id,
      ]
    );


    // --------------------------------------------------------
    // COMMIT
    // --------------------------------------------------------

    await client.query(
      "COMMIT"
    );


    return {
      payroll_period_id:
        payrollPeriod.id,

      status:
        "Processed",

      employee_count:
        results.length,

      payslips:
        results,
    };

  } catch (error) {

    await client.query(
      "ROLLBACK"
    );

    throw error;

  } finally {

    client.release();
  }
};


// ============================================================
// GET PAYROLL SUMMARY
// ============================================================

export const getPayrollSummary = async (
  payrollPeriodId
) => {
  const result = await pool.query(
    `
    SELECT
      COUNT(*) AS employee_count,

      COALESCE(
        SUM(basic_salary),
        0
      ) AS basic_salary,

      COALESCE(
        SUM(total_allowances),
        0
      ) AS total_allowances,

      COALESCE(
        SUM(gross_pay),
        0
      ) AS gross_pay,

      COALESCE(
        SUM(paye_amount),
        0
      ) AS paye_amount,

      COALESCE(
        SUM(total_statutory_deductions),
        0
      ) AS statutory_deductions,

      COALESCE(
        SUM(total_other_deductions),
        0
      ) AS other_deductions,

      COALESCE(
        SUM(net_pay),
        0
      ) AS net_pay

    FROM payslips

    WHERE payroll_period_id=$1
    `,
    [payrollPeriodId]
  );

  return result.rows[0];
};


// ============================================================
// GET PROCESSING RESULT
// ============================================================

export const getPayrollProcessingResult = async (
  payrollPeriodId
) => {
  const periodResult =
    await pool.query(
      `
      SELECT *
      FROM payroll_periods
      WHERE id=$1
      `,
      [payrollPeriodId]
    );

  if (!periodResult.rows.length) {
    throw new Error(
      "Payroll period not found."
    );
  }

  const payslipResult =
    await pool.query(
      `
      SELECT
        p.*,

        e.employee_number,
        e.first_name,
        e.last_name,

        pp.period_label

      FROM payslips p

      JOIN employees e
        ON e.id=p.employee_id

      JOIN payroll_periods pp
        ON pp.id=p.payroll_period_id

      WHERE p.payroll_period_id=$1

      ORDER BY
        e.first_name,
        e.last_name
      `,
      [payrollPeriodId]
    );

  const summary =
    await getPayrollSummary(
      payrollPeriodId
    );

  return {
    payroll_period:
      periodResult.rows[0],

    summary,

    payslips:
      payslipResult.rows,
  };
};