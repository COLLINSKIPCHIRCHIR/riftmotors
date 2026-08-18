import pool from "../config/db.js";

// ==========================================
// Create Payslip
// ==========================================

export const createPayslip = async (data) => {
  const result = await pool.query(
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
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
    )
    RETURNING *;
    `,
    [
      data.payroll_period_id,
      data.employee_id,
      data.basic_salary,
      data.total_allowances,
      data.gross_pay,
      data.unpaid_leave_days || 0,
      data.unpaid_leave_deduction || 0,
      data.taxable_pay,
      data.paye_amount,
      data.total_statutory_deductions,
      data.total_other_deductions,
      data.net_pay,
      data.status || "Draft",
      data.paid_at || null,
    ]
  );

  return result.rows[0];
};

// ==========================================
// Get All Payslips
// ==========================================

export const getPayslips = async () => {
  const result = await pool.query(`
    SELECT
        p.*,
        pp.period_label,
        e.employee_number,
        e.first_name,
        e.last_name
    FROM payslips p
    JOIN payroll_periods pp
        ON p.payroll_period_id = pp.id
    JOIN employees e
        ON p.employee_id = e.id
    ORDER BY p.created_at DESC;
  `);

  return result.rows;
};

// ==========================================
// Get One Payslip
// ==========================================

export const getPayslipById = async (id) => {
  const result = await pool.query(
    `
    SELECT
        p.*,
        pp.period_label,
        e.employee_number,
        e.first_name,
        e.last_name
    FROM payslips p
    JOIN payroll_periods pp
        ON p.payroll_period_id = pp.id
    JOIN employees e
        ON p.employee_id = e.id
    WHERE p.id=$1;
    `,
    [id]
  );

  return result.rows[0];
};

// ==========================================
// Payslips By Payroll Period
// ==========================================

export const getPayslipsByPayrollPeriod = async (
  payrollPeriodId
) => {
  const result = await pool.query(
    `
    SELECT
        p.*,
        e.employee_number,
        e.first_name,
        e.last_name
    FROM payslips p
    JOIN employees e
        ON e.id=p.employee_id
    WHERE payroll_period_id=$1
    ORDER BY e.first_name,e.last_name;
    `,
    [payrollPeriodId]
  );

  return result.rows;
};

// ==========================================
// Employee Payslips
// ==========================================

export const getEmployeePayslips = async (
  employeeId
) => {
  const result = await pool.query(
    `
    SELECT
        p.*,
        pp.period_label
    FROM payslips p
    JOIN payroll_periods pp
      ON pp.id=p.payroll_period_id
    WHERE employee_id=$1
    ORDER BY pp.start_date DESC;
    `,
    [employeeId]
  );

  return result.rows;
};

// ==========================================
// Update
// ==========================================

export const updatePayslip = async (
  id,
  data
) => {
  const result = await pool.query(
    `
    UPDATE payslips
    SET
        basic_salary=$1,
        total_allowances=$2,
        gross_pay=$3,
        unpaid_leave_days=$4,
        unpaid_leave_deduction=$5,
        taxable_pay=$6,
        paye_amount=$7,
        total_statutory_deductions=$8,
        total_other_deductions=$9,
        net_pay=$10,
        status=$11,
        paid_at=$12
    WHERE id=$13
    RETURNING *;
    `,
    [
      data.basic_salary,
      data.total_allowances,
      data.gross_pay,
      data.unpaid_leave_days,
      data.unpaid_leave_deduction,
      data.taxable_pay,
      data.paye_amount,
      data.total_statutory_deductions,
      data.total_other_deductions,
      data.net_pay,
      data.status,
      data.paid_at,
      id,
    ]
  );

  return result.rows[0];
};

// ==========================================
// Mark as Paid
// ==========================================

export const markPayslipPaid = async (
  id
) => {
  const result = await pool.query(
    `
    UPDATE payslips
    SET
        status='Paid',
        paid_at=NOW()
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};

// ==========================================
// Delete
// ==========================================

export const deletePayslip = async (
  id
) => {
  const result = await pool.query(
    `
    DELETE FROM payslips
    WHERE id=$1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};