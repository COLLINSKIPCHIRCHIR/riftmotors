import { useEffect, useState } from "react";

import {
  getPublicHolidays,
  createPublicHoliday,
  updatePublicHoliday,
  deletePublicHoliday,
} from "../../../api/hrApi";

import PublicHolidayTable from "./PublicHolidayTable";
import PublicHolidayModal from "./PublicHolidayModal";

export default function PublicHolidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedHoliday, setSelectedHoliday] = useState(null);

  // ==========================================
  // Load Holidays
  // ==========================================

  const loadHolidays = async () => {
    try {
      setLoading(true);

      const res = await getPublicHolidays();

      setHolidays(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load public holidays.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  // ==========================================
  // Add
  // ==========================================

  const handleAdd = () => {
    setSelectedHoliday(null);
    setShowModal(true);
  };

  // ==========================================
  // Edit
  // ==========================================

  const handleEdit = (holiday) => {
    setSelectedHoliday(holiday);
    setShowModal(true);
  };

  // ==========================================
  // Delete
  // ==========================================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;

    try {
      await deletePublicHoliday(id);

      loadHolidays();
    } catch (err) {
      console.error(err);

      alert("Failed to delete holiday.");
    }
  };

  // ==========================================
  // Save
  // ==========================================

  const handleSave = async (form) => {
    try {
      if (selectedHoliday) {
        await updatePublicHoliday(selectedHoliday.id, form);
      } else {
        await createPublicHoliday(form);
      }

      setShowModal(false);

      loadHolidays();
    } catch (err) {
      console.error(err);

      alert("Failed to save holiday.");
    }
  };

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading Public Holidays...
      </div>
    );
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Public Holidays
          </h1>

          <p className="text-sm text-slate-500">
            Manage company and national public holidays.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Holiday
        </button>

      </div>

      <PublicHolidayTable
        holidays={holidays}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <PublicHolidayModal
          holiday={selectedHoliday}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}