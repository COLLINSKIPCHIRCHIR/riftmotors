import { useEffect, useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";

import { getDepartments, deleteDepartment } from "../../../api/hrApi";

import DepartmentModal from "./DepartmentModal";
import DepartmentTable from "./DepartmentTable";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const loadDepartments = async () => {
    try {
      setLoading(true);

      const { data } = await getDepartments();

      setDepartments(data);
      setFilteredDepartments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    const filtered = departments.filter((department) =>
      department.name.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredDepartments(filtered);
  }, [search, departments]);

  const handleAdd = () => {
    setSelectedDepartment(null);
    setShowModal(true);
  };

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;

    try {
      await deleteDepartment(id);

      loadDepartments();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6">

      <div className="flex justify-between items-center mb-6">

        <div>

          <h1 className="text-2xl font-bold">
            Departments
          </h1>

          <p className="text-gray-500">
            Manage company departments.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaPlus />

          New Department

        </button>

      </div>

      <div className="mb-4 relative">

        <FaSearch className="absolute left-3 top-3 text-gray-400" />

        <input
          className="border rounded w-full pl-10 pr-3 py-2"
          placeholder="Search department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      <DepartmentTable
        departments={filteredDepartments}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <DepartmentModal
          department={selectedDepartment}
          onClose={() => setShowModal(false)}
          onSaved={loadDepartments}
        />
      )}

    </div>
  );
}