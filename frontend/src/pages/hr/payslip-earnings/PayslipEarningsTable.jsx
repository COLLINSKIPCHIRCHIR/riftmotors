import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function PayslipEarningsTable({
  earnings,
  onEdit,
  onDelete,
}) {
  const formatMoney = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (!earnings.length) {
    return (
      <div className="bg-white rounded-xl shadow border p-8 text-center text-slate-500">
        No payslip earnings found.
      </div>
    );
  }

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
                Employee No.
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Payslip ID
              </th>

              <th className="px-4 py-3 text-left font-semibold">
                Description
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Amount
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {earnings.map((earning) => (

              <tr
                key={earning.id}
                className="border-t hover:bg-slate-50"
              >

                <td className="px-4 py-3">

                  <div className="font-semibold text-slate-800">
                    {earning.first_name} {earning.last_name}
                  </div>

                </td>

                <td className="px-4 py-3 text-slate-600">
                  {earning.employee_number}
                </td>

                <td className="px-4 py-3 text-center">
                  #{earning.payslip_id}
                </td>

                <td className="px-4 py-3">
                  {earning.description}
                </td>

                <td className="px-4 py-3 text-right font-semibold text-green-700">
                  {formatMoney(earning.amount)}
                </td>

                <td className="px-4 py-3">

                  <div className="flex justify-center gap-3">

                    <button
                      onClick={() => onEdit(earning)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() => onDelete(earning.id)}
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

      <div className="border-t bg-slate-50 px-6 py-3 flex justify-between items-center">

        <div className="text-sm text-slate-600">
          Total Earnings Records
        </div>

        <div className="font-bold text-blue-700">
          {earnings.length}
        </div>

      </div>

    </div>
  );
}