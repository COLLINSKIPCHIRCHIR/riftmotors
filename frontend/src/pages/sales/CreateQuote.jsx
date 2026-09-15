import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

const CreateQuote = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [vatManuallyEdited, setVatManuallyEdited] = useState(false);

  const [form, setForm] = useState({
    vehicle_id: searchParams.get("vehicle_id") || "",
    customer_id: "",
    quoted_price: "",
    trade_in_reg_no: "",
    trade_in_amount: "",
    vat_amount: "",
    registration_fee: "",
    valid_until: "",
    quote_ref: "", // optional — leave blank to auto-generate
  });

  const [items, setItems] = useState([]); // [{ item_name, price, quantity }]

  useEffect(() => {
    API.get("/vehicles").then((res) => {
      const available = res.data.filter((v) => v.status === "available");
      setVehicles(available);

      const preselectedId = searchParams.get("vehicle_id");
      if (preselectedId) {
        const v = available.find((veh) => String(veh.id) === String(preselectedId));
        if (v) setForm((prev) => ({ ...prev, quoted_price: v.selling_price }));
      }
    });
    API.get("/customers").then((res) => setCustomers(res.data));
  }, [searchParams]);

  const selectedVehicle = vehicles.find((v) => String(v.id) === String(form.vehicle_id));
  const isNewVehicle = selectedVehicle?.condition === "new";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "vat_amount") setVatManuallyEdited(true);
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleVehicleSelect = (e) => {
    const id = e.target.value;
    const v = vehicles.find((veh) => String(veh.id) === String(id));
    setForm((prev) => ({ ...prev, vehicle_id: id, quoted_price: v ? v.selling_price : "" }));
  };

  const addItem = () => {
    setItems([...items, { item_name: "", price: "", quantity: 1 }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const itemsTotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0
  );

  // Auto-calculate VAT at 16% of (price + accessories), unless staff has
  // manually typed into the VAT field — see handleChange's vatManuallyEdited flip.
  useEffect(() => {
    if (vatManuallyEdited) return;
    const base = (Number(form.quoted_price) || 0) + itemsTotal;
    const autoVat = base > 0 ? Math.round(base * 0.16) : "";
    setForm((prev) => ({ ...prev, vat_amount: autoVat }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.quoted_price, itemsTotal, vatManuallyEdited]);

  const resetVatToAuto = () => setVatManuallyEdited(false);

  const grandTotal =
    (Number(form.quoted_price) || 0)
    - (Number(form.trade_in_amount) || 0)
    + itemsTotal
    + (Number(form.vat_amount) || 0)
    + (Number(form.registration_fee) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.customer_id || !form.quoted_price) {
      toast.error("Vehicle, customer, and price are required.");
      return;
    }
    const cleanItems = items.filter((it) => it.item_name && it.price);

    setSaving(true);
    try {
      const res = await API.post("/sales-quotes", { ...form, items: cleanItems });
      toast.success(`✅ Quote ${res.data.quote.quote_ref} created`);
      navigate(`/admin/sales/quotes/${res.data.quote.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Error creating quote");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">📋 Create Proforma / Quote</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
            <select name="vehicle_id" value={form.vehicle_id} onChange={handleVehicleSelect}
              className="border border-gray-300 rounded-md p-2 w-full" required>
              <option value="">Select Vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.year}) — {v.chassis_no || "no chassis"} — Ksh {Number(v.selling_price).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {selectedVehicle && (
            <div className="bg-gray-50 border rounded-md p-3 text-sm text-gray-600">
              <p><strong>Condition:</strong> {selectedVehicle.condition}</p>
              <p><strong>Color:</strong> {selectedVehicle.color || "—"}</p>
              {isNewVehicle ? (
                <p><strong>Engine:</strong> {selectedVehicle.engine_rating || "—"}</p>
              ) : (
                <p><strong>Mileage:</strong> {selectedVehicle.mileage ?? "—"} km</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select name="customer_id" value={form.customer_id} onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 w-full" required>
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `— ${c.phone}` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quote Ref <span className="text-gray-400 font-normal">(optional — leave blank to auto-generate)</span>
            </label>
            <input name="quote_ref" placeholder="e.g. RML/Q/1200" value={form.quote_ref}
              onChange={handleChange} className="border border-gray-300 rounded-md p-2 w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isNewVehicle ? "List Price" : "Quoted Price"} (KES)
              </label>
              <input name="quoted_price" type="number" value={form.quoted_price}
                onChange={handleChange} className="border border-gray-300 rounded-md p-2 w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input name="valid_until" type="date" value={form.valid_until}
                onChange={handleChange} className="border border-gray-300 rounded-md p-2 w-full" />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Charges</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500">
                    VAT (KES) {!vatManuallyEdited && <span className="text-blue-500">· auto 16%</span>}
                  </label>
                  {vatManuallyEdited && (
                    <button type="button" onClick={resetVatToAuto}
                      className="text-xs text-blue-600 hover:underline">
                      Reset to auto
                    </button>
                  )}
                </div>
                <input name="vat_amount" type="number" placeholder="VAT (KES)"
                  value={form.vat_amount} onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 w-full" />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Registration Fee (KES)</label>
                <input name="registration_fee" type="number" placeholder="Registration Fee (KES)"
                  value={form.registration_fee} onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 w-full" />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Trade-In <span className="text-gray-400 font-normal">(optional — customer's old car offered as partial payment)</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <input name="trade_in_reg_no" placeholder="Trade-in Reg No." value={form.trade_in_reg_no}
                onChange={handleChange} className="border border-gray-300 rounded-md p-2" />
              <input name="trade_in_amount" type="number" placeholder="Trade-in Deduction (KES)"
                value={form.trade_in_amount} onChange={handleChange}
                className="border border-gray-300 rounded-md p-2" />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">
                Accessories / Add-ons <span className="text-gray-400 font-normal">(bull bar, speed governor, repainting, etc.)</span>
              </p>
              <button type="button" onClick={addItem}
                className="text-blue-600 text-sm hover:underline">
                + Add item
              </button>
            </div>

            {items.length === 0 && (
              <p className="text-xs text-gray-400">No accessories added.</p>
            )}

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <input placeholder="Item (e.g. Speed Governor)" value={item.item_name}
                  onChange={(e) => updateItem(index, "item_name", e.target.value)}
                  className="col-span-5 border border-gray-300 rounded-md p-2 text-sm" />
                <input type="number" placeholder="Price" value={item.price}
                  onChange={(e) => updateItem(index, "price", e.target.value)}
                  className="col-span-3 border border-gray-300 rounded-md p-2 text-sm" />
                <input type="number" placeholder="Qty" min="1" value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  className="col-span-2 border border-gray-300 rounded-md p-2 text-sm" />
                <button type="button" onClick={() => removeItem(index)}
                  className="col-span-2 text-red-600 text-sm hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </div>

          {form.quoted_price && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle price</span>
                <span>Ksh {Number(form.quoted_price).toLocaleString()}</span>
              </div>
              {form.trade_in_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Less: Trade-in</span>
                  <span>-Ksh {Number(form.trade_in_amount).toLocaleString()}</span>
                </div>
              )}
              {itemsTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Accessories</span>
                  <span>+Ksh {itemsTotal.toLocaleString()}</span>
                </div>
              )}
              {form.vat_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    VAT {!vatManuallyEdited && <span className="text-blue-500 text-xs">(auto)</span>}
                  </span>
                  <span>+Ksh {Number(form.vat_amount).toLocaleString()}</span>
                </div>
              )}
              {form.registration_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration</span>
                  <span>+Ksh {Number(form.registration_fee).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-blue-700 border-t pt-1">
                <span>Total Payable</span>
                <span>Ksh {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md disabled:opacity-50">
            {saving ? "Saving..." : "Create Quote"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateQuote;