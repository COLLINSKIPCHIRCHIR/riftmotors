import {
  FaStickyNote,
  FaUser,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function EmployeeNoteCard({
  note,
  onEdit,
  onDelete,
}) {
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString();
  };

  return (
    <div className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition">

      {/* Header */}

      <div className="flex items-start gap-4">

        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-700 shrink-0">

          <FaStickyNote size={20} />

        </div>

        <div className="flex-1">

          {/* Note */}

          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">

            {note.note}

          </p>

          {/* Footer */}

          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-slate-500">

            <div className="flex items-center gap-2">

              <FaUser />

              <span>
                {note.created_by_name || "Unknown"}
              </span>

            </div>

            <div className="flex items-center gap-2">

              <FaCalendarAlt />

              <span>
                {formatDate(note.created_at)}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* Actions */}

      <div className="flex justify-end gap-3 mt-5 border-t pt-4">

        <button
          onClick={() => onEdit(note)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <FaEdit />

          Edit
        </button>

        <button
          onClick={() => onDelete(note.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
        >
          <FaTrash />

          Delete
        </button>

      </div>

    </div>
  );
}