import { useEffect, useState } from "react";

import {
  getDeductionTypes,
  createDeductionType,
  updateDeductionType,
  deleteDeductionType,
} from "../../../api/hrApi";

import DeductionTypeTable from "./DeductionTypeTable";
import DeductionTypeModal from "./DeductionTypeModal";

export default function DeductionTypes() {
  const [deductionTypes, setDeductionTypes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [selectedDeduction, setSelectedDeduction] =
    useState(null);

  // =====================================

  const loadDeductionTypes = async () => {
    try {
      setLoading(true);

      const res = await getDeductionTypes();

      setDeductionTypes(res.data);
    } catch (err) {
      console.error(err);

      alert("Failed to load deduction types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeductionTypes();
  }, []);

  // =====================================

  const handleAdd = () => {
    setSelectedDeduction(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setSelectedDeduction(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this deduction type?"))
      return;

    try {
      await deleteDeductionType(id);

      loadDeductionTypes();
    } catch (err) {
      console.error(err);

      alert("Failed to delete deduction type.");
    }
  };

  const handleSave = async (form) => {
    try {
      if (selectedDeduction) {
        await updateDeductionType(
          selectedDeduction.id,
          form
        );
      } else {
        await createDeductionType(form);
      }

      setShowModal(false);

      loadDeductionTypes();
    } catch (err) {
      console.error(err);

      alert("Failed to save deduction type.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading deduction types...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold">
            Deduction Types
          </h1>

          <p className="text-slate-500">
            Configure payroll deduction types.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Deduction Type
        </button>

      </div>

      <DeductionTypeTable
        deductionTypes={deductionTypes}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <DeductionTypeModal
          deductionType={selectedDeduction}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}