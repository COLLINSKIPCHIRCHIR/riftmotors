import { useEffect, useState } from "react";
import {
  FaUsers,
  FaPlus,
} from "react-icons/fa";

import {
  getEmployeeContactsByEmployee,
  createEmployeeContact,
  updateEmployeeContact,
  deleteEmployeeContact,
} from "../../../api/hrApi";

import EmployeeContactModal from "./EmployeeContactModal";
import EmployeeContactCard from "./EmployeeContactCard";

export default function EmployeeContacts({ employeeId }) {
  const [contacts, setContacts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedContact, setSelectedContact] = useState(null);

  // ==========================
  // Load Contacts
  // ==========================

  const loadContacts = async () => {
    try {
      setLoading(true);

      const res = await getEmployeeContactsByEmployee(employeeId);

      setContacts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      loadContacts();
    }
  }, [employeeId]);

  // ==========================
  // Add Contact
  // ==========================

  const handleAdd = () => {
    setSelectedContact(null);
    setShowModal(true);
  };

  // ==========================
  // Edit Contact
  // ==========================

  const handleEdit = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  // ==========================
  // Delete Contact
  // ==========================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this contact?")) return;

    try {
      await deleteEmployeeContact(id);

      loadContacts();
    } catch (err) {
      console.error(err);

      alert("Failed to delete contact.");
    }
  };

  // ==========================
  // Save
  // ==========================

  const handleSave = async (form) => {
    try {
      const payload = {
        ...form,
        employee_id: employeeId,
      };

      if (selectedContact) {
        await updateEmployeeContact(selectedContact.id, payload);
      } else {
        await createEmployeeContact(payload);
      }

      setShowModal(false);

      loadContacts();
    } catch (err) {
      console.error(err);

      alert("Failed to save contact.");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

      {/* Header */}

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">

            <FaUsers />

          </div>

          <div>

            <h3 className="font-bold text-lg">
              Emergency Contacts
            </h3>

            <p className="text-sm text-slate-500">
              Contacts to reach in case of emergency.
            </p>

          </div>

        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <FaPlus />

          Add Contact
        </button>

      </div>

      {/* Loading */}

      {loading ? (

        <div className="text-center py-10 text-slate-500">

          Loading contacts...

        </div>

      ) : contacts.length === 0 ? (

        <div className="border rounded-xl border-dashed border-slate-300 py-12 text-center">

          <h4 className="font-semibold text-slate-700">
            No emergency contacts
          </h4>

          <p className="text-slate-500 mt-2">
            Click "Add Contact" to create one.
          </p>

        </div>

      ) : (

        <div className="space-y-4">

          {contacts.map((contact) => (

            <EmployeeContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

          ))}

        </div>

      )}

      {/* Modal */}

      {showModal && (

        <EmployeeContactModal
          contact={selectedContact}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />

      )}

    </div>
  );
}