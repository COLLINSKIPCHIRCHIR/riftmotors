import { useEffect, useState } from "react";

import {
  getEmployeeSalaryHistory,
  createEmployeeSalary,
  updateEmployeeSalary,
  deleteEmployeeSalary,
} from "../../../api/hrApi";

import EmployeeSalaryCard from "./EmployeeSalaryCard";
import EmployeeSalaryModal from "./EmployeeSalaryModal";

export default function EmployeeSalaryHistory({
  employeeId,
}) {
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedRecord, setSelectedRecord] =
    useState(null);

  // ======================================
  // Load Salary History
  // ======================================

  const loadSalaryHistory = async () => {
    try {
      setLoading(true);

      const res =
        await getEmployeeSalaryHistory(employeeId);

      setRecords(res.data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    if (employeeId) {
      loadSalaryHistory();
    }
  }, [employeeId]);

  // ======================================
  // Add
  // ======================================

  const handleAdd = () => {
    setSelectedRecord(null);
    setShowModal(true);
  };

  // ======================================
  // Edit
  // ======================================

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  // ======================================
  // Delete
  // ======================================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete salary record?"))
      return;

    try {
      await deleteEmployeeSalary(id);

      loadSalaryHistory();

    } catch (err) {

      console.error(err);

      alert("Unable to delete salary.");

    }
  };

  // ======================================
  // Save
  // ======================================

  const handleSave = async (form) => {
    try {

      const payload = {
        ...form,
        employee_id: employeeId,
      };

      if (selectedRecord) {

        await updateEmployeeSalary(
          selectedRecord.id,
          payload
        );

      } else {

        await createEmployeeSalary(payload);

      }

      setShowModal(false);

      loadSalaryHistory();

    } catch (err) {

      console.error(err);

      alert("Failed to save salary.");

    }
  };

  // ======================================
  // Loading
  // ======================================

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-5">
        Loading Salary History...
      </div>
    );
  }

  // ======================================
  // Render
  // ======================================

  return (
    <div className="bg-white rounded-xl border p-6">

      <div className="flex justify-between items-center mb-5">

        <div>

          <h2 className="text-lg font-bold">
            Salary History
          </h2>

          <p className="text-sm text-slate-500">
            Employee salary progression.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Salary
        </button>

      </div>

      <EmployeeSalaryCard
        records={records}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <EmployeeSalaryModal
          salary={selectedRecord}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}