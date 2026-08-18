import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function EmployeeRecurringDeductionTable({
  deductions,
  onEdit,
  onDelete,
}) {
  if (!deductions.length) {
    return (
      <div className="bg-white rounded-xl shadow border p-8 text-center text-slate-500">
        No recurring deductions found.
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStatus = (deduction) => {
    if (!deduction.is_active) {
      return {
        label: "Inactive",
        color: "bg-red-100 text-red-700",
      };
    }

    const today = new Date();

    const start = deduction.start_date
      ? new Date(deduction.start_date)
      : null;

    const end = deduction.end_date
      ? new Date(deduction.end_date)
      : null;

    if (start && start > today) {
      return {
        label: "Upcoming",
        color: "bg-blue-100 text-blue-700",
      };
    }

    if (end && end < today) {
      return {
        label: "Expired",
        color: "bg-orange-100 text-orange-700",
      };
    }

    return {
      label: "Active",
      color: "bg-green-100 text-green-700",
    };
  };

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-4 py-3 text-left font-semibold">
                Employee
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Deduction Type
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Deduction Name
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Monthly Amount
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
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {deductions.map((deduction) => {
              const status = getStatus(deduction);

              return (
                <tr
                  key={deduction.id}
                  className="border-t hover:bg-slate-50"
                >

                  <td className="px-4 py-3">

                    <div className="font-medium">

                      {deduction.first_name}{" "}
                      {deduction.last_name}

                    </div>

                    <div className="text-xs text-slate-500">

                      {deduction.employee_number}

                    </div>

                  </td>

                  <td className="px-4 py-3">

                    <div className="font-medium">

                      {deduction.deduction_type_name}

                    </div>

                    <div className="text-xs text-slate-500">

                      {deduction.code}

                    </div>

                  </td>

                  <td className="px-4 py-3">

                    {deduction.name}

                  </td>

                  <td className="px-4 py-3 text-right font-semibold text-blue-700">

                    KES {formatCurrency(deduction.amount)}

                  </td>

                  <td className="px-4 py-3 text-center">

                    {deduction.start_date
                      ? new Date(
                          deduction.start_date
                        ).toLocaleDateString()
                      : "-"}

                  </td>

                  <td className="px-4 py-3 text-center">

                    {deduction.end_date
                      ? new Date(
                          deduction.end_date
                        ).toLocaleDateString()
                      : (
                        <span className="text-green-600 font-medium">
                          Ongoing
                        </span>
                      )}

                  </td>

                  <td className="px-4 py-3 text-center">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
                    >
                      {status.label}
                    </span>

                  </td>

                  <td className="px-4 py-3">

                    <div className="flex justify-center gap-3">

                      <button
                        onClick={() =>
                          onEdit(deduction)
                        }
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>

                      <button
                        onClick={() =>
                          onDelete(deduction.id)
                        }
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>

                    </div>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

    </div>
  );
}