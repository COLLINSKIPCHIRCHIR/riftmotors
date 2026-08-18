import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function EmployeeAttendanceTable({
  attendance,
  onEdit,
  onDelete,
}) {
  const badgeColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-700";

      case "Late":
        return "bg-yellow-100 text-yellow-700";

      case "Absent":
        return "bg-red-100 text-red-700";

      case "Leave":
        return "bg-blue-100 text-blue-700";

      case "Holiday":
        return "bg-purple-100 text-purple-700";

      case "Weekend":
        return "bg-slate-200 text-slate-700";

      case "Half Day":
        return "bg-orange-100 text-orange-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (!attendance.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
        No attendance records found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-4 py-3 text-left text-sm font-semibold">
                Employee
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold">
                Date
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Clock In
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Clock Out
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Worked
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Overtime
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Status
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold">
                Remarks
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {attendance.map((record) => (

              <tr
                key={record.id}
                className="border-t hover:bg-slate-50"
              >

                <td className="px-4 py-3">

                  <div className="font-medium text-slate-800">
                    {record.first_name} {record.last_name}
                  </div>

                  <div className="text-xs text-slate-500">
                    {record.employee_number}
                  </div>

                </td>

                <td className="px-4 py-3">
                  {new Date(
                    record.attendance_date
                  ).toLocaleDateString()}
                </td>

                <td className="px-4 py-3 text-center">
                  {record.clock_in
                    ? new Date(record.clock_in).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>

                <td className="px-4 py-3 text-center">
                  {record.clock_out
                    ? new Date(record.clock_out).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>

                <td className="px-4 py-3 text-center">
                  {Number(record.worked_hours || 0).toFixed(2)} hrs
                </td>

                <td className="px-4 py-3 text-center">
                  {Number(record.overtime_hours || 0).toFixed(2)} hrs
                </td>

                <td className="px-4 py-3 text-center">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor(
                      record.status
                    )}`}
                  >
                    {record.status}
                  </span>

                </td>

                <td className="px-4 py-3 max-w-xs truncate">
                  {record.remarks || "-"}
                </td>

                <td className="px-4 py-3">

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() => onEdit(record)}
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() => onDelete(record.id)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
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