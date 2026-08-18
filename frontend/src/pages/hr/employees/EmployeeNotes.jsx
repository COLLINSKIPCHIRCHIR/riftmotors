import { useEffect, useState } from "react";
import { FaStickyNote, FaPlus } from "react-icons/fa";

import {
  getEmployeeNotesByEmployee,
  createEmployeeNote,
  updateEmployeeNote,
  deleteEmployeeNote,
} from "../../../api/hrApi";

import EmployeeNoteCard from "./EmployeeNoteCard";
import EmployeeNoteModal from "./EmployeeNoteModal";

export default function EmployeeNotes({ employeeId }) {
  const [notes, setNotes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedNote, setSelectedNote] = useState(null);

  // ==========================
  // Load Notes
  // ==========================

  const loadNotes = async () => {
    try {
      setLoading(true);

      const res = await getEmployeeNotesByEmployee(employeeId);

      setNotes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      loadNotes();
    }
  }, [employeeId]);

  // ==========================
  // Add
  // ==========================

  const handleAdd = () => {
    setSelectedNote(null);
    setShowModal(true);
  };

  // ==========================
  // Edit
  // ==========================

  const handleEdit = (note) => {
    setSelectedNote(note);
    setShowModal(true);
  };

  // ==========================
  // Delete
  // ==========================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;

    try {
      await deleteEmployeeNote(id);

      loadNotes();
    } catch (err) {
      console.error(err);

      alert("Failed to delete note.");
    }
  };

  // ==========================
  // Save
  // ==========================

  const handleSave = async (form) => {
    try {
      const data = {
        employee_id: employeeId,
        note: form.note,
      };

      if (selectedNote) {
        await updateEmployeeNote(selectedNote.id, data);
      } else {
        await createEmployeeNote(data);
      }

      setShowModal(false);

      loadNotes();
    } catch (err) {
      console.error(err);

      alert("Failed to save note.");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

      {/* Header */}

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-700">

            <FaStickyNote />

          </div>

          <div>

            <h3 className="font-bold text-lg">
              Employee Notes
            </h3>

            <p className="text-sm text-slate-500">
              Internal notes and comments about this employee.
            </p>

          </div>

        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <FaPlus />

          Add Note
        </button>

      </div>

      {/* Content */}

      {loading ? (

        <div className="text-center py-10 text-slate-500">
          Loading notes...
        </div>

      ) : notes.length === 0 ? (

        <div className="border border-dashed border-slate-300 rounded-xl py-12 text-center">

          <h4 className="font-semibold text-slate-700">
            No notes added
          </h4>

          <p className="text-slate-500 mt-2">
            Record important observations and internal comments for this employee.
          </p>

        </div>

      ) : (

        <div className="space-y-4">

          {notes.map((note) => (

            <EmployeeNoteCard
              key={note.id}
              note={note}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

          ))}

        </div>

      )}

      {/* Modal */}

      {showModal && (

        <EmployeeNoteModal
          note={selectedNote}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />

      )}

    </div>
  );
}