import { useEffect, useState } from "react";

import {
  getEmployeeAllowancesByEmployee,
  createEmployeeAllowance,
  updateEmployeeAllowance,
  deleteEmployeeAllowance,
} from "../../../api/hrApi";

import EmployeeAllowanceCard from "./EmployeeAllowanceCard";
import EmployeeAllowanceModal from "./EmployeeAllowanceModal";

export default function EmployeeAllowances({
  employeeId,
}) {
  const [allowances, setAllowances] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [selectedAllowance, setSelectedAllowance] =
    useState(null);

  // =========================================

  const loadAllowances = async () => {
    try {
      setLoading(true);

      const res =
        await getEmployeeAllowancesByEmployee(
          employeeId
        );

      setAllowances(res.data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    if (employeeId) {
      loadAllowances();
    }
  }, [employeeId]);

  // =========================================

  const handleAdd = () => {
    setSelectedAllowance(null);
    setShowModal(true);
  };

  const handleEdit = (allowance) => {
    setSelectedAllowance(allowance);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this allowance?"))
      return;

    try {
      await deleteEmployeeAllowance(id);

      loadAllowances();

    } catch (err) {

      console.error(err);

      alert("Failed to delete allowance.");

    }
  };

  const handleSave = async (form) => {
    try {
      const payload = {
        ...form,
        employee_id: employeeId,
      };

      if (selectedAllowance) {

        await updateEmployeeAllowance(
          selectedAllowance.id,
          payload
        );

      } else {

        await createEmployeeAllowance(payload);

      }

      setShowModal(false);

      loadAllowances();

    } catch (err) {

      console.error(err);

      alert("Failed to save allowance.");

    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-5">
        Loading allowances...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">

      <div className="flex justify-between items-center mb-6">

        <div>

          <h2 className="text-lg font-bold">
            Employee Allowances
          </h2>

          <p className="text-sm text-slate-500">
            Manage employee allowances.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Allowance
        </button>

      </div>

      <EmployeeAllowanceCard
        allowances={allowances}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <EmployeeAllowanceModal
          allowance={selectedAllowance}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}