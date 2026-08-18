import { useEffect, useState } from "react";

import {
  getEmployeeRecurringDeductions,
  createEmployeeRecurringDeduction,
  updateEmployeeRecurringDeduction,
  deleteEmployeeRecurringDeduction,
  getEmployees,
  getDeductionTypes,
} from "../../../api/hrApi";

import EmployeeRecurringDeductionTable from "./EmployeeRecurringDeductionTable";
import EmployeeRecurringDeductionModal from "./EmployeeRecurringDeductionModal";

export default function EmployeeRecurringDeductions() {
  const [deductions, setDeductions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedDeduction, setSelectedDeduction] =
    useState(null);

  // ==========================================
  // Load Data
  // ==========================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        deductionsRes,
        employeesRes,
        deductionTypesRes,
      ] = await Promise.all([
        getEmployeeRecurringDeductions(),
        getEmployees(),
        getDeductionTypes(),
      ]);

      setDeductions(deductionsRes.data);
      setEmployees(employeesRes.data);
      setDeductionTypes(deductionTypesRes.data);

    } catch (err) {
      console.error(err);
      alert(
        "Failed to load recurring deductions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // CRUD
  // ==========================================

  const handleAdd = () => {
    setSelectedDeduction(null);
    setShowModal(true);
  };

  const handleEdit = (deduction) => {
    setSelectedDeduction(deduction);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this recurring deduction?"
      )
    )
      return;

    try {
      await deleteEmployeeRecurringDeduction(id);

      loadData();

    } catch (err) {
      console.error(err);
      alert("Failed to delete deduction.");
    }
  };

  const handleSave = async (form) => {
    try {
      if (selectedDeduction) {
        await updateEmployeeRecurringDeduction(
          selectedDeduction.id,
          form
        );
      } else {
        await createEmployeeRecurringDeduction(
          form
        );
      }

      setShowModal(false);

      loadData();

    } catch (err) {
      console.error(err);
      alert("Failed to save deduction.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading Recurring Deductions...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold">
            Employee Recurring Deductions
          </h1>

          <p className="text-slate-500">
            Manage recurring payroll deductions
            including SACCO, loans, welfare,
            pension, insurance and other monthly
            deductions.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Deduction
        </button>

      </div>

      <EmployeeRecurringDeductionTable
        deductions={deductions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <EmployeeRecurringDeductionModal
          deduction={selectedDeduction}
          employees={employees}
          deductionTypes={deductionTypes}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}