import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../api/api";
import { getOutstandingInvoices } from "../../api/supplierInvoiceApi";
import { createSupplierPayment } from "../../api/supplierPaymentApi";
import toast from "react-hot-toast";

export default function PaySupplier() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSupplierId = searchParams.get("supplier_id") || "";

  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState(preselectedSupplierId);
  const [invoices, setInvoices] = useState([]);
  const [allocations, setAllocations] = useState({}); // { [invoiceId]: amount }
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    API.get("/suppliers")
      .then((res) => setSuppliers(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (supplierId) loadOutstanding(supplierId);
    else {
      setInvoices([]);
      setAllocations({});
    }
  }, [supplierId]);

  const loadOutstanding = async (id) => {
    try {
      const res = await getOutstandingInvoices(id);
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load outstanding invoices for this supplier");
    }
  };

  const handleAllocationChange = (invoiceId, value, balance) => {
    const num = Math.max(0, Math.min(Number(value) || 0, balance));
    setAllocations({ ...allocations, [invoiceId]: num });
  };

  // Convenience button: spreads the entered amount across invoices in the
  // order they're listed (oldest first, since that's how the backend
  // returns them) — still fully editable afterward.
  const handleFillOldestFirst = () => {
    let remaining = Number(amount) || 0;
    const filled = {};
    for (const inv of invoices) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, Number(inv.balance));
      filled[inv.id] = take;
      remaining -= take;
    }
    setAllocations(filled);
  };

  const allocatedTotal = Object.values(allocations).reduce((sum, v) => sum + Number(v || 0), 0);

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error("Select a supplier");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a payment amount");
      return;
    }

    const allocationPayload = Object.entries(allocations)
      .filter(([, v]) => Number(v) > 0)
      .map(([invoice_id, amount_allocated]) => ({
        invoice_id: Number(invoice_id),
        amount_allocated: Number(amount_allocated),
      }));

    if (allocationPayload.length === 0) {
      toast.error("Allocate the payment to at least one invoice");
      return;
    }
    if (Math.abs(allocatedTotal - Number(amount)) > 0.01) {
      toast.error(
        `Allocations (KES ${allocatedTotal.toFixed(2)}) must add up to the payment amount (KES ${Number(
          amount
        ).toFixed(2)})`
      );
      return;
    }

    setSubmitting(true);
    try {
      await createSupplierPayment({
        supplier_id: supplierId,
        amount: Number(amount),
        allocations: allocationPayload,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
      });
      toast.success("Payment recorded.");
      navigate("/admin/spare-parts/supplier-payments");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Pay Supplier</h1>

      <div className="bg-white p-6 rounded-xl shadow grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium">Supplier</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Select Supplier --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Amount Paid</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Payment Date</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Reference Number</label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Transaction / cheque number"
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-medium">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border p-2 rounded"
            rows={2}
          />
        </div>
      </div>

      {supplierId && (
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Outstanding Invoices</h2>
            <button
              onClick={handleFillOldestFirst}
              disabled={!amount}
              className="text-blue-600 text-sm underline disabled:opacity-50"
            >
              Auto-allocate (oldest first)
            </button>
          </div>

          {invoices.length === 0 ? (
            <p className="text-gray-400 text-sm">No outstanding invoices for this supplier.</p>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border text-left">Invoice No.</th>
                  <th className="p-2 border text-left">Date</th>
                  <th className="p-2 border text-right">Total</th>
                  <th className="p-2 border text-right">Balance</th>
                  <th className="p-2 border text-right">Allocate</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="border p-2">{inv.invoice_number}</td>
                    <td className="border p-2">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                    <td className="border p-2 text-right">{Number(inv.total).toFixed(2)}</td>
                    <td className="border p-2 text-right">{Number(inv.balance).toFixed(2)}</td>
                    <td className="border p-2 text-right">
                      <input
                        type="number"
                        min={0}
                        max={inv.balance}
                        value={allocations[inv.id] ?? ""}
                        onChange={(e) => handleAllocationChange(inv.id, e.target.value, inv.balance)}
                        className="w-24 border p-1 rounded text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="text-right mt-4 text-sm">
            <p>
              Allocated: KES {allocatedTotal.toFixed(2)} / Payment: KES {Number(amount || 0).toFixed(2)}
            </p>
          </div>

          <div className="text-right mt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}