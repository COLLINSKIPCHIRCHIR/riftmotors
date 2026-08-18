import React, { useEffect, useState } from "react";
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../../../api/hrApi";

import BranchTable from "./BranchTable";
import BranchModal from "./BranchModal";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await getBranches();
      setBranches(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleSave = async (form) => {
    try {
      if (selectedBranch) {
        await updateBranch(selectedBranch.id, form);
      } else {
        await createBranch(form);
      }

      setShowModal(false);
      setSelectedBranch(null);
      loadBranches();
    } catch (err) {
      console.error(err);
      alert("Failed to save branch");
    }
  };

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this branch?")) return;

    try {
      await deleteBranch(id);
      loadBranches();
    } catch (err) {
      console.error(err);
      alert("Failed to delete branch");
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold">
            Branches
          </h1>

          <p className="text-gray-500">
            Manage company branches
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedBranch(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Branch
        </button>

      </div>

      <BranchTable
        branches={branches}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <BranchModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        branch={selectedBranch}
      />

    </div>
  );
}