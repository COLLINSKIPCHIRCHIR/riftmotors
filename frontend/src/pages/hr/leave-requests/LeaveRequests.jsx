import { useEffect, useState } from "react";

import {
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  getEmployees,
  getLeaveTypes,
} from "../../../api/hrApi";

import LeaveRequestTable from "./LeaveRequestTable";
import LeaveRequestModal from "./LeaveRequestModal";

export default function LeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);

  /* ==========================================
      LOAD DATA
  ========================================== */

  const loadRequests = async () => {
    try {
      const res = await getLeaveRequests();
      setRequests(res.data);
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
      loadRequests(),
      loadEmployees(),
      loadLeaveTypes(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* ==========================================
      ADD
  ========================================== */

  const handleAdd = () => {
    setSelectedRequest(null);
    setShowModal(true);
  };

  /* ==========================================
      EDIT
  ========================================== */

  const handleEdit = (request) => {
    if (request.status !== "Pending") {
      return alert("Only pending requests can be edited.");
    }

    setSelectedRequest(request);
    setShowModal(true);
  };

  /* ==========================================
      DELETE
  ========================================== */

  const handleDelete = async (id, status) => {
    if (status !== "Pending") {
      return alert("Only pending requests can be deleted.");
    }

    if (!window.confirm("Delete this leave request?")) return;

    try {
      await deleteLeaveRequest(id);

      loadRequests();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Failed to delete leave request."
      );
    }
  };

  /* ==========================================
      SAVE
  ========================================== */

  const handleSave = async (form) => {
    try {
      if (selectedRequest) {
        await updateLeaveRequest(selectedRequest.id, form);
      } else {
        await createLeaveRequest(form);
      }

      setShowModal(false);

      loadRequests();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Failed to save leave request."
      );
    }
  };

  /* ==========================================
      APPROVE
  ========================================== */

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this leave request?")) return;

    try {
      await approveLeaveRequest(id);

      loadRequests();

      alert("Leave request approved successfully.");
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Failed to approve leave request."
      );
    }
  };

  /* ==========================================
      REJECT
  ========================================== */

  const handleReject = async (id) => {
    if (!window.confirm("Reject this leave request?")) return;

    try {
      await rejectLeaveRequest(id);

      loadRequests();

      alert("Leave request rejected.");
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Failed to reject leave request."
      );
    }
  };

  /* ==========================================
      LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading Leave Requests...
      </div>
    );
  }

  /* ==========================================
      RENDER
  ========================================== */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Leave Requests
          </h1>

          <p className="text-sm text-slate-500">
            Manage employee leave requests.
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Leave Request
        </button>
      </div>

      {/* Table */}

      <LeaveRequestTable
        requests={requests}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Modal */}

      {showModal && (
        <LeaveRequestModal
          request={selectedRequest}
          employees={employees}
          leaveTypes={leaveTypes}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}