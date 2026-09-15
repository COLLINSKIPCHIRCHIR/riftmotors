import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api/api";
import { getPurchase, getPurchases } from "../../api/purchaseApi";
import { createSupplierInvoice } from "../../api/supplierInvoiceApi";
import toast from "react-hot-toast";

const DEFAULT_TAX_RATE = 16;

// Same search-dropdown pattern as CreatePurchase.jsx, minus the
// "+ Add New Part" option — an invoice can only reference parts that
// already exist (new parts get created at LPO stage, not invoice stage).
const PartSearchInput = ({ spareParts, value, onSelect }) => {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => setQuery(value || ""), [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? spareParts
        .filter((p) => p.name?.toLowerCase().includes(q) || p.part_number?.toLowerCase().includes(q))
        .slice(0, 8)
    : spareParts.slice(0, 8);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search part name or number..."
        className="w-full border p-1 rounded"
      />

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-gray-400">No matching parts</div>
          )}
          {filtered.map((part) => (
            <button
              type="button"
              key={part.id}
              onClick={() => {
                onSelect(part);
                setQuery(part.name);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 flex justify-between gap-2"
            >
              <span>{part.name}</span>
              {part.part_number && (
                <span className="text-gray-400 text-xs shrink-0">{part.part_number}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const emptyItem = () => ({
  purchase_item_id: null,
  sparepart_id: "",
  sparepart_name: "",
  part_number: "",
  quantity: 1,
  unit_cost: 0,
  remaining: null, // only set for lines pulled in from an LPO, informational only
});

export default function RecordInvoice() {
  const { purchaseId } = useParams();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [lockedPurchase, setLockedPurchase] = useState(null);

  const [supplierId, setSupplierId] = useState("");
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(purchaseId || "");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
  const [items, setItems] = useState([emptyItem()]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (purchaseId) loadFromPurchase(purchaseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseId]);

  const fetchBaseData = async () => {
    try {
      const [suppliersRes, partsRes, purchasesRes] = await Promise.all([
        API.get("/suppliers"),
        API.get("/spareparts?limit=10000"),
        getPurchases(),
      ]);
      setSuppliers(suppliersRes.data);
      setSpareParts(partsRes.data.data);
      setPurchases(purchasesRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load suppliers or spare parts");
    } finally {
      if (!purchaseId) setLoading(false);
    }
  };

  // Pulls in every line whose (quantity_received - quantity_invoiced) > 0,
  // pre-filled with that remaining quantity and the LPO's unit_cost —
  // everything still editable so it can be corrected to match the
  // supplier's actual paper invoice.
  const loadFromPurchase = async (id) => {
    try {
      const res = await getPurchase(id);
      const { purchase, items: purchaseItems } = res.data;

      setLockedPurchase(purchase);
      setSupplierId(purchase.supplier_id);
      setSelectedPurchaseId(purchase.id);
      setTaxRate(purchase.tax_rate ?? DEFAULT_TAX_RATE);

      const eligible = purchaseItems
        .filter((it) => Number(it.quantity_received) - Number(it.quantity_invoiced) > 0)
        .map((it) => ({
          purchase_item_id: it.id,
          sparepart_id: it.sparepart_id,
          sparepart_name: it.sparepart_name,
          part_number: it.part_number,
          quantity: Number(it.quantity_received) - Number(it.quantity_invoiced),
          unit_cost: Number(it.unit_cost),
          remaining: Number(it.quantity_received) - Number(it.quantity_invoiced),
        }));

      setItems(eligible.length ? eligible : [emptyItem()]);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Could not load this LPO");
      navigate("/admin/spare-parts/supplier-invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSelectedPurchase = () => {
    if (!selectedPurchaseId) return;
    setLoading(true);
    loadFromPurchase(selectedPurchaseId);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handlePartPicked = (index, part) => {
    const updated = [...items];
    updated[index].sparepart_id = part.id;
    updated[index].sparepart_name = part.name;
    updated[index].part_number = part.part_number;
    updated[index].unit_cost = Number(part.buying_price || 0);
    setItems(updated);
  };

  const addRow = () => setItems([...items, emptyItem()]);

  const removeRow = (index) => {
    if (items.length === 1) {
      toast.error("An invoice needs at least one item");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_cost || 0),
    0
  );
  const taxAmount = subtotal * (Number(taxRate || 0) / 100);
  const total = subtotal + taxAmount;

  const eligiblePurchasesForSupplier = purchases.filter(
    (p) =>
      String(p.supplier_id) === String(supplierId) &&
      ["sent", "partially_received", "received"].includes(p.status)
  );

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }

    const payloadItems = [];
    for (const item of items) {
      if (!item.sparepart_id) {
        toast.error("Search and select a part for every row");
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error("Every item needs a quantity greater than 0");
        return;
      }
      if (item.unit_cost < 0) {
        toast.error("Unit cost can't be negative");
        return;
      }
      payloadItems.push({
        purchase_item_id: item.purchase_item_id || undefined,
        sparepart_id: item.sparepart_id,
        quantity: Number(item.quantity),
        unit_cost: Number(item.unit_cost),
      });
    }

    const payload = {
      supplier_id: supplierId,
      purchase_id: selectedPurchaseId || null,
      supplier_invoice_number: supplierInvoiceNumber || null,
      invoice_date: invoiceDate || null,
      due_date: dueDate || null,
      notes: notes || null,
      tax_rate: Number(taxRate || 0),
      items: payloadItems,
    };

    setSubmitting(true);
    try {
      const res = await createSupplierInvoice(payload);
      if (res.data.warnings?.length) {
        res.data.warnings.forEach((w) => toast(w, { icon: "⚠️", duration: 6000 }));
      }
      toast.success("Invoice recorded.");
      navigate(`/admin/spare-parts/supplier-invoices/${res.data.invoice.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record invoice");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Record Supplier Invoice</h1>

      <div className="bg-white p-6 rounded-xl shadow grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium">Supplier</label>
          <select
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              setSelectedPurchaseId("");
            }}
            disabled={Boolean(lockedPurchase)}
            className="w-full border p-2 rounded disabled:bg-gray-100"
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
          <label className="block mb-2 text-sm font-medium">Supplier's Invoice Number</label>
          <input
            type="text"
            value={supplierInvoiceNumber}
            onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
            placeholder="As printed on their invoice"
            className="w-full border p-2 rounded"
          />
        </div>

        {!lockedPurchase && supplierId && (
          <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded p-3">
            <label className="block mb-2 text-sm font-medium text-blue-800">
              Load items from an LPO (optional)
            </label>
            <div className="flex gap-2">
              <select
                value={selectedPurchaseId}
                onChange={(e) => setSelectedPurchaseId(e.target.value)}
                className="flex-1 border p-2 rounded"
              >
                <option value="">-- No LPO, add items manually --</option>
                {eligiblePurchasesForSupplier.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.lpo_number || `PO-${p.id}`} — {p.status.replace("_", " ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleLoadSelectedPurchase}
                disabled={!selectedPurchaseId}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                Load Items
              </button>
            </div>
          </div>
        )}

        {lockedPurchase && (
          <div className="md:col-span-2 text-sm text-gray-500">
            Against {lockedPurchase.lpo_number || `PO-${lockedPurchase.id}`}
          </div>
        )}

        <div>
          <label className="block mb-2 text-sm font-medium">Invoice Date</label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Due Date (optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Tax / VAT Rate (%)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
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

      <div className="bg-white p-6 rounded-xl shadow">
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100 text-left text-sm">
              <th className="p-2">Spare Part</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Unit Cost</th>
              <th className="p-2">Total</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b align-top">
                <td className="p-2 min-w-[240px]">
                  {item.purchase_item_id ? (
                    <div>
                      <p className="font-medium text-sm">{item.sparepart_name}</p>
                      {item.part_number && <p className="text-xs text-gray-400">{item.part_number}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {item.remaining} received &amp; not yet invoiced
                      </p>
                    </div>
                  ) : (
                    <PartSearchInput
                      spareParts={spareParts}
                      value={item.sparepart_name}
                      onSelect={(part) => handlePartPicked(index, part)}
                    />
                  )}
                </td>

                <td className="p-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                    className="w-full border p-1 rounded"
                  />
                  {item.remaining != null && Number(item.quantity) > item.remaining && (
                    <p className="text-[10px] text-amber-600 mt-1">Exceeds received quantity</p>
                  )}
                </td>

                <td className="p-2">
                  <input
                    type="number"
                    value={item.unit_cost}
                    onChange={(e) => handleItemChange(index, "unit_cost", Number(e.target.value))}
                    className="w-full border p-1 rounded"
                  />
                </td>

                <td className="p-2 font-medium">
                  {(Number(item.quantity) * Number(item.unit_cost)).toFixed(2)}
                </td>

                <td className="p-2">
                  <button onClick={() => removeRow(index)} className="text-red-600 text-sm">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={addRow} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
          + Add Item
        </button>

        <div className="text-right mt-4 space-y-1">
          <p className="text-sm text-gray-600">Subtotal: KES {subtotal.toFixed(2)}</p>
          <p className="text-sm text-gray-600">
            VAT ({Number(taxRate || 0)}%): KES {taxAmount.toFixed(2)}
          </p>
          <p className="text-lg font-bold">Total: KES {total.toFixed(2)}</p>
        </div>

        <div className="text-right mt-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Record Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}