import { useEffect, useState } from "react";
import { FaTools, FaPlus } from "react-icons/fa";

import {
  getEmployeeSkillsByEmployee,
  createEmployeeSkill,
  updateEmployeeSkill,
  deleteEmployeeSkill,
} from "../../../api/hrApi";

import EmployeeSkillCard from "./EmployeeSkillCard";
import EmployeeSkillModal from "./EmployeeSkillModal";

export default function EmployeeSkills({ employeeId }) {
  const [skills, setSkills] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedSkill, setSelectedSkill] = useState(null);

  // ==========================
  // Load Skills
  // ==========================

  const loadSkills = async () => {
    try {
      setLoading(true);

      const res = await getEmployeeSkillsByEmployee(employeeId);

      setSkills(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      loadSkills();
    }
  }, [employeeId]);

  // ==========================
  // Add
  // ==========================

  const handleAdd = () => {
    setSelectedSkill(null);
    setShowModal(true);
  };

  // ==========================
  // Edit
  // ==========================

  const handleEdit = (skill) => {
    setSelectedSkill(skill);
    setShowModal(true);
  };

  // ==========================
  // Delete
  // ==========================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this skill?")) return;

    try {
      await deleteEmployeeSkill(id);

      loadSkills();
    } catch (err) {
      console.error(err);

      alert("Failed to delete skill.");
    }
  };

  // ==========================
  // Save
  // ==========================

  const handleSave = async (form) => {
    try {
      const data = {
        employee_id: employeeId,
        skill_name: form.skill_name,
        proficiency_level: form.proficiency_level,
      };

      if (selectedSkill) {
        await updateEmployeeSkill(selectedSkill.id, data);
      } else {
        await createEmployeeSkill(data);
      }

      setShowModal(false);

      loadSkills();
    } catch (err) {
      console.error(err);

      alert("Failed to save skill.");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

      {/* Header */}

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">

            <FaTools />

          </div>

          <div>

            <h3 className="font-bold text-lg">
              Employee Skills
            </h3>

            <p className="text-sm text-slate-500">
              Skills and competency levels for this employee.
            </p>

          </div>

        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <FaPlus />

          Add Skill
        </button>

      </div>

      {/* Content */}

      {loading ? (

        <div className="text-center py-10 text-slate-500">
          Loading skills...
        </div>

      ) : skills.length === 0 ? (

        <div className="border border-dashed border-slate-300 rounded-xl py-12 text-center">

          <h4 className="font-semibold text-slate-700">
            No skills added
          </h4>

          <p className="text-slate-500 mt-2">
            Add employee skills and proficiency levels.
          </p>

        </div>

      ) : (

        <div className="space-y-3">

          {skills.map((skill) => (

            <EmployeeSkillCard
              key={skill.id}
              skill={skill}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

          ))}

        </div>

      )}

      {/* Modal */}

      {showModal && (

        <EmployeeSkillModal
          skill={selectedSkill}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />

      )}

    </div>
  );
}