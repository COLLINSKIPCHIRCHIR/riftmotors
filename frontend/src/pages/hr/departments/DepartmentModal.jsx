import { useEffect, useState } from "react";

import {
  createDepartment,
  updateDepartment,
} from "../../../api/hrApi";

export default function DepartmentModal({
  department,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (department) {
      setForm({
        name: department.name || "",
        description: department.description || "",
      });
    }
  }, [department]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (department) {
        await updateDepartment(
          department.id,
          form
        );
      } else {
        await createDepartment(form);
      }

      onSaved();

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white rounded-lg p-6 w-[500px]">

        <h2 className="text-xl font-semibold mb-5">

          {department
            ? "Edit Department"
            : "Add Department"}

        </h2>

        <form onSubmit={handleSubmit}>

          <div className="mb-4">

            <label className="block mb-1">
              Department Name
            </label>

            <input
              className="border rounded w-full p-2"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

          </div>

          <div className="mb-5">

            <label className="block mb-1">
              Description
            </label>

            <textarea
              className="border rounded w-full p-2"
              rows="4"
              name="description"
              value={form.description}
              onChange={handleChange}
            />

          </div>

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded"
            >
              {department ? "Update" : "Save"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}