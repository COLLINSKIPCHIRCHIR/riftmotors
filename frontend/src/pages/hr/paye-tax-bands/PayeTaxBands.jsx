import { useEffect, useState } from "react";

import {
  getPayeTaxBands,
  createPayeTaxBand,
  updatePayeTaxBand,
  deletePayeTaxBand,
} from "../../../api/hrApi";

import PayeTaxBandTable from "./PayeTaxBandTable";
import PayeTaxBandModal from "./PayeTaxBandModal";

export default function PayeTaxBands() {
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedBand, setSelectedBand] = useState(null);

  // ======================================

  const loadBands = async () => {
    try {
      setLoading(true);

      const res = await getPayeTaxBands();

      setBands(res.data);

    } catch (err) {

      console.error(err);

      alert("Failed to load PAYE Tax Bands.");

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadBands();
  }, []);

  // ======================================

  const handleAdd = () => {
    setSelectedBand(null);
    setShowModal(true);
  };

  const handleEdit = (band) => {
    setSelectedBand(band);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this PAYE Tax Band?"))
      return;

    try {

      await deletePayeTaxBand(id);

      loadBands();

    } catch (err) {

      console.error(err);

      alert("Failed to delete PAYE Tax Band.");

    }
  };

  const handleSave = async (form) => {
    try {

      if (selectedBand) {

        await updatePayeTaxBand(
          selectedBand.id,
          form
        );

      } else {

        await createPayeTaxBand(form);

      }

      setShowModal(false);

      loadBands();

    } catch (err) {

      console.error(err);

      alert("Failed to save PAYE Tax Band.");

    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading PAYE Tax Bands...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold">
            PAYE Tax Bands
          </h1>

          <p className="text-slate-500">
            Manage Kenya PAYE tax bands and
            historical rate changes.
          </p>

        </div>

        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Tax Band
        </button>

      </div>

      <PayeTaxBandTable
        bands={bands}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <PayeTaxBandModal
          band={selectedBand}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}