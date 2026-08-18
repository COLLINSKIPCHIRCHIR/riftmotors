import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function PayeTaxBandTable({
  bands,
  onEdit,
  onDelete,
}) {
  if (!bands.length) {
    return (
      <div className="bg-white rounded-xl shadow border p-8 text-center text-slate-500">
        No PAYE Tax Bands found.
      </div>
    );
  }

  const today = new Date();

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "-";

    return Number(value).toLocaleString();
  };

  const getStatus = (band) => {
    const start = new Date(band.effective_from);

    const end = band.effective_to
      ? new Date(band.effective_to)
      : null;

    if (start > today)
      return {
        text: "Upcoming",
        color: "bg-blue-100 text-blue-700",
      };

    if (end && end < today)
      return {
        text: "Expired",
        color: "bg-red-100 text-red-700",
      };

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
                Band
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Lower Limit
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Upper Limit
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Tax Rate
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Effective From
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Effective To
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

            {bands.map((band) => {
              const status = getStatus(band);

              return (
                <tr
                  key={band.id}
                  className="border-t hover:bg-slate-50"
                >

                  <td className="px-4 py-3 font-semibold">
                    Band {band.band_order}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {formatCurrency(band.lower_limit)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {band.upper_limit == null
                      ? "Above"
                      : formatCurrency(
                          band.upper_limit
                        )}
                  </td>

                  <td className="px-4 py-3 text-center font-medium text-blue-700">
                    {band.rate_percentage}%
                  </td>

                  <td className="px-4 py-3 text-center">
                    {band.effective_from
                      ? new Date(
                          band.effective_from
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {band.effective_to
                      ? new Date(
                          band.effective_to
                        ).toLocaleDateString()
                      : "Current"}
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
                        onClick={() => onEdit(band)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>

                      <button
                        onClick={() => onDelete(band.id)}
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