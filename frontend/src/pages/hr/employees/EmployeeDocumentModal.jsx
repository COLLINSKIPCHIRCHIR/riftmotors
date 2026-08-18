import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

const documentTypes = [
  "National ID",
  "Passport",
  "Driving Licence",
  "KRA PIN Certificate",
  "NSSF Certificate",
  "SHIF Certificate",
  "Academic Certificate",
  "Employment Contract",
  "Appointment Letter",
  "Promotion Letter",
  "Warning Letter",
  "Termination Letter",
  "Medical Certificate",
  "CV / Resume",
  "Other",
];

export default function EmployeeDocumentModal({
  document,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    document_type: "",
    document: null,
  });

  useEffect(() => {
    if (document) {
      setForm({
        document_type: document.document_type || "",
        document: null,
      });
    }
  }, [document]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "document") {
      setForm((prev) => ({
        ...prev,
        document: files[0],
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.document_type) {
      return alert("Please select a document type.");
    }

    if (!document && !form.document) {
      return alert("Please select a document.");
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b px-6 py-4">

          <h2 className="text-xl font-bold text-slate-800">

            {document ? "Edit Document" : "Upload Document"}

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

            {/* Document Type */}

            <div>

              <label className="block text-sm font-medium mb-1">

                Document Type *

              </label>

              <select
                name="document_type"
                value={form.document_type}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Document</option>

                {documentTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}

              </select>

            </div>

            {/* File */}

            <div>

              <label className="block text-sm font-medium mb-1">

                {document
                  ? "Replace File (Optional)"
                  : "Choose File *"}

              </label>

              <input
                type="file"
                name="document"
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

              {document && (

                <p className="mt-2 text-sm text-slate-500">

                  Current File:
                  {" "}
                  <strong>{document.file_name}</strong>

                </p>

              )}

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
              {document ? "Update Document" : "Upload Document"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}