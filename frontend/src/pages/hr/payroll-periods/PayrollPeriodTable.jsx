import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function PayrollPeriodTable({
  periods,
  onEdit,
  onDelete,
}) {
  if (!periods.length) {
    return (
      <div className="bg-white rounded-xl shadow border p-8 text-center text-slate-500">
        No payroll periods found.
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-700";

      case "Processed":
        return "bg-blue-100 text-blue-700";

      case "Closed":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-4 py-3 text-left font-semibold">
                Payroll Period
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Start Date
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                End Date
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Status
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Processed On
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Processed By
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {periods.map((period) => (

              <tr
                key={period.id}
                className="border-t hover:bg-slate-50"
              >

                <td className="px-4 py-3">

                  <div className="font-semibold">
                    {period.period_label}
                  </div>

                  <div className="text-xs text-slate-500">
                    Payroll Period #{period.id}
                  </div>

                </td>

                <td className="px-4 py-3 text-center">
                  {formatDate(period.start_date)}
                </td>

                <td className="px-4 py-3 text-center">
                  {formatDate(period.end_date)}
                </td>

                <td className="px-4 py-3 text-center">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                      period.status
                    )}`}
                  >
                    {period.status}
                  </span>

                </td>

                <td className="px-4 py-3 text-center">

                  {period.processed_at
                    ? new Date(
                        period.processed_at
                      ).toLocaleString()
                    : "-"}

                </td>

                <td className="px-4 py-3">

                  {period.processed_by_name || "-"}

                </td>

                <td className="px-4 py-3">

                  <div className="flex justify-center gap-3">

                    <button
                      onClick={() =>
                        onEdit(period)
                      }
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() =>
                        onDelete(period.id)
                      }
                      className="text-red-600 hover:text-red-800"
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