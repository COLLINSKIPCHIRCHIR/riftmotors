import { useEffect, useState } from "react";

import {
  getPayrollPeriods,
  createPayrollPeriod,
  updatePayrollPeriod,
  deletePayrollPeriod,
} from "../../../api/hrApi";

import PayrollPeriodTable from "./PayrollPeriodTable";
import PayrollPeriodModal from "./PayrollPeriodModal";

export default function PayrollPeriods() {
  const [periods, setPeriods] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [selectedPeriod, setSelectedPeriod] =
    useState(null);

  // ==========================================
  // Load Data
  // ==========================================

  const loadData = async () => {
    try {
      setLoading(true);

      const res =
        await getPayrollPeriods();

      setPeriods(res.data);

    } catch (err) {
      console.error(err);

      alert(
        "Failed to load payroll periods."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // Add
  // ==========================================

  const handleAdd = () => {
    setSelectedPeriod(null);
    setShowModal(true);
  };

  // ==========================================
  // Edit
  // ==========================================

  const handleEdit = (period) => {
    setSelectedPeriod(period);
    setShowModal(true);
  };

  // ==========================================
  // Delete
  // ==========================================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this payroll period?"
      )
    )
      return;

    try {
      await deletePayrollPeriod(id);

      loadData();

    } catch (err) {
      console.error(err);

      alert(
        "Failed to delete payroll period."
      );
    }
  };

  // ==========================================
  // Save
  // ==========================================

  const handleSave = async (form) => {
    try {
      if (selectedPeriod) {
        await updatePayrollPeriod(
          selectedPeriod.id,
          form
        );
      } else {
        await createPayrollPeriod(form);
      }

      setShowModal(false);

      loadData();

    } catch (err) {
      console.error(err);

      alert(
        "Failed to save payroll period."
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading Payroll Periods...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold">
            Payroll Periods
          </h1>

          <p className="text-slate-500">
            Manage payroll periods for monthly payroll
            processing.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Payroll Period
        </button>

      </div>

      <PayrollPeriodTable
        periods={periods}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <PayrollPeriodModal
          payrollPeriod={selectedPeriod}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}