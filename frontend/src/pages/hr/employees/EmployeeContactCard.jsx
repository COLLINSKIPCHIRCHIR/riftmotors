import {
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaHome,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function EmployeeContactCard({
  contact,
  onEdit,
  onDelete,
}) {
  return (
    <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">

            <FaUser />

          </div>

          <div>

            <h4 className="font-bold text-slate-800 text-lg">
              {contact.name}
            </h4>

            <p className="text-sm text-slate-500">
              {contact.relationship || "-"}
            </p>

          </div>

        </div>

        <div className="flex items-center gap-2">

          {contact.is_primary && (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              PRIMARY
            </span>
          )}

        </div>

      </div>

      {/* Contact Information */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

        <div className="flex items-center gap-3">

          <FaPhoneAlt className="text-slate-400" />

          <div>

            <p className="text-xs uppercase text-slate-500">
              Phone
            </p>

            <p className="font-medium text-slate-700">
              {contact.phone || "-"}
            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <FaEnvelope className="text-slate-400" />

          <div>

            <p className="text-xs uppercase text-slate-500">
              Email
            </p>

            <p className="font-medium text-slate-700">
              {contact.email || "-"}
            </p>

          </div>

        </div>

        <div className="flex items-start gap-3 md:col-span-2">

          <FaHome className="text-slate-400 mt-1" />

          <div>

            <p className="text-xs uppercase text-slate-500">
              Address
            </p>

            <p className="font-medium text-slate-700">
              {contact.address || "-"}
            </p>

          </div>

        </div>

      </div>

      {/* Footer */}

      <div className="flex justify-end gap-3 mt-6 border-t pt-4">

        <button
          onClick={() => onEdit(contact)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <FaEdit />

          Edit
        </button>

        <button
          onClick={() => onDelete(contact.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
        >
          <FaTrash />

          Delete
        </button>

      </div>

    </div>
  );
}