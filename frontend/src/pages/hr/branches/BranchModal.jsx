import React, { useEffect, useState } from "react";

export default function BranchModal({
  open,
  onClose,
  onSave,
  branch,
}) {
  const [form, setForm] = useState({
    branch_code: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    manager_id: "",
    is_head_office: false,
  });

  useEffect(() => {
    if (branch) {
      setForm({
        branch_code: branch.branch_code || "",
        name: branch.name || "",
        phone: branch.phone || "",
        email: branch.email || "",
        address: branch.address || "",
        manager_id: branch.manager_id || "",
        is_head_office: branch.is_head_office || false,
      });
    } else {
      setForm({
        branch_code: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        manager_id: "",
        is_head_office: false,
      });
    }
  }, [branch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white rounded-lg p-6 w-full max-w-lg">

        <h2 className="text-xl font-bold mb-4">
          {branch ? "Edit Branch" : "Add Branch"}
        </h2>

        <div className="space-y-3">

          <input
            className="w-full border rounded p-2"
            placeholder="Branch Code"
            value={form.branch_code}
            onChange={(e) =>
              setForm({
                ...form,
                branch_code: e.target.value,
              })
            }
          />

          <input
            className="w-full border rounded p-2"
            placeholder="Branch Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

          <input
            className="w-full border rounded p-2"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
          />

          <input
            className="w-full border rounded p-2"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <textarea
            className="w-full border rounded p-2"
            rows={3}
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value,
              })
            }
          />

          <label className="flex items-center gap-2">

            <input
              type="checkbox"
              checked={form.is_head_office}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_head_office: e.target.checked,
                })
              }
            />

            Head Office

          </label>

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(form)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>

        </div>

      </div>

    </div>
  );
}