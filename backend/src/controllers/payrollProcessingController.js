import {
  previewPayroll,
  processPayroll,
  getPayrollSummary,
  getPayrollProcessingResult,
} from "../services/payrollProcessingService.js";


// ============================================================
// PREVIEW PAYROLL
// ============================================================

export const previewPayrollController = async (
  req,
  res
) => {
  try {
    const { payrollPeriodId } =
      req.params;

    if (!payrollPeriodId) {
      return res.status(400).json({
        success: false,
        message:
          "Payroll period ID is required.",
      });
    }

    const result =
      await previewPayroll(
        payrollPeriodId
      );

    return res.status(200).json({
      success: true,
      message:
        "Payroll preview generated successfully.",
      data: result,
    });

  } catch (error) {

    console.error(
      "Payroll preview error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// PROCESS PAYROLL
// ============================================================

export const processPayrollController = async (
  req,
  res
) => {
  try {
    const { payrollPeriodId } =
      req.params;

    if (!payrollPeriodId) {
      return res.status(400).json({
        success: false,
        message:
          "Payroll period ID is required.",
      });
    }

    /*
     * Adjust this depending on your authentication
     * middleware. This supports the common req.user.id.
     */
    const processedBy =
      req.user?.id ||
      req.body?.processed_by ||
      null;

    const result =
      await processPayroll({
        payrollPeriodId,
        processedBy,
      });

    return res.status(200).json({
      success: true,
      message:
        "Payroll processed successfully.",
      data: result,
    });

  } catch (error) {

    console.error(
      "Payroll processing error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================
// PAYROLL SUMMARY
// ============================================================

export const getPayrollSummaryController =
  async (req, res) => {
    try {
      const { payrollPeriodId } =
        req.params;

      if (!payrollPeriodId) {
        return res.status(400).json({
          success: false,
          message:
            "Payroll period ID is required.",
        });
      }

      const result =
        await getPayrollSummary(
          payrollPeriodId
        );

      return res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

      console.error(
        "Payroll summary error:",
        error
      );

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };


// ============================================================
// PROCESSING RESULT
// ============================================================

export const getPayrollProcessingResultController =
  async (req, res) => {
    try {
      const { payrollPeriodId } =
        req.params;

      if (!payrollPeriodId) {
        return res.status(400).json({
          success: false,
          message:
            "Payroll period ID is required.",
        });
      }

      const result =
        await getPayrollProcessingResult(
          payrollPeriodId
        );

      return res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

      console.error(
        "Payroll result error:",
        error
      );

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };