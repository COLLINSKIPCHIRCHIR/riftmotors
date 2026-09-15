import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

const CreateDeliveryNote = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get("invoice_id");

  const [invoice, setInvoice] = useState(null);
  const [form, setForm] = useState({
    delivered_by: "",
    received_by: "",
    mileage_on_delivery: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (invoiceId) API.get(`/sales-invoices/${invoiceId}`).then((res) => setInvoice(res.data));
  }, [invoiceId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.post("/delivery-notes", { invoice_id: invoiceId, ...form });
      toast.success("✅ Delivery note created");
      navigate(`/admin/sales/delivery-notes/${res.data.note.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Error creating delivery note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">🚚 Create Delivery Note</h2>

        {invoice && (
          <div className="bg-gray-50 border rounded-md p-3 text-sm text-gray-600 mb-4">
            <p><strong>Invoice:</strong> {invoice.invoice_no}</p>
            <p><strong>Vehicle:</strong> {invoice.make} {invoice.model} — {invoice.chassis_no}</p>
            <p><strong>Customer:</strong> {invoice.customer_name}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="delivered_by" placeholder="Delivered By" value={form.delivered_by}
              onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
            <input name="received_by" placeholder="Received By" value={form.received_by}
              onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
          </div>
          <input name="mileage_on_delivery" type="number" placeholder="Mileage on Delivery (km)"
            value={form.mileage_on_delivery} onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 w-full" />
          <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange}
            rows={3} className="border border-gray-300 rounded-md p-2 w-full" />

          <p className="text-xs text-gray-400">
            Standard accessory checklist (jack, spare wheel, fire extinguisher, etc.) will be attached automatically — you can tick items off on the next screen.
          </p>

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Create Delivery Note"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateDeliveryNote;