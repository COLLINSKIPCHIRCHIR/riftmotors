import {
  FaEdit,
  FaTrash,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

export default function EmployeeAllowanceCard({
  allowances,
  onEdit,
  onDelete,
}) {
  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    });
  };

  if (!allowances.length) {
    return (
      <div className="border rounded-xl p-8 text-center text-slate-500">
        No allowances have been added for this employee.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {allowances.map((allowance) => (
        <div
          key={allowance.id}
          className="border rounded-xl bg-white shadow-sm hover:shadow-md transition"
        >
          {/* Header */}

          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FaMoneyBillWave className="text-emerald-700 text-lg" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">
                  {allowance.name}
                </h3>

                <p className="text-lg font-bold text-emerald-700">
                  {formatCurrency(allowance.amount)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(allowance)}
                className="text-blue-600 hover:text-blue-800"
              >
                <FaEdit />
              </button>

              <button
                onClick={() => onDelete(allowance.id)}
                className="text-red-600 hover:text-red-800"
              >
                <FaTrash />
              </button>
            </div>
          </div>

          {/* Body */}

          <div className="grid md:grid-cols-2 gap-6 p-5">

            {/* Taxable */}

            <div>
              <p className="text-xs uppercase text-slate-500 mb-1">
                Taxable
              </p>

              {allowance.is_taxable ? (
                <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  <FaCheckCircle />
                  Yes
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm">
                  <FaTimesCircle />
                  No
                </span>
              )}
            </div>

            {/* Status */}

            <div>
              <p className="text-xs uppercase text-slate-500 mb-1">
                Status
              </p>

              {allowance.is_active ? (
                <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  <FaCheckCircle />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                  <FaTimesCircle />
                  Inactive
                </span>
              )}
            </div>

          </div>

          {/* Footer */}

          <div className="border-t bg-slate-50 px-5 py-3 text-xs text-slate-500 flex justify-between">

            <span>
              Created:
              {" "}
              {new Date(
                allowance.created_at
              ).toLocaleDateString()}
            </span>

            <span>
              Employee Allowance
            </span>

          </div>

        </div>
      ))}
    </div>
  );
}