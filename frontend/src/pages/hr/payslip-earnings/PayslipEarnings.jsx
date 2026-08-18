import { useEffect, useState } from "react";

import {
  getPayslipEarnings,
  createPayslipEarning,
  updatePayslipEarning,
  deletePayslipEarning,
} from "../../../api/hrApi";

import PayslipEarningsTable from "./PayslipEarningsTable";
import PayslipEarningsModal from "./PayslipEarningsModal";

export default function PayslipEarnings() {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [selectedEarning, setSelectedEarning] =
    useState(null);

  // ==========================================
  // Load Earnings
  // ==========================================

  const loadEarnings = async () => {
    try {
      setLoading(true);

      const res =
        await getPayslipEarnings();

      setEarnings(res.data);

    } catch (err) {
      console.error(err);

      alert("Failed to load payslip earnings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  // ==========================================
  // Add
  // ==========================================

  const handleAdd = () => {
    setSelectedEarning(null);
    setShowModal(true);
  };

  // ==========================================
  // Edit
  // ==========================================

  const handleEdit = (earning) => {
    setSelectedEarning(earning);
    setShowModal(true);
  };

  // ==========================================
  // Delete
  // ==========================================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this earning item?"
      )
    )
      return;

    try {
      await deletePayslipEarning(id);

      loadEarnings();

    } catch (err) {
      console.error(err);

      alert("Failed to delete earning.");
    }
  };

  // ==========================================
  // Save
  // ==========================================

  const handleSave = async (form) => {
    try {
      if (selectedEarning) {
        await updatePayslipEarning(
          selectedEarning.id,
          form
        );
      } else {
        await createPayslipEarning(form);
      }

      setShowModal(false);

      loadEarnings();

    } catch (err) {
      console.error(err);

      alert("Failed to save earning.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading Payslip Earnings...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold">
            Payslip Earnings
          </h1>

          <p className="text-slate-500">
            Manage earning components that make up employee gross pay.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Earning
        </button>

      </div>

      <PayslipEarningsTable
        earnings={earnings}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <PayslipEarningsModal
          earning={selectedEarning}
          onClose={() =>
            setShowModal(false)
          }
          onSave={handleSave}
        />
      )}

    </div>
  );
}