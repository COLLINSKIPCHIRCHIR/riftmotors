import React, { useState } from "react";

const CreateEstimateModal = ({
  onClose,
  onSubmit,
  jobId,
  job,
  customers = []
}) => {

  const [taxRate, setTaxRate] = useState(16);

  const [billToCustomerId, setBillToCustomerId] = useState(job?.bill_to_customer_id || "");
  const [billToName, setBillToName] = useState(job?.bill_to_name || job?.customer_name || "");
  const [billToKraPin, setBillToKraPin] = useState(job?.bill_to_kra_pin || "");

  const handleBillToCustomerSelect = (e) => {
    const selectedId = e.target.value;
    const selected = customers.find(c => c.id == selectedId);
    setBillToCustomerId(selectedId);
    if (selected) {
      setBillToName(selected.name);
      setBillToKraPin(selected.kra_pin || "");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      job_id: jobId,
      tax_rate: Number(taxRate),
      bill_to_customer_id: billToCustomerId || null,
      bill_to_name: billToName.trim(),
      bill_to_kra_pin: billToKraPin.trim()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-96">

        <h2 className="text-xl font-bold mb-2">
          Create Service Estimate
        </h2>

        <p className="text-sm text-slate-500 mb-4">
          Confirm who this estimate should bill — a company, insurer, or
          the customer directly.
        </p>

        <form onSubmit={handleSubmit}>

          <label className="text-sm">Existing Customer</label>
          <select
            value={billToCustomerId}
            onChange={handleBillToCustomerSelect}
            className="w-full border rounded-lg p-2 mb-2"
          >
            <option value="">Type manually / not in system</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label className="text-sm">Bill To Name</label>
          <input
            type="text"
            value={billToName}
            onChange={(e) => setBillToName(e.target.value)}
            placeholder="e.g. Fidelity Insurance"
            className="w-full border rounded-lg p-2 mb-2"
          />

          <label className="text-sm">Bill To KRA Pin</label>
          <input
            type="text"
            value={billToKraPin}
            onChange={(e) => setBillToKraPin(e.target.value)}
            placeholder="e.g. P051234567X"
            className="w-full border rounded-lg p-2 mb-4"
          />

          <label className="block mb-2">
            Tax Rate (%)
          </label>

          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="border w-full p-2 rounded mb-5"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>

            <button
              disabled={!billToName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              Create Estimate
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateEstimateModal;