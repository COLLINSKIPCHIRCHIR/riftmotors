import { useEffect, useState } from "react";

import {
  getPayslips,
  createPayslip,
  updatePayslip,
  deletePayslip,
} from "../../../api/hrApi";

import PayslipTable from "./PayslipTable";
import PayslipModal from "./PayslipModal";

export default function Payslips() {
  const [payslips, setPayslips] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [selectedPayslip, setSelectedPayslip] =
    useState(null);

  // ==========================================
  // Load Payslips
  // ==========================================

  const loadPayslips = async () => {
    try {
      setLoading(true);

      const res =
        await getPayslips();

      setPayslips(res.data);

    } catch (err) {
      console.error(err);

      alert("Failed to load payslips.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, []);

  // ==========================================
  // Add
  // ==========================================

  const handleAdd = () => {
    setSelectedPayslip(null);
    setShowModal(true);
  };

  // ==========================================
  // Edit
  // ==========================================

  const handleEdit = (payslip) => {
    setSelectedPayslip(payslip);
    setShowModal(true);
  };

  // ==========================================
  // Delete
  // ==========================================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this payslip?"
      )
    )
      return;

    try {
      await deletePayslip(id);

      loadPayslips();

    } catch (err) {
      console.error(err);

      alert("Failed to delete payslip.");
    }
  };

  // ==========================================
  // Save
  // ==========================================

  const handleSave = async (form) => {
    try {
      if (selectedPayslip) {
        await updatePayslip(
          selectedPayslip.id,
          form
        );
      } else {
        await createPayslip(form);
      }

      setShowModal(false);

      loadPayslips();

    } catch (err) {
      console.error(err);

      alert("Failed to save payslip.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading Payslips...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold">
            Payslips
          </h1>

          <p className="text-slate-500">
            View and manage employee payslips generated for payroll periods.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Payslip
        </button>

      </div>

      <PayslipTable
        payslips={payslips}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <PayslipModal
          payslip={selectedPayslip}
          onClose={() =>
            setShowModal(false)
          }
          onSave={handleSave}
        />
      )}

    </div>
  );
}