import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

const proficiencyLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];

export default function EmployeeSkillModal({
  skill,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    skill_name: "",
    proficiency_level: "",
  });

  useEffect(() => {
    if (skill) {
      setForm({
        skill_name: skill.skill_name || "",
        proficiency_level: skill.proficiency_level || "",
      });
    }
  }, [skill]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.skill_name.trim()) {
      return alert("Skill name is required.");
    }

    if (!form.proficiency_level) {
      return alert("Please select a proficiency level.");
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">

        {/* Header */}

        <div className="flex items-center justify-between border-b px-6 py-4">

          <h2 className="text-xl font-bold text-slate-800">

            {skill ? "Edit Skill" : "Add Skill"}

          </h2>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-500"
          >
            <FaTimes />
          </button>

        </div>

        <form onSubmit={handleSubmit}>

          <div className="p-6 space-y-5">

            {/* Skill Name */}

            <div>

              <label className="block text-sm font-medium mb-1">
                Skill Name *
              </label>

              <input
                type="text"
                name="skill_name"
                value={form.skill_name}
                onChange={handleChange}
                placeholder="e.g. React.js"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Proficiency */}

            <div>

              <label className="block text-sm font-medium mb-1">
                Proficiency Level *
              </label>

              <select
                name="proficiency_level"
                value={form.proficiency_level}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">
                  Select Level
                </option>

                {proficiencyLevels.map((level) => (
                  <option
                    key={level}
                    value={level}
                  >
                    {level}
                  </option>
                ))}

              </select>

            </div>

          </div>

          {/* Footer */}

          <div className="border-t px-6 py-4 flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {skill ? "Update Skill" : "Save Skill"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}