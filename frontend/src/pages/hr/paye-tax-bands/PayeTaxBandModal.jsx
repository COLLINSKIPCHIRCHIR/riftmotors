import { useEffect, useState } from "react";

export default function PayeTaxBandModal({
  band,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    effective_from: "",
    effective_to: "",
    band_order: "",
    lower_limit: "",
    upper_limit: "",
    rate_percentage: "",
  });

  // ==========================================
  // Load Existing Record
  // ==========================================

  useEffect(() => {
    if (band) {
      setForm({
        effective_from: band.effective_from
          ? band.effective_from.substring(0, 10)
          : "",
        effective_to: band.effective_to
          ? band.effective_to.substring(0, 10)
          : "",
        band_order: band.band_order || "",
        lower_limit: band.lower_limit ?? "",
        upper_limit: band.upper_limit ?? "",
        rate_percentage: band.rate_percentage ?? "",
      });
    } else {
      setForm({
        effective_from: "",
        effective_to: "",
        band_order: "",
        lower_limit: "",
        upper_limit: "",
        rate_percentage: "",
      });
    }
  }, [band]);

  // ==========================================
  // Handle Change
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // Submit
  // ==========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.effective_from) {
      alert("Effective From is required.");
      return;
    }

    if (!form.band_order) {
      alert("Band Order is required.");
      return;
    }

    if (form.lower_limit === "") {
      alert("Lower Limit is required.");
      return;
    }

    if (form.rate_percentage === "") {
      alert("Tax Rate is required.");
      return;
    }

    if (
      form.upper_limit !== "" &&
      Number(form.upper_limit) <= Number(form.lower_limit)
    ) {
      alert(
        "Upper Limit must be greater than Lower Limit."
      );
      return;
    }

    if (
      form.effective_to &&
      new Date(form.effective_to) <
        new Date(form.effective_from)
    ) {
      alert(
        "Effective To cannot be before Effective From."
      );
      return;
    }

    onSave({
      ...form,
      upper_limit:
        form.upper_limit === ""
          ? null
          : form.upper_limit,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Header */}

        <div className="border-b px-6 py-4 flex justify-between items-center">

          <h2 className="text-xl font-bold">

            {band
              ? "Edit PAYE Tax Band"
              : "New PAYE Tax Band"}

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

          {/* Effective Dates */}

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

              <p className="text-xs text-slate-500 mt-1">
                Leave blank if this is the current tax table.
              </p>

            </div>

          </div>

          {/* Band */}

          <div>

            <label className="block mb-1 font-medium">
              Band Order *
            </label>

            <input
              type="number"
              min="1"
              name="band_order"
              value={form.band_order}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="1"
              required
            />

          </div>

          {/* Limits */}

          <div className="grid md:grid-cols-2 gap-4">

            <div>

              <label className="block mb-1 font-medium">
                Lower Limit *
              </label>

              <input
                type="number"
                step="0.01"
                name="lower_limit"
                value={form.lower_limit}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="0.00"
                required
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
                placeholder="Leave blank for last band"
              />

            </div>

          </div>

          {/* Rate */}

          <div>

            <label className="block mb-1 font-medium">
              Tax Rate (%) *
            </label>

            <input
              type="number"
              step="0.01"
              name="rate_percentage"
              value={form.rate_percentage}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="30"
              required
            />

          </div>

          {/* Preview */}

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">

            <h3 className="font-semibold text-blue-800 mb-4">
              Tax Band Preview
            </h3>

            <div className="grid md:grid-cols-2 gap-4">

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Band
                </p>

                <p className="font-semibold">
                  {form.band_order || "-"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Tax Rate
                </p>

                <p className="font-semibold">
                  {form.rate_percentage
                    ? `${form.rate_percentage}%`
                    : "-"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Income Range
                </p>

                <p className="font-semibold">

                  {form.lower_limit || "0"}

                  {" - "}

                  {form.upper_limit || "Above"}

                </p>

              </div>

              <div>

                <p className="text-xs uppercase text-slate-500">
                  Effective
                </p>

                <p className="font-semibold">

                  {form.effective_from || "-"}

                  {form.effective_to
                    ? ` → ${form.effective_to}`
                    : " → Current"}

                </p>

              </div>

            </div>

          </div>

          {/* Information */}

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">

            <h4 className="font-semibold text-amber-800 mb-2">
              PAYE Configuration Notes
            </h4>

            <ul className="list-disc ml-5 text-sm text-amber-700 space-y-1">

              <li>
                Tax bands should be entered in ascending order.
              </li>

              <li>
                The last band should have no Upper Limit.
              </li>

              <li>
                Create a new effective period whenever KRA publishes new PAYE rates.
              </li>

              <li>
                Historical payroll calculations will use the tax bands effective for that payroll period.
              </li>

            </ul>

          </div>

          {/* Footer */}

          <div className="border-t pt-4 flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="border rounded-lg px-5 py-2 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2"
            >
              {band
                ? "Update Tax Band"
                : "Save Tax Band"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}