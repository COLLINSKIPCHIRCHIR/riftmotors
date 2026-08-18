import { FaEdit, FaTrash } from "react-icons/fa";

export default function DepartmentTable({
  departments,
  loading,
  onEdit,
  onDelete,
}) {
  if (loading)
    return <p>Loading...</p>;

  return (
    <div className="bg-white rounded shadow overflow-x-auto">

      <table className="w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="text-left p-3">
              Department
            </th>

            <th className="text-left p-3">
              Description
            </th>

            <th className="text-center p-3">
              Status
            </th>

            <th className="text-center p-3">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {departments.map((department) => (
            <tr
              key={department.id}
              className="border-t"
            >
              <td className="p-3">
                {department.name}
              </td>

              <td className="p-3">
                {department.description}
              </td>

              <td className="text-center">

                <span
                  className={`px-2 py-1 rounded text-sm ${
                    department.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {department.is_active ? "Active" : "Inactive"}
                </span>

              </td>

              <td className="text-center">

                <button
                  onClick={() => onEdit(department)}
                  className="text-blue-600 mr-3"
                >
                  <FaEdit />
                </button>

                <button
                  onClick={() => onDelete(department.id)}
                  className="text-red-600"
                >
                  <FaTrash />
                </button>

              </td>

            </tr>
          ))}

          {!departments.length && (
            <tr>

              <td
                colSpan="4"
                className="text-center p-5"
              >
                No departments found.
              </td>

            </tr>
          )}

        </tbody>

      </table>

    </div>
  );
}