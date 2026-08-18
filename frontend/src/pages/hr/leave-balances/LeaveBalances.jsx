import { useEffect, useState } from "react";

import {
  getLeaveBalances,
  createLeaveBalance,
  updateLeaveBalance,
  deleteLeaveBalance,
  getEmployees,
  getLeaveTypes,
} from "../../../api/hrApi";

import LeaveBalanceTable from "./LeaveBalanceTable";
import LeaveBalanceModal from "./LeaveBalanceModal";

export default function LeaveBalances() {
  const [balances, setBalances] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [leaveTypes, setLeaveTypes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedBalance, setSelectedBalance] = useState(null);

  // ==========================
  // Load Data
  // ==========================

  const loadBalances = async () => {
    try {
      const res = await getLeaveBalances();
      setBalances(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const res = await getLeaveTypes();
      setLeaveTypes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);

    await Promise.all([
      loadBalances(),
      loadEmployees(),
      loadLeaveTypes(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ==========================
  // Add
  // ==========================

  const handleAdd = () => {
    setSelectedBalance(null);
    setShowModal(true);
  };

  // ==========================
  // Edit
  // ==========================

  const handleEdit = (balance) => {
    setSelectedBalance(balance);
    setShowModal(true);
  };

  // ==========================
  // Delete
  // ==========================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this leave balance?")) return;

    try {
      await deleteLeaveBalance(id);

      loadBalances();
    } catch (err) {
      console.error(err);
      alert("Failed to delete leave balance.");
    }
  };

  // ==========================
  // Save
  // ==========================

  const handleSave = async (form) => {
    try {
      if (selectedBalance) {
        await updateLeaveBalance(selectedBalance.id, form);
      } else {
        await createLeaveBalance(form);
      }

      setShowModal(false);

      loadBalances();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Failed to save leave balance."
      );
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading Leave Balances...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Leave Balances
          </h1>

          <p className="text-sm text-slate-500">
            Manage employee leave balances.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Leave Balance
        </button>

      </div>

      <LeaveBalanceTable
        balances={balances}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <LeaveBalanceModal
          balance={selectedBalance}
          employees={employees}
          leaveTypes={leaveTypes}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}