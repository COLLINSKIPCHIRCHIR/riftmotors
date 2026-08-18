import { useEffect, useState } from "react";

import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "../../../api/hrApi";

import LeaveTypeTable from "./LeaveTypeTable";
import LeaveTypeModal from "./LeaveTypeModal";

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedLeaveType, setSelectedLeaveType] = useState(null);

  // ==========================
  // Load Leave Types
  // ==========================

  const loadLeaveTypes = async () => {
    try {
      setLoading(true);

      const res = await getLeaveTypes();

      setLeaveTypes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  // ==========================
  // Add
  // ==========================

  const handleAdd = () => {
    setSelectedLeaveType(null);
    setShowModal(true);
  };

  // ==========================
  // Edit
  // ==========================

  const handleEdit = (leaveType) => {
    setSelectedLeaveType(leaveType);
    setShowModal(true);
  };

  // ==========================
  // Delete
  // ==========================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this leave type?")) return;

    try {
      await deleteLeaveType(id);

      loadLeaveTypes();
    } catch (err) {
      console.error(err);

      alert("Failed to delete leave type.");
    }
  };

  // ==========================
  // Save
  // ==========================

  const handleSave = async (form) => {
    try {
      if (selectedLeaveType) {
        await updateLeaveType(selectedLeaveType.id, form);
      } else {
        await createLeaveType(form);
      }

      setShowModal(false);

      loadLeaveTypes();
    } catch (err) {
      console.error(err);

      alert(err.response?.data?.message || "Failed to save leave type.");
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading Leave Types...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Leave Types
          </h1>

          <p className="text-sm text-slate-500">
            Configure leave categories and annual entitlement.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Leave Type
        </button>

      </div>

      {/* Table */}

      <LeaveTypeTable
        leaveTypes={leaveTypes}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal */}

      {showModal && (
        <LeaveTypeModal
          leaveType={selectedLeaveType}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}