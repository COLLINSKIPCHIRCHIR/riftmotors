import { useEffect, useState } from "react";

import {
  getDeductionTypes,
} from "../../../api/hrApi";

export default function DeductionRateVersionModal({
  rateVersion,
  onClose,
  onSave,
}) {
  const [deductionTypes, setDeductionTypes] = useState([]);

  const [form, setForm] = useState({
    deduction_type_id: "",
    tier_label: "",
    effective_from: "",
    effective_to: "",
    rate_percentage: "",
    fixed_amount: "",
    minimum_amount: "",
    maximum_amount: "",
    lower_limit: "",
    upper_limit: "",
    notes: "",
  });

  const [selectedType, setSelectedType] = useState(null);

  // =======================================
  // Load Deduction Types
  // =======================================

  useEffect(() => {
    loadDeductionTypes();
  }, []);

  const loadDeductionTypes = async () => {
    try {
      const res = await getDeductionTypes();
      setDeductionTypes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // =======================================
  // Load Existing Record
  // =======================================

  useEffect(() => {
    if (rateVersion) {
      setForm({
        deduction_type_id: rateVersion.deduction_type_id || "",
        tier_label: rateVersion.tier_label || "",
        effective_from: rateVersion.effective_from
          ? rateVersion.effective_from.substring(0, 10)
          : "",
        effective_to: rateVersion.effective_to
          ? rateVersion.effective_to.substring(0, 10)
          : "",
        rate_percentage: rateVersion.rate_percentage || "",
        fixed_amount: rateVersion.fixed_amount || "",
        minimum_amount: rateVersion.minimum_amount || "",
        maximum_amount: rateVersion.maximum_amount || "",
        lower_limit: rateVersion.lower_limit || "",
        upper_limit: rateVersion.upper_limit || "",
        notes: rateVersion.notes || "",
      });
    }
  }, [rateVersion]);

  // =======================================
  // Detect Calculation Method
  // =======================================

  useEffect(() => {
    const found = deductionTypes.find(
      (d) => Number(d.id) === Number(form.deduction_type_id)
    );

    setSelectedType(found || null);
  }, [form.deduction_type_id, deductionTypes]);

  // =======================================
  // Handle Change
  // =======================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =======================================
  // Submit
  // =======================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.deduction_type_id) {
      alert("Please select a deduction type.");
      return;
    }

    if (!form.effective_from) {
      alert("Effective From is required.");
      return;
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col">

        {/* Header */}

        <div className="border-b px-6 py-4 flex justify-between items-center">

          <h2 className="text-xl font-bold">

            {rateVersion
              ? "Edit Deduction Rate Version"
              : "New Deduction Rate Version"}

          </h2>

          <button
            onClick={onClose}
            className="text-2xl hover:text-red-600"
          >
            ×
          </button>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >

          {/* Deduction Type */}

          <div>

            <label className="block mb-1 font-medium">
              Deduction Type *
            </label>

            <select
              name="deduction_type_id"
              value={form.deduction_type_id}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">
                Select Deduction Type
              </option>

              {deductionTypes.map((item) => (

                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.code} - {item.name}
                </option>

              ))}

            </select>

          </div>

          {/* Tier */}

          <div>

            <label className="block mb-1 font-medium">
              Tier / Band
            </label>

            <input
              type="text"
              name="tier_label"
              value={form.tier_label}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Tier I, Band 1, General..."
            />

          </div>

          {/* Dates */}

          <div className="grid md:grid-cols-2 gap-4">

            <div>

              <label className="block mb-1 font-medium">
                Effective From *
              </label>

              <input
                type="date"
                name="effective_from"
                value={form.effective_from}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />

            </div>

            <div>

              <label className="block mb-1 font-medium">
                Effective To
              </label>

              <input
                type="date"
                name="effective_to"
                value={form.effective_to}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

          </div>

          {/* Percentage */}

          {(selectedType?.calculation_method === "Percentage" ||
            selectedType?.calculation_method === "Progressive Rate" ||
            selectedType?.calculation_method === "Formula") && (

            <div>
              <label className="block mb-1 font-medium">
                Rate Percentage
              </label>
              <input
                type="number"
                step="0.001"
                name="rate_percentage"
                value={form.rate_percentage}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          )}

          {/* Fixed Amount */}

          {(selectedType?.calculation_method === "Fixed Amount" ||
            selectedType?.calculation_method === "Manual") && (

            <div>

              <label className="block mb-1 font-medium">
                Fixed Amount
              </label>

              <input
                type="number"
                step="0.01"
                name="fixed_amount"
                value={form.fixed_amount}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

          )}

          {/* Income Range */}

          <div className="grid md:grid-cols-2 gap-4">

            <div>

              <label className="block mb-1 font-medium">
                Lower Limit
              </label>

              <input
                type="number"
                step="0.01"
                name="lower_limit"
                value={form.lower_limit}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

            <div>

              <label className="block mb-1 font-medium">
                Upper Limit
              </label>

              <input
                type="number"
                step="0.01"
                name="upper_limit"
                value={form.upper_limit}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

          </div>

          {/* Minimum & Maximum */}

          <div className="grid md:grid-cols-2 gap-4">

            <div>

              <label className="block mb-1 font-medium">
                Minimum Amount
              </label>

              <input
                type="number"
                step="0.01"
                name="minimum_amount"
                value={form.minimum_amount}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

            <div>

              <label className="block mb-1 font-medium">
                Maximum Amount
              </label>

              <input
                type="number"
                step="0.01"
                name="maximum_amount"
                value={form.maximum_amount}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />

            </div>

          </div>

          {/* Notes */}

          <div>

            <label className="block mb-1 font-medium">
              Notes
            </label>

            <textarea
              rows={4}
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 resize-none"
              placeholder="Finance Act, Gazette Notice, policy changes..."
            />

          </div>

          {/* Summary */}

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">

            <h3 className="font-semibold text-blue-800 mb-3">
              Rate Summary
            </h3>

            <div className="grid md:grid-cols-2 gap-4 text-sm">

              <div>

                <p className="text-slate-500">Deduction</p>

                <p className="font-semibold">
                  {selectedType?.name || "-"}
                </p>

              </div>

              <div>

                <p className="text-slate-500">
                  Calculation Method
                </p>

                <p className="font-semibold">
                  {selectedType?.calculation_method || "-"}
                </p>

              </div>

              <div>

                <p className="text-slate-500">
                  Effective From
                </p>

                <p className="font-semibold">
                  {form.effective_from || "-"}
                </p>

              </div>

              <div>

                <p className="text-slate-500">
                  Effective To
                </p>

                <p className="font-semibold">
                  {form.effective_to || "Current"}
                </p>

              </div>

            </div>

          </div>

          {/* Footer */}

          <div className="border-t pt-4 flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="border px-5 py-2 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              {rateVersion ? "Update Version" : "Save Version"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}