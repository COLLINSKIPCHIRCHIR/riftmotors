import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";

export default function EmployeeTable({ employees, onEdit, onDelete }) {
  const navigate = useNavigate();

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-10 text-center text-slate-500">
        No employees found.
      </div>
    );
  }

  const badgeColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "On Probation":
        return "bg-yellow-100 text-yellow-700";
      case "Suspended":
        return "bg-orange-100 text-orange-700";
      case "Terminated":
        return "bg-red-100 text-red-700";
      case "Resigned":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Employee No</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Branch</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Job Title</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
            <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id} className="border-b hover:bg-slate-50">
              <td className="px-4 py-3">{employee.employee_number}</td>
              <td className="px-4 py-3 font-medium">
                {employee.first_name} {employee.last_name}
              </td>
              <td className="px-4 py-3">{employee.department_name || "-"}</td>
              <td className="px-4 py-3">{employee.branch_name || "-"}</td>
              <td className="px-4 py-3">{employee.job_title || "-"}</td>
              <td className="px-4 py-3">{employee.phone || "-"}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor(
                    employee.employment_status
                  )}`}
                >
                  {employee.employment_status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/hr/employees/${employee.id}`)}
                    className="bg-slate-500 hover:bg-slate-600 text-white p-2 rounded"
                    title="View Employee"
                  >
                    <FaEye />
                  </button>

                  <button
                    onClick={() => onEdit(employee)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
                    title="Edit Employee"
                  >
                    <FaEdit />
                  </button>

                  <button
                    onClick={() => onDelete(employee.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                    title="Delete Employee"
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
  );
}