import {
  FaEdit,
  FaTrash,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaUserTie,
} from "react-icons/fa";

export default function EmployeeSalaryCard({
  records,
  onEdit,
  onDelete,
}) {
  if (!records.length) {
    return (
      <div className="border rounded-xl p-8 text-center text-slate-500">
        No salary history available.
      </div>
    );
  }

  const formatCurrency = (amount) => {
    if (!amount) return "KES 0.00";

    return Number(amount).toLocaleString("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    });
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-5">

      {records.map((record) => {

        const active = !record.effective_to;

        return (
          <div
            key={record.id}
            className="border rounded-xl bg-white shadow-sm hover:shadow-md transition"
          >
            {/* Header */}

            <div className="flex items-center justify-between border-b px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">

                  <FaMoneyBillWave className="text-emerald-700" />

                </div>

                <div>

                  <h3 className="font-semibold text-slate-800">

                    {formatCurrency(record.basic_salary)}

                  </h3>

                  <p className="text-sm text-slate-500">

                    Salary Record

                  </p>

                </div>

              </div>

              <div className="flex items-center gap-2">

                {active && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    Current Salary
                  </span>
                )}

                <button
                  onClick={() => onEdit(record)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaEdit />
                </button>

                <button
                  onClick={() => onDelete(record.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>

              </div>

            </div>

            {/* Details */}

            <div className="grid md:grid-cols-2 gap-6 p-5">

              <div className="space-y-4">

                <div className="flex gap-3">

                  <FaCalendarAlt className="text-slate-400 mt-1" />

                  <div>

                    <p className="text-xs uppercase text-slate-500">
                      Effective From
                    </p>

                    <p className="font-medium">
                      {formatDate(record.effective_from)}
                    </p>

                  </div>

                </div>

                <div className="flex gap-3">

                  <FaCalendarAlt className="text-slate-400 mt-1" />

                  <div>

                    <p className="text-xs uppercase text-slate-500">
                      Effective To
                    </p>

                    <p className="font-medium">

                      {record.effective_to
                        ? formatDate(record.effective_to)
                        : "Present"}

                    </p>

                  </div>

                </div>

              </div>

              <div className="space-y-4">

                <div>

                  <p className="text-xs uppercase text-slate-500">
                    Reason
                  </p>

                  <p className="font-medium">

                    {record.reason || "-"}

                  </p>

                </div>

                <div className="flex gap-3">

                  <FaUserTie className="text-slate-400 mt-1" />

                  <div>

                    <p className="text-xs uppercase text-slate-500">
                      Changed By
                    </p>

                    <p className="font-medium">

                      {record.changed_by_name || "-"}

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>
        );

      })}

    </div>
  );
}