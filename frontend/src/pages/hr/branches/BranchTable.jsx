import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function BranchTable({
  branches,
  loading,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">

      <table className="w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="p-3 text-left">
              Code
            </th>

            <th className="p-3 text-left">
              Name
            </th>

            <th className="p-3 text-left">
              Phone
            </th>

            <th className="p-3 text-left">
              Email
            </th>

            <th className="p-3 text-left">
              Head Office
            </th>

            <th className="p-3 text-center">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {branches.map((branch) => (
            <tr
              key={branch.id}
              className="border-t"
            >
              <td className="p-3">
                {branch.branch_code}
              </td>

              <td className="p-3">
                {branch.name}
              </td>

              <td className="p-3">
                {branch.phone}
              </td>

              <td className="p-3">
                {branch.email}
              </td>

              <td className="p-3">
                {branch.is_head_office ? "Yes" : "No"}
              </td>

              <td className="p-3">

                <div className="flex justify-center gap-3">

                  <button
                    onClick={() => onEdit(branch)}
                  >
                    <FaEdit className="text-blue-600" />
                  </button>

                  <button
                    onClick={() => onDelete(branch.id)}
                  >
                    <FaTrash className="text-red-600" />
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