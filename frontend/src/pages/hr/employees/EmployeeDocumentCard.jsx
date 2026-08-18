import {
  FaFileAlt,
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaUser,
} from "react-icons/fa";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:5004";

export default function EmployeeDocumentCard({
  document,
  onEdit,
  onDelete,
}) {
  const fileUrl = `${API_BASE}${document.file_path}`;

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-4">

          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">

            <FaFileAlt size={22} />

          </div>

          <div>

            <h3 className="font-semibold text-slate-800 text-lg">

              {document.document_type || "Document"}

            </h3>

            <p className="text-sm text-slate-500 mt-1">

              {document.file_name}

            </p>

          </div>

        </div>

      </div>

      {/* Information */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

        <div className="flex items-center gap-3">

          <FaCalendarAlt className="text-slate-400" />

          <div>

            <p className="text-xs uppercase tracking-wide text-slate-500">

              Uploaded

            </p>

            <p className="font-medium text-slate-700">

              {formatDate(document.uploaded_at)}

            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <FaUser className="text-slate-400" />

          <div>

            <p className="text-xs uppercase tracking-wide text-slate-500">

              Uploaded By

            </p>

            <p className="font-medium text-slate-700">

              {document.uploaded_by_name || "-"}

            </p>

          </div>

        </div>

      </div>

      {/* Actions */}

      <div className="flex flex-wrap justify-end gap-3 mt-6 border-t pt-4">

        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
        >
          <FaEye />

          View
        </a>

        <a
          href={fileUrl}
          download={document.file_name}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 text-green-700 hover:bg-green-50"
        >
          <FaDownload />

          Download
        </a>

        <button
          onClick={() => onEdit(document)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <FaEdit />

          Edit
        </button>

        <button
          onClick={() => onDelete(document.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
        >
          <FaTrash />

          Delete
        </button>

      </div>

    </div>
  );
}