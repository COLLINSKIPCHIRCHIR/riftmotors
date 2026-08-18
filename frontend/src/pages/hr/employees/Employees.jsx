import { useEffect, useState } from "react";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
  getBranches,
} from "../../../api/hrApi";

import EmployeeTable from "./EmployeeTable";
import EmployeeModal from "./EmployeeModal";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // ==========================
  // Load Data
  // ==========================

  const loadEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await getDepartments();
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await getBranches();
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);

    await Promise.all([
      loadEmployees(),
      loadDepartments(),
      loadBranches(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ==========================
  // Add Employee
  // ==========================

  const handleAdd = () => {
    setSelectedEmployee(null);
    setShowModal(true);
  };

  // ==========================
  // Edit Employee
  // ==========================

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  // ==========================
  // Delete Employee
  // ==========================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;

    try {
      await deleteEmployee(id);

      loadEmployees();
    } catch (err) {
      console.error(err);
      alert("Failed to delete employee.");
    }
  };

 // ==========================
// Save Employee
// ==========================

const handleSave = async (form) => {
  try {
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      const value = form[key];

      if (key === "photo_url") {
        // Only attach the file itself under "photo".
        // If it's a string (existing URL) or empty, skip — no new file selected.
        if (value instanceof File) {
          formData.append("photo", value);
        }
        return;
      }

      if (
        ["date_of_birth", "probation_end_date", "termination_date"].includes(key)
      ) {
        formData.append(key, value || "");
      } else {
        formData.append(key, value ?? "");
      }
    });

    if (selectedEmployee) {
      await updateEmployee(selectedEmployee.id, formData);
    } else {
      await createEmployee(formData);
    }

    setShowModal(false);
    loadEmployees();
  } catch (err) {
    console.error(err);
    alert("Failed to save employee.");
  }
};
  // ==========================
  // Loading
  // ==========================

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading Employees...
      </div>
    );
  }

  // ==========================
  // Render
  // ==========================

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Employees
          </h1>

          <p className="text-sm text-slate-500">
            Manage company employees.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Employee
        </button>

      </div>

      {/* Table */}

      <EmployeeTable
        employees={employees}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal */}

      {showModal && (
        <EmployeeModal
          employee={selectedEmployee}
          departments={departments}
          branches={branches}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}