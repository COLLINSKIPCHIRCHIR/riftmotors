import {
  getPayeBandsByDate,
} from "../../models/payeTaxBandModel.js";

import {
  getPayePersonalReliefByDate,
} from "../../models/payePersonalReliefModel.js";

// ============================================================
// Calculate PAYE
// ============================================================

export const calculatePAYE = async ({
  taxableIncome,
  payrollDate,
}) => {
  const income = Number(taxableIncome || 0);

  if (income <= 0) {
    return {
      taxableIncome: 0,
      grossTax: 0,
      personalRelief: 0,
      paye: 0,
      taxBands: [],
    };
  }

  if (!payrollDate) {
    throw new Error(
      "Payroll date is required when calculating PAYE."
    );
  }

  // ----------------------------------------------------------
  // Get tax bands applicable on payroll date
  // ----------------------------------------------------------

  const taxBands = await getPayeBandsByDate(payrollDate);

  if (!taxBands || taxBands.length === 0) {
    throw new Error(
      `No PAYE tax bands found for payroll date ${payrollDate}.`
    );
  }

  // ----------------------------------------------------------
  // Calculate gross tax progressively
  // ----------------------------------------------------------

  let remainingIncome = income;
  let grossTax = 0;

  const appliedBands = [];

  for (const band of taxBands) {
    if (remainingIncome <= 0) {
      break;
    }

    const lowerLimit = Number(band.lower_limit || 0);

    const upperLimit =
      band.upper_limit === null ||
      band.upper_limit === undefined
        ? null
        : Number(band.upper_limit);

    const rate = Number(band.rate_percentage || 0);

    // --------------------------------------------------------
    // Determine amount falling inside this band
    // --------------------------------------------------------

    let taxableInBand;

    if (upperLimit === null) {
      taxableInBand = remainingIncome;
    } else {
      const bandWidth = upperLimit - lowerLimit;

      taxableInBand = Math.min(
        remainingIncome,
        Math.max(bandWidth, 0)
      );
    }

    if (taxableInBand <= 0) {
      continue;
    }

    const taxForBand =
      taxableInBand * (rate / 100);

    grossTax += taxForBand;

    remainingIncome -= taxableInBand;

    appliedBands.push({
      band_order: band.band_order,
      lower_limit: lowerLimit,
      upper_limit: upperLimit,
      rate_percentage: rate,
      taxable_amount: taxableInBand,
      tax_amount: taxForBand,
    });
  }

  // ----------------------------------------------------------
  // Get personal relief applicable on payroll date
  // ----------------------------------------------------------

  const relief =
    await getPayePersonalReliefByDate(payrollDate);

  const personalRelief = relief
    ? Number(relief.monthly_relief_amount || 0)
    : 0;

  // ----------------------------------------------------------
  // PAYE = Gross Tax - Personal Relief
  // ----------------------------------------------------------

  const paye = Math.max(
    grossTax - personalRelief,
    0
  );

  return {
    taxableIncome: income,

    grossTax: roundMoney(grossTax),

    personalRelief: roundMoney(personalRelief),

    paye: roundMoney(paye),

    taxBands: appliedBands.map((band) => ({
      ...band,
      taxable_amount: roundMoney(
        band.taxable_amount
      ),
      tax_amount: roundMoney(
        band.tax_amount
      ),
    })),
  };
};

// ============================================================
// Calculate PAYE From Gross Taxable Income
// ============================================================

export const calculatePAYEFromGross = async ({
  grossIncome,
  payrollDate,
}) => {
  return calculatePAYE({
    taxableIncome: grossIncome,
    payrollDate,
  });
};

// ============================================================
// Get Current PAYE Configuration
// ============================================================

export const getCurrentPAYEConfiguration = async (
  payrollDate
) => {
  if (!payrollDate) {
    throw new Error(
      "Payroll date is required."
    );
  }

  const taxBands =
    await getPayeBandsByDate(payrollDate);

  const personalRelief =
    await getPayePersonalReliefByDate(
      payrollDate
    );

  return {
    payrollDate,

    taxBands,

    personalRelief: personalRelief
      ? {
          id: personalRelief.id,
          effective_from:
            personalRelief.effective_from,
          effective_to:
            personalRelief.effective_to,
          monthly_relief_amount:
            Number(
              personalRelief.monthly_relief_amount || 0
            ),
        }
      : null,
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