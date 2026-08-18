import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

export default function PayslipTable({
  payslips,
  onEdit,
  onDelete,
}) {
  if (!payslips.length) {
    return (
      <div className="bg-white rounded-xl shadow border p-8 text-center text-slate-500">
        No payslips found.
      </div>
    );
  }

  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";

      case "Draft":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
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
                Payroll Period
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Basic Salary
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Gross Pay
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                PAYE
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Net Pay
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Status
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Paid At
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {payslips.map((payslip) => (

              <tr
                key={payslip.id}
                className="border-t hover:bg-slate-50"
              >

                <td className="px-4 py-3">

                  <div className="font-semibold">
                    {payslip.first_name} {payslip.last_name}
                  </div>

                  <div className="text-xs text-slate-500">
                    {payslip.employee_number}
                  </div>

                </td>

                <td className="px-4 py-3">
                  {payslip.period_label}
                </td>

                <td className="px-4 py-3 text-right">
                  {formatMoney(payslip.basic_salary)}
                </td>

                <td className="px-4 py-3 text-right font-semibold text-blue-700">
                  {formatMoney(payslip.gross_pay)}
                </td>

                <td className="px-4 py-3 text-right text-red-600">
                  {formatMoney(payslip.paye_amount)}
                </td>

                <td className="px-4 py-3 text-right font-bold text-green-700">
                  {formatMoney(payslip.net_pay)}
                </td>

                <td className="px-4 py-3 text-center">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                      payslip.status
                    )}`}
                  >
                    {payslip.status}
                  </span>

                </td>

                <td className="px-4 py-3 text-center">
                  {formatDate(payslip.paid_at)}
                </td>

                <td className="px-4 py-3">

                  <div className="flex justify-center gap-3">

                    <button
                      onClick={() => onEdit(payslip)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() => onDelete(payslip.id)}
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