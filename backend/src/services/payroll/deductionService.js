import pool from "../../config/db.js";

import {
  toNumber,
  roundMoney,
  normalizeCalculationMethod,
  createDeduction,
} from "./payrollHelpers.js";

// ============================================================
// Get Deduction Type
// ============================================================

export const getDeductionType = async (deductionTypeId) => {
  const result = await pool.query(
    `
    SELECT
        id,
        code,
        name,
        calculation_method,
        reduces_taxable_income,
        is_statutory,
        is_active
    FROM deduction_types
    WHERE id=$1
    `,
    [deductionTypeId]
  );

  return result.rows[0];
};

// ============================================================
// Apply Minimum / Maximum Limits
// ============================================================

const applyLimits = (amount, rate) => {
  let result = Number(amount || 0);

  if (rate?.minimum_amount !== null && rate?.minimum_amount !== undefined) {
    result = Math.max(result, Number(rate.minimum_amount));
  }

  if (rate?.maximum_amount !== null && rate?.maximum_amount !== undefined) {
    result = Math.min(result, Number(rate.maximum_amount));
  }

  return result;
};

// ============================================================
// RECURRING DEDUCTIONS (canonical path used by payrollCalculator)
// ============================================================
//
// Handles FIXED, PERCENTAGE and TIERED/PROGRESSIVE deductions
// configured per employee in employee_recurring_deductions.
// Statutory deductions (NSSF/SHIF/Housing Levy) are expected to
// be seeded here per employee, same as any other deduction.
//

const getRecurringDeductionsForEmployee = async (
  employeeId,
  payrollDate
) => {
  const result = await pool.query(
    `
    SELECT
      erd.*,
      dt.code,
      dt.name AS deduction_type_name,
      dt.calculation_method,
      dt.reduces_taxable_income,
      dt.is_statutory
    FROM employee_recurring_deductions erd
    JOIN deduction_types dt
      ON dt.id = erd.deduction_type_id
    WHERE erd.employee_id=$1
      AND erd.is_active=true
      AND erd.start_date <= $2
      AND (erd.end_date IS NULL OR erd.end_date >= $2)
      AND dt.is_active=true
    ORDER BY erd.id
    `,
    [employeeId, payrollDate]
  );

  return result.rows;
};

// ------------------------------------------------------------
// Rate bands for a deduction type on a given date. Ordered by
// lower_limit so TIERED/PROGRESSIVE deductions can walk bands.
// ------------------------------------------------------------

const getDeductionRateBands = async (deductionTypeId, payrollDate) => {
  const result = await pool.query(
    `
    SELECT *
    FROM deduction_rate_versions
    WHERE deduction_type_id=$1
      AND effective_from <= $2
      AND (effective_to IS NULL OR effective_to >= $2)
    ORDER BY lower_limit ASC NULLS FIRST
    `,
    [deductionTypeId, payrollDate]
  );

  return result.rows;
};

const calculateDeductionAmount = ({ deduction, rates, calculationBase }) => {
  const method = normalizeCalculationMethod(deduction.calculation_method);

  // Fixed deductions use the employee-configured amount directly
  if (method === "FIXED" || method === "FIXED_AMOUNT") {
    return roundMoney(deduction.amount);
  }

  if (!rates.length) {
    throw new Error(
      `No rate configuration found for deduction "${deduction.deduction_type_name}".`
    );
  }

  const base = Math.max(0, toNumber(calculationBase));

  if (method === "PERCENTAGE" || method === "PERCENT") {
    const rate = rates[0];
    const amount = (base * toNumber(rate.rate_percentage)) / 100;
    return roundMoney(applyLimits(amount, rate));
  }

  if (method === "TIERED" || method === "PROGRESSIVE" || method === "FORMULA") {
    let total = 0;

    for (const rate of rates) {
      const lower =
        rate.lower_limit === null ? 0 : toNumber(rate.lower_limit);
      const upper =
        rate.upper_limit === null ? base : toNumber(rate.upper_limit);

      if (base <= lower) continue;

      const taxableInBand = Math.min(base, upper) - lower;
      if (taxableInBand <= 0) continue;

      const bandAmount = (taxableInBand * toNumber(rate.rate_percentage)) / 100;

      total += applyLimits(bandAmount, rate);
    }

    return roundMoney(total);
  }

  throw new Error(
    `Unsupported deduction calculation method "${deduction.calculation_method}".`
  );
};

/**
 * Canonical entry point. Call once per employee per payroll run.
 * calculationBase is typically gross pay.
 */
export const calculateEmployeeRecurringDeductions = async ({
  employeeId,
  payrollDate,
  calculationBase,
}) => {
  const recurring = await getRecurringDeductionsForEmployee(
    employeeId,
    payrollDate
  );

  const items = [];

  let statutoryDeductionTotal = 0;
  let otherDeductionTotal = 0;
  let taxableDeductions = 0;

  for (const deduction of recurring) {
    const rates = await getDeductionRateBands(
      deduction.deduction_type_id,
      payrollDate
    );

    const amount = calculateDeductionAmount({
      deduction,
      rates,
      calculationBase,
    });

    if (amount <= 0) continue;

    items.push(
      createDeduction({
        deduction_type_id: deduction.deduction_type_id,
        description: deduction.name || deduction.deduction_type_name,
        amount,
      })
    );

    if (deduction.reduces_taxable_income) {
      taxableDeductions += amount;
    }

    if (deduction.is_statutory) {
      statutoryDeductionTotal += amount;
    } else {
      otherDeductionTotal += amount;
    }
  }

  return {
    deductions: items,
    statutoryDeductionTotal: roundMoney(statutoryDeductionTotal),
    otherDeductionTotal: roundMoney(otherDeductionTotal),
    taxableDeductions: roundMoney(taxableDeductions),
  };
};

// ============================================================
// CONFIGURED DEDUCTION (single-rate lookup)
// ============================================================
//
// Not currently called by payrollCalculator — kept available in
// case you later want to auto-apply a statutory deduction to
// every employee regardless of whether a recurring-deduction
// row exists for them, instead of seeding rows per employee.
//

const getApplicableRateVersion = async (deductionTypeId, payrollDate) => {
  const result = await pool.query(
    `
    SELECT *
    FROM deduction_rate_versions
    WHERE deduction_type_id=$1
      AND effective_from <= $2
      AND (effective_to IS NULL OR effective_to >= $2)
    ORDER BY effective_from DESC
    LIMIT 1
    `,
    [deductionTypeId, payrollDate]
  );

  return result.rows[0];
};

export const calculateConfiguredDeduction = async ({
  deductionTypeId,
  baseAmount,
  payrollDate,
}) => {
  const deductionType = await getDeductionType(deductionTypeId);

  if (!deductionType) {
    throw new Error(`Deduction type ${deductionTypeId} not found.`);
  }

  if (deductionType.is_active === false) {
    return { amount: 0, deductionType, rateVersion: null };
  }

  const rateVersion = await getApplicableRateVersion(
    deductionTypeId,
    payrollDate
  );

  if (!rateVersion) {
    throw new Error(
      `No active rate version found for deduction type "${deductionType.name}" on ${payrollDate}.`
    );
  }

  const method = normalizeCalculationMethod(deductionType.calculation_method);
  const base = Math.max(0, toNumber(baseAmount));

  let amount = 0;

  if (method === "FIXED") {
    amount = toNumber(rateVersion.fixed_amount);
  } else {
    amount = (base * toNumber(rateVersion.rate_percentage)) / 100;
  }

  amount = roundMoney(applyLimits(amount, rateVersion));

  return { amount, deductionType, rateVersion };
};

export const getDeductionRate = async (deductionTypeId, payrollDate) => {
  return getApplicableRateVersion(deductionTypeId, payrollDate);
};