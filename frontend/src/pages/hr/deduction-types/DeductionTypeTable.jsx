import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function DeductionTypeTable({
  deductionTypes,
  onEdit,
  onDelete,
}) {
  if (!deductionTypes.length) {
    return (
      <div className="bg-white rounded-xl shadow border p-8 text-center text-slate-500">
        No deduction types found.
      </div>
    );
  }

  const badge = (value, yesText = "Yes", noText = "No") => (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
        value
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {value ? yesText : noText}
    </span>
  );

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-4 py-3 text-left text-sm font-semibold">
                Code
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold">
                Deduction Name
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold">
                Calculation
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Statutory
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Reduces Taxable Income
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Status
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Created
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {deductionTypes.map((item) => (

              <tr
                key={item.id}
                className="border-t hover:bg-slate-50"
              >

                <td className="px-4 py-3 font-semibold text-blue-700">
                  {item.code}
                </td>

                <td className="px-4 py-3">
                  {item.name}
                </td>

                <td className="px-4 py-3">
                  {item.calculation_method}
                </td>

                <td className="px-4 py-3 text-center">
                  {badge(item.is_statutory)}
                </td>

                <td className="px-4 py-3 text-center">
                  {badge(item.reduces_taxable_income)}
                </td>

                <td className="px-4 py-3 text-center">
                  {badge(
                    item.is_active,
                    "Active",
                    "Inactive"
                  )}
                </td>

                <td className="px-4 py-3 text-center text-sm text-slate-600">
                  {new Date(
                    item.created_at
                  ).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">

                  <div className="flex justify-center gap-3">

                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() => onDelete(item.id)}
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