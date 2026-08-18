import { useEffect, useState } from "react";

import {
  getDeductionRateVersions,
  createDeductionRateVersion,
  updateDeductionRateVersion,
  deleteDeductionRateVersion,
} from "../../../api/hrApi";

import DeductionRateVersionTable from "./DeductionRateVersionTable";
import DeductionRateVersionModal from "./DeductionRateVersionModal";

export default function DeductionRateVersions() {
  const [rateVersions, setRateVersions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedRate, setSelectedRate] = useState(null);

  // =====================================

  const loadRateVersions = async () => {
    try {
      setLoading(true);

      const res = await getDeductionRateVersions();

      setRateVersions(res.data);
    } catch (err) {
      console.error(err);

      alert("Failed to load deduction rate versions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRateVersions();
  }, []);

  // =====================================

  const handleAdd = () => {
    setSelectedRate(null);
    setShowModal(true);
  };

  const handleEdit = (rate) => {
    setSelectedRate(rate);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this rate version?")) return;

    try {
      await deleteDeductionRateVersion(id);

      loadRateVersions();
    } catch (err) {
      console.error(err);

      alert("Failed to delete rate version.");
    }
  };

  const handleSave = async (form) => {
    try {
      if (selectedRate) {
        await updateDeductionRateVersion(
          selectedRate.id,
          form
        );
      } else {
        await createDeductionRateVersion(form);
      }

      setShowModal(false);

      loadRateVersions();
    } catch (err) {
      console.error(err);

      alert("Failed to save deduction rate version.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading deduction rate versions...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold">
            Deduction Rate Versions
          </h1>

          <p className="text-slate-500">
            Manage historical deduction rates for payroll calculations.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Rate Version
        </button>

      </div>

      <DeductionRateVersionTable
        rateVersions={rateVersions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <DeductionRateVersionModal
          rateVersion={selectedRate}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}