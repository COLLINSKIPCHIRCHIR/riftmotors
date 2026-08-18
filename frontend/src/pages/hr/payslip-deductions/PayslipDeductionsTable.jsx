import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function PayslipDeductionsTable({
  deductions,
  onEdit,
  onDelete,
}) {
  const formatMoney = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (!deductions.length) {
    return (
      <div className="bg-white rounded-xl shadow border p-8 text-center text-slate-500">
        No payslip deductions found.
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
                Deduction Type
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

            {deductions.map((deduction) => (

              <tr
                key={deduction.id}
                className="border-t hover:bg-slate-50"
              >

                <td className="px-4 py-3">

                  <div className="font-semibold text-slate-800">
                    {deduction.first_name} {deduction.last_name}
                  </div>

                </td>

                <td className="px-4 py-3 text-slate-600">
                  {deduction.employee_number}
                </td>

                <td className="px-4 py-3 text-center">
                  #{deduction.payslip_id}
                </td>

                <td className="px-4 py-3">
                  {deduction.deduction_type || "-"}
                </td>

                <td className="px-4 py-3">
                  {deduction.description}
                </td>

                <td className="px-4 py-3 text-right font-semibold text-red-600">
                  {formatMoney(deduction.amount)}
                </td>

                <td className="px-4 py-3">

                  <div className="flex justify-center gap-3">

                    <button
                      onClick={() => onEdit(deduction)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() => onDelete(deduction.id)}
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

      {/* Footer */}

      <div className="border-t bg-slate-50 px-6 py-3 flex justify-between items-center">

        <div className="text-sm text-slate-600">
          Total Deduction Records
        </div>

        <div className="font-bold text-blue-700">
          {deductions.length}
        </div>

      </div>

    </div>
  );
}