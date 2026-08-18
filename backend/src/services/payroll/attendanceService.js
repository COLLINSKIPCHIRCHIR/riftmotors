import {
  getAttendanceSummaryByEmployee,
} from "../../models/employeeAttendanceModel.js";

// =============================================
// Get Attendance Summary
// =============================================

export const getEmployeeAttendance = async (
  employeeId,
  startDate,
  endDate
) => {
  const summary =
    await getAttendanceSummaryByEmployee(
      employeeId,
      startDate,
      endDate
    );

  return {
    attendanceDays:
      Number(summary?.attendance_days || 0),

    presentDays:
      Number(summary?.present_days || 0),

    absentDays:
      Number(summary?.absent_days || 0),

    leaveDays:
      Number(summary?.leave_days || 0),

    halfDays:
      Number(summary?.half_days || 0),

    workedHours:
      Number(summary?.worked_hours || 0),

    overtimeHours:
      Number(summary?.overtime_hours || 0),
  };
};

// =============================================
// Calculate Attendance Deduction Days
// =============================================

export const calculateAttendanceDeductionDays = (
  attendance
) => {
  const absentDays =
    Number(attendance?.absentDays || 0);

  const halfDays =
    Number(attendance?.halfDays || 0);

  return absentDays + halfDays * 0.5;
};

// =============================================
// Calculate Overtime Hours
// =============================================

export const calculateOvertimeHours = (
  attendance
) => {
  return Number(
    attendance?.overtimeHours || 0
  );
};

// =============================================
// Build Attendance Breakdown
// =============================================

export const buildAttendanceBreakdown = async (
  employeeId,
  startDate,
  endDate
) => {
  const attendance =
    await getEmployeeAttendance(
      employeeId,
      startDate,
      endDate
    );

  const attendanceDeductionDays =
    calculateAttendanceDeductionDays(
      attendance
    );

  const overtimeHours =
    calculateOvertimeHours(
      attendance
    );

  return {
    ...attendance,

    attendanceDeductionDays,

    overtimeHours,
  };
};