import { useEffect, useState } from "react";

import {
  getPayePersonalReliefs,
  createPayePersonalRelief,
  updatePayePersonalRelief,
  deletePayePersonalRelief,
} from "../../../api/hrApi";

import PayePersonalReliefTable from "./PayePersonalReliefTable";
import PayePersonalReliefModal from "./PayePersonalReliefModal";

export default function PayePersonalRelief() {
  const [reliefs, setReliefs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedRelief, setSelectedRelief] = useState(null);

  // ==========================================
  // Load Data
  // ==========================================

  const loadReliefs = async () => {
    try {
      setLoading(true);

      const res = await getPayePersonalReliefs();

      setReliefs(res.data);

    } catch (err) {
      console.error(err);
      alert("Failed to load PAYE Personal Relief.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReliefs();
  }, []);

  // ==========================================
  // Actions
  // ==========================================

  const handleAdd = () => {
    setSelectedRelief(null);
    setShowModal(true);
  };

  const handleEdit = (relief) => {
    setSelectedRelief(relief);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this PAYE Personal Relief record?"
      )
    )
      return;

    try {
      await deletePayePersonalRelief(id);

      loadReliefs();

    } catch (err) {
      console.error(err);
      alert("Failed to delete record.");
    }
  };

  const handleSave = async (form) => {
    try {
      if (selectedRelief) {
        await updatePayePersonalRelief(
          selectedRelief.id,
          form
        );
      } else {
        await createPayePersonalRelief(form);
      }

      setShowModal(false);

      loadReliefs();

    } catch (err) {
      console.error(err);
      alert("Failed to save record.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading PAYE Personal Relief...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold">
            PAYE Personal Relief
          </h1>

          <p className="text-slate-500">
            Manage monthly PAYE personal relief
            amounts and historical changes.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Relief
        </button>

      </div>

      <PayePersonalReliefTable
        reliefs={reliefs}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <PayePersonalReliefModal
          relief={selectedRelief}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}