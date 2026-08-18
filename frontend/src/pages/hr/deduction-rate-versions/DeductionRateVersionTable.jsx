import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function DeductionRateVersionTable({
  rateVersions,
  onEdit,
  onDelete,
}) {
  if (!rateVersions.length) {
    return (
      <div className="bg-white rounded-xl shadow border p-8 text-center text-slate-500">
        No deduction rate versions found.
      </div>
    );
  }

  const formatAmount = (value) => {
    if (value === null || value === undefined) return "-";
    return Number(value).toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-4 py-3 text-left text-sm font-semibold">
                Deduction
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold">
                Code
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold">
                Tier / Band
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Effective From
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Effective To
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Rate %
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Fixed Amount
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold">
                Income Range
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

            {rateVersions.map((item) => (

              <tr
                key={item.id}
                className="border-t hover:bg-slate-50"
              >

                <td className="px-4 py-3 font-medium">
                  {item.deduction_name}
                </td>

                <td className="px-4 py-3">
                  <span className="font-semibold text-blue-700">
                    {item.code}
                  </span>
                </td>

                <td className="px-4 py-3">
                  {item.tier_label || "-"}
                </td>

                <td className="px-4 py-3 text-center">
                  {item.effective_from
                    ? new Date(
                        item.effective_from
                      ).toLocaleDateString()
                    : "-"}
                </td>

                <td className="px-4 py-3 text-center">
                  {item.effective_to
                    ? new Date(
                        item.effective_to
                      ).toLocaleDateString()
                    : "Current"}
                </td>

                <td className="px-4 py-3 text-center">
                  {item.rate_percentage
                    ? `${item.rate_percentage}%`
                    : "-"}
                </td>

                <td className="px-4 py-3 text-center">
                  {item.fixed_amount
                    ? formatAmount(item.fixed_amount)
                    : "-"}
                </td>

                <td className="px-4 py-3 text-center text-sm">

                  {item.lower_limit != null ||
                  item.upper_limit != null ? (
                    <>
                      {formatAmount(item.lower_limit)}
                      {" - "}
                      {item.upper_limit == null
                        ? "Above"
                        : formatAmount(item.upper_limit)}
                    </>
                  ) : (
                    "-"
                  )}

                </td>

                <td className="px-4 py-3 text-center text-sm text-slate-600">
                  {item.created_at
                    ? new Date(
                        item.created_at
                      ).toLocaleDateString()
                    : "-"}
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