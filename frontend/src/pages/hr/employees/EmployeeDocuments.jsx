import { useEffect, useState } from "react";
import { FaFileAlt, FaPlus } from "react-icons/fa";

import {
  getEmployeeDocumentsByEmployee,
  createEmployeeDocument,
  updateEmployeeDocument,
  deleteEmployeeDocument,
} from "../../../api/hrApi";

import EmployeeDocumentCard from "./EmployeeDocumentCard";
import EmployeeDocumentModal from "./EmployeeDocumentModal";

export default function EmployeeDocuments({ employeeId }) {
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);

  // ===================================
  // Load Documents
  // ===================================

  const loadDocuments = async () => {
    try {
      setLoading(true);

      const res = await getEmployeeDocumentsByEmployee(employeeId);

      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      loadDocuments();
    }
  }, [employeeId]);

  // ===================================
  // Add
  // ===================================

  const handleAdd = () => {
    setSelectedDocument(null);
    setShowModal(true);
  };

  // ===================================
  // Edit
  // ===================================

  const handleEdit = (document) => {
    setSelectedDocument(document);
    setShowModal(true);
  };

  // ===================================
  // Delete
  // ===================================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document?")) return;

    try {
      await deleteEmployeeDocument(id);

      loadDocuments();
    } catch (err) {
      console.error(err);

      alert("Failed to delete document.");
    }
  };

  // ===================================
  // Save
  // ===================================

  const handleSave = async (form) => {
    try {
      const formData = new FormData();

      formData.append("employee_id", employeeId);

      formData.append(
        "document_type",
        form.document_type
      );

      if (form.document instanceof File) {
        formData.append("document", form.document);
      }

      if (selectedDocument) {
        await updateEmployeeDocument(
          selectedDocument.id,
          formData
        );
      } else {
        await createEmployeeDocument(formData);
      }

      setShowModal(false);

      loadDocuments();
    } catch (err) {
      console.error(err);

      alert("Failed to save document.");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

      {/* Header */}

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">

            <FaFileAlt />

          </div>

          <div>

            <h3 className="font-bold text-lg">
              Employee Documents
            </h3>

            <p className="text-sm text-slate-500">
              Store contracts, IDs, certificates and other employee files.
            </p>

          </div>

        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <FaPlus />

          Upload Document
        </button>

      </div>

      {/* Loading */}

      {loading ? (

        <div className="text-center py-10 text-slate-500">
          Loading documents...
        </div>

      ) : documents.length === 0 ? (

        <div className="border border-dashed border-slate-300 rounded-xl py-12 text-center">

          <h4 className="font-semibold text-slate-700">
            No documents uploaded
          </h4>

          <p className="text-slate-500 mt-2">
            Upload contracts, certificates, IDs and other employee documents.
          </p>

        </div>

      ) : (

        <div className="space-y-3">

          {documents.map((doc) => (

            <EmployeeDocumentCard
              key={doc.id}
              document={doc}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

          ))}

        </div>

      )}

      {/* Modal */}

      {showModal && (

        <EmployeeDocumentModal
          document={selectedDocument}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />

      )}

    </div>
  );
}