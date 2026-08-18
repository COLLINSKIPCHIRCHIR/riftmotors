import {
  FaTools,
  FaEdit,
  FaTrash,
  FaChartLine,
} from "react-icons/fa";

export default function EmployeeSkillCard({
  skill,
  onEdit,
  onDelete,
}) {
  const badgeColor = (level) => {
    switch (level) {
      case "Beginner":
        return "bg-red-100 text-red-700";

      case "Intermediate":
        return "bg-yellow-100 text-yellow-700";

      case "Advanced":
        return "bg-blue-100 text-blue-700";

      case "Expert":
        return "bg-green-100 text-green-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-4">

          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">

            <FaTools size={20} />

          </div>

          <div>

            <h3 className="font-semibold text-slate-800 text-lg">

              {skill.skill_name}

            </h3>

            <div className="mt-2">

              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${badgeColor(
                  skill.proficiency_level
                )}`}
              >
                <FaChartLine size={12} />

                {skill.proficiency_level}

              </span>

            </div>

          </div>

        </div>

      </div>

      {/* Actions */}

      <div className="flex justify-end gap-3 mt-6 border-t pt-4">

        <button
          onClick={() => onEdit(skill)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <FaEdit />

          Edit
        </button>

        <button
          onClick={() => onDelete(skill.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
        >
          <FaTrash />

          Delete
        </button>

      </div>

    </div>
  );
}