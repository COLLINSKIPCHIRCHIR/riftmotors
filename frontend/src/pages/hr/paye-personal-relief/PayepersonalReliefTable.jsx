import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function PayePersonalReliefTable({
  reliefs,
  onEdit,
  onDelete,
}) {
  if (!reliefs.length) {
    return (
      <div className="bg-white rounded-xl shadow border p-8 text-center text-slate-500">
        No PAYE Personal Relief records found.
      </div>
    );
  }

  const today = new Date();

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "-";

    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStatus = (relief) => {
    const start = new Date(relief.effective_from);

    const end = relief.effective_to
      ? new Date(relief.effective_to)
      : null;

    if (start > today) {
      return {
        text: "Upcoming",
        color: "bg-blue-100 text-blue-700",
      };
    }

    if (end && end < today) {
      return {
        text: "Expired",
        color: "bg-red-100 text-red-700",
      };
    }

    return {
      text: "Current",
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
                Effective From
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Effective To
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Monthly Relief (KES)
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

            {reliefs.map((relief) => {
              const status = getStatus(relief);

              return (
                <tr
                  key={relief.id}
                  className="border-t hover:bg-slate-50"
                >

                  <td className="px-4 py-3">
                    {new Date(
                      relief.effective_from
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3">

                    {relief.effective_to
                      ? new Date(
                          relief.effective_to
                        ).toLocaleDateString()
                      : (
                        <span className="text-green-600 font-medium">
                          Current
                        </span>
                      )}

                  </td>

                  <td className="px-4 py-3 text-right font-semibold text-blue-700">
                    {formatCurrency(
                      relief.monthly_relief_amount
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
                    >
                      {status.text}
                    </span>

                  </td>

                  <td className="px-4 py-3">

                    <div className="flex justify-center gap-3">

                      <button
                        onClick={() => onEdit(relief)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>

                      <button
                        onClick={() => onDelete(relief.id)}
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