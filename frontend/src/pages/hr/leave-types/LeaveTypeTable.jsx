import {
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

export default function LeaveTypeTable({
  leaveTypes,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                Leave Type
              </th>

              <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Days / Year
              </th>

              <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Paid Leave
              </th>

              <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Created
              </th>

              <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {leaveTypes.length === 0 ? (

              <tr>

                <td
                  colSpan={5}
                  className="py-10 text-center text-slate-500"
                >
                  No leave types found.
                </td>

              </tr>

            ) : (

              leaveTypes.map((type) => (

                <tr
                  key={type.id}
                  className="border-t hover:bg-slate-50"
                >

                  {/* Name */}

                  <td className="px-6 py-4 font-medium text-slate-800">
                    {type.name}
                  </td>

                  {/* Days */}

                  <td className="px-6 py-4 text-center text-slate-700">
                    {Number(type.default_days_per_year).toFixed(2)}
                  </td>

                  {/* Paid */}

                  <td className="px-6 py-4">

                    <div className="flex justify-center">

                      {type.is_paid ? (

                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">

                          <FaCheckCircle />

                          Yes

                        </span>

                      ) : (

                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm">

                          <FaTimesCircle />

                          No

                        </span>

                      )}

                    </div>

                  </td>

                  {/* Created */}

                  <td className="px-6 py-4 text-center text-slate-600 text-sm">

                    {new Date(type.created_at).toLocaleDateString()}

                  </td>

                  {/* Actions */}

                  <td className="px-6 py-4">

                    <div className="flex justify-center gap-2">

                      <button
                        onClick={() => onEdit(type)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <FaEdit />

                        Edit
                      </button>

                      <button
                        onClick={() => onDelete(type.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <FaTrash />

                        Delete
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}