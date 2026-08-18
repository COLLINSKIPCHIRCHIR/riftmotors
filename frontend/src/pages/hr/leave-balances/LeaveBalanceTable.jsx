import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function LeaveBalanceTable({
  balances,
  onEdit,
  onDelete,
}) {
  const remainingBadge = (remaining) => {
    const value = Number(remaining);

    if (value <= 0) {
      return "bg-red-100 text-red-700";
    }

    if (value <= 5) {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-green-100 text-green-700";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                Employee
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                Leave Type
              </th>

              <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Year
              </th>

              <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Allocated
              </th>

              <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Used
              </th>

              <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Carried
              </th>

              <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Remaining
              </th>

              <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {balances.length === 0 ? (

              <tr>

                <td
                  colSpan={8}
                  className="text-center py-10 text-slate-500"
                >
                  No leave balances found.
                </td>

              </tr>

            ) : (

              balances.map((balance) => (

                <tr
                  key={balance.id}
                  className="border-t hover:bg-slate-50"
                >

                  {/* Employee */}

                  <td className="px-6 py-4">

                    <div>

                      <div className="font-medium text-slate-800">
                        {balance.first_name} {balance.last_name}
                      </div>

                      <div className="text-xs text-slate-500">
                        {balance.employee_number}
                      </div>

                    </div>

                  </td>

                  {/* Leave Type */}

                  <td className="px-6 py-4 text-slate-700">
                    {balance.leave_type}
                  </td>

                  {/* Year */}

                  <td className="px-6 py-4 text-center">
                    {balance.year}
                  </td>

                  {/* Allocated */}

                  <td className="px-6 py-4 text-center">
                    {Number(balance.days_allocated).toFixed(2)}
                  </td>

                  {/* Used */}

                  <td className="px-6 py-4 text-center">
                    {Number(balance.days_used).toFixed(2)}
                  </td>

                  {/* Carried */}

                  <td className="px-6 py-4 text-center">
                    {Number(balance.days_carried_forward).toFixed(2)}
                  </td>

                  {/* Remaining */}

                  <td className="px-6 py-4 text-center">

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${remainingBadge(
                        balance.days_remaining
                      )}`}
                    >
                      {Number(balance.days_remaining).toFixed(2)}
                    </span>

                  </td>

                  {/* Actions */}

                  <td className="px-6 py-4">

                    <div className="flex justify-center gap-2">

                      <button
                        onClick={() => onEdit(balance)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <FaEdit />
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete(balance.id)}
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