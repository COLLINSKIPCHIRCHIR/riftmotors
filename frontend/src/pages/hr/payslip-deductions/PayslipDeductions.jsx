import { useEffect, useState } from "react";

import {
  getPayslipDeductions,
  createPayslipDeduction,
  updatePayslipDeduction,
  deletePayslipDeduction,
} from "../../../api/hrApi";

import PayslipDeductionsTable from "./PayslipDeductionsTable";
import PayslipDeductionsModal from "./PayslipDeductionsModal";

export default function PayslipDeductions() {
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedDeduction, setSelectedDeduction] =
    useState(null);

  // ==========================================
  // Load Deductions
  // ==========================================

  const loadDeductions = async () => {
    try {
      setLoading(true);

      const res =
        await getPayslipDeductions();

      setDeductions(res.data);

    } catch (err) {
      console.error(err);

      alert("Failed to load payslip deductions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeductions();
  }, []);

  // ==========================================
  // Add
  // ==========================================

  const handleAdd = () => {
    setSelectedDeduction(null);
    setShowModal(true);
  };

  // ==========================================
  // Edit
  // ==========================================

  const handleEdit = (deduction) => {
    setSelectedDeduction(deduction);
    setShowModal(true);
  };

  // ==========================================
  // Delete
  // ==========================================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this deduction?"
      )
    )
      return;

    try {
      await deletePayslipDeduction(id);

      loadDeductions();

    } catch (err) {
      console.error(err);

      alert("Failed to delete deduction.");
    }
  };

  // ==========================================
  // Save
  // ==========================================

  const handleSave = async (form) => {
    try {
      if (selectedDeduction) {
        await updatePayslipDeduction(
          selectedDeduction.id,
          form
        );
      } else {
        await createPayslipDeduction(form);
      }

      setShowModal(false);

      loadDeductions();

    } catch (err) {
      console.error(err);

      alert("Failed to save deduction.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading Payslip Deductions...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold">
            Payslip Deductions
          </h1>

          <p className="text-slate-500">
            Manage deduction items applied to employee payslips.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Deduction
        </button>

      </div>

      <PayslipDeductionsTable
        deductions={deductions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <PayslipDeductionsModal
          deduction={selectedDeduction}
          onClose={() =>
            setShowModal(false)
          }
          onSave={handleSave}
        />
      )}

    </div>
  );
}