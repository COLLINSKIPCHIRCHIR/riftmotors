import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function PublicHolidayTable({
  holidays,
  onEdit,
  onDelete,
}) {
  if (!holidays.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
        No public holidays found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700">
                #
              </th>

              <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700">
                Holiday
              </th>

              <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700">
                Date
              </th>

              <th className="px-5 py-3 text-center text-sm font-semibold text-slate-700">
                Recurring
              </th>

              <th className="px-5 py-3 text-center text-sm font-semibold text-slate-700">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {holidays.map((holiday, index) => (

              <tr
                key={holiday.id}
                className="border-t hover:bg-slate-50"
              >

                <td className="px-5 py-3">
                  {index + 1}
                </td>

                <td className="px-5 py-3 font-medium text-slate-800">
                  {holiday.holiday_name}
                </td>

                <td className="px-5 py-3">
                  {new Date(
                    holiday.holiday_date
                  ).toLocaleDateString()}
                </td>

                <td className="px-5 py-3 text-center">

                  {holiday.is_recurring ? (

                    <span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      Yes
                    </span>

                  ) : (

                    <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      No
                    </span>

                  )}

                </td>

                <td className="px-5 py-3">

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() =>
                        onEdit(holiday)
                      }
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() =>
                        onDelete(holiday.id)
                      }
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