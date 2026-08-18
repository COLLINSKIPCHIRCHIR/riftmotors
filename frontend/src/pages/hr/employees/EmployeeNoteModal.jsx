import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

export default function EmployeeNoteModal({
  note,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    note: "",
  });

  useEffect(() => {
    if (note) {
      setForm({
        note: note.note || "",
      });
    }
  }, [note]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      note: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.note.trim()) {
      return alert("Please enter a note.");
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b px-6 py-4">

          <h2 className="text-xl font-bold text-slate-800">
            {note ? "Edit Note" : "Add Note"}
          </h2>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-500"
          >
            <FaTimes />
          </button>

        </div>

        {/* Form */}

        <form onSubmit={handleSubmit}>

          <div className="p-6">

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Employee Note
            </label>

            <textarea
              name="note"
              rows={8}
              value={form.note}
              onChange={handleChange}
              placeholder="Write any internal notes, observations, reminders, disciplinary comments, achievements, or performance remarks..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />

            <p className="text-xs text-slate-500 mt-2">
              These notes are intended for internal HR use only.
            </p>

          </div>

          {/* Footer */}

          <div className="border-t px-6 py-4 flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {note ? "Update Note" : "Save Note"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}