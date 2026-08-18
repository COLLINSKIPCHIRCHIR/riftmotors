import {
  FaCheck,
  FaEdit,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

export default function LeaveRequestTable({
  requests,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}) {
  const badgeColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (!requests.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        No leave requests found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          <thead className="bg-slate-50">
            <tr className="text-left">

              <th className="px-4 py-3 font-semibold">
                Employee
              </th>

              <th className="px-4 py-3 font-semibold">
                Leave Type
              </th>

              <th className="px-4 py-3 font-semibold">
                Start
              </th>

              <th className="px-4 py-3 font-semibold">
                End
              </th>

              <th className="px-4 py-3 font-semibold text-center">
                Days
              </th>

              <th className="px-4 py-3 font-semibold">
                Status
              </th>

              <th className="px-4 py-3 font-semibold">
                Approved By
              </th>

              <th className="px-4 py-3 font-semibold">
                Created
              </th>

              <th className="px-4 py-3 font-semibold text-center">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>

            {requests.map((request) => (
              <tr
                key={request.id}
                className="border-t hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium">
                  {request.first_name} {request.last_name}
                  <div className="text-xs text-slate-500">
                    #{request.employee_number}
                  </div>
                </td>

                <td className="px-4 py-3">
                  {request.leave_type}
                </td>

                <td className="px-4 py-3">
                  {new Date(request.start_date).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  {new Date(request.end_date).toLocaleDateString()}
                </td>

                <td className="px-4 py-3 text-center">
                  {request.days_requested}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </td>

                <td className="px-4 py-3">
                  {request.approved_by_name || "-"}
                </td>

                <td className="px-4 py-3">
                  {new Date(request.created_at).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">

                    {/* Edit */}

                    <button
                      onClick={() => onEdit(request)}
                      disabled={request.status !== "Pending"}
                      className={`p-2 rounded-lg transition ${
                        request.status === "Pending"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>

                    {/* Approve */}

                    <button
                      onClick={() => onApprove(request.id)}
                      disabled={request.status !== "Pending"}
                      className={`p-2 rounded-lg transition ${
                        request.status === "Pending"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                      title="Approve"
                    >
                      <FaCheck />
                    </button>

                    {/* Reject */}

                    <button
                      onClick={() => onReject(request.id)}
                      disabled={request.status !== "Pending"}
                      className={`p-2 rounded-lg transition ${
                        request.status === "Pending"
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                      title="Reject"
                    >
                      <FaTimes />
                    </button>

                    {/* Delete */}

                    <button
                      onClick={() =>
                        onDelete(request.id, request.status)
                      }
                      disabled={request.status !== "Pending"}
                      className={`p-2 rounded-lg transition ${
                        request.status === "Pending"
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>

                  </div>
                </td>

              </tr>
            ))}

          </tbody>

        </table>
      </div>
    </div>
  );
}