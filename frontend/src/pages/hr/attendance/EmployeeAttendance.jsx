import { useEffect, useState } from "react";

import {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployees,
} from "../../../api/hrApi";

import EmployeeAttendanceTable from "./EmployeeAttendanceTable";
import EmployeeAttendanceModal from "./EmployeeAttendanceModal";

export default function EmployeeAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedAttendance, setSelectedAttendance] = useState(null);

  // ==========================================
  // Load Attendance
  // ==========================================

  const loadAttendance = async () => {
    try {
      const res = await getAttendance();
      setAttendance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // Load Employees
  // ==========================================

  const loadEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // Load All
  // ==========================================

  const loadAll = async () => {
    setLoading(true);

    await Promise.all([
      loadAttendance(),
      loadEmployees(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ==========================================
  // Add
  // ==========================================

  const handleAdd = () => {
    setSelectedAttendance(null);
    setShowModal(true);
  };

  // ==========================================
  // Edit
  // ==========================================

  const handleEdit = (attendance) => {
    setSelectedAttendance(attendance);
    setShowModal(true);
  };

  // ==========================================
  // Delete
  // ==========================================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this attendance record?")) return;

    try {
      await deleteAttendance(id);

      loadAttendance();
    } catch (err) {
      console.error(err);
      alert("Failed to delete attendance.");
    }
  };

  // ==========================================
  // Save
  // ==========================================

  const handleSave = async (form) => {
    try {
      if (selectedAttendance) {
        await updateAttendance(selectedAttendance.id, form);
      } else {
        await createAttendance(form);
      }

      setShowModal(false);

      loadAttendance();
    } catch (err) {
      console.error(err);
      alert("Failed to save attendance.");
    }
  };

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading Attendance...
      </div>
    );
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Employee Attendance
          </h1>

          <p className="text-slate-500 text-sm">
            Manage daily employee attendance.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Record Attendance
        </button>

      </div>

      <EmployeeAttendanceTable
        attendance={attendance}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <EmployeeAttendanceModal
          attendance={selectedAttendance}
          employees={employees}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}