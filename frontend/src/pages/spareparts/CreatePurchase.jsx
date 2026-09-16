// src/pages/spareparts/CreatePurchase.jsx
import React, { useEffect, useState, useRef } from "react";
import API from "../../api/api";
import { createPurchase, updatePurchase, getPurchase } from "../../api/purchaseApi";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

// Same list used in AddSparePart.jsx — kept in sync manually since it's
// not backed by a lookup table.
const CATEGORIES = [
  "Engine",
  "Suspension",
  "Brakes",
  "Electrical",
  "Body",
  "Transmission",
  "Exhaust",
  "Other",
];

const NEW_PART_VALUE = "__new__";
const DEFAULT_TAX_RATE = 16;

const emptyItem = () => ({
  isNew: false,
  sparepart_id: "",
  quantity: 1,
  unit_cost: 0,
  new_part: { name: "", part_number: "", category: "", selling_price: "", discount: "" },
});

// Searchable replacement for the old plain <select> of existing parts.
// Filters spareParts by name or part number as you type, shows up to 8
// matches, and always offers "+ Add New Part" at the top of the list so
// it's still one click away. Closes on selection or on outside click.
const PartSearchInput = ({ spareParts, value, onSelectExisting, onSelectNew }) => {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? spareParts
        .filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.part_number?.toLowerCase().includes(q)
        )
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
          <button
            type="button"
            onClick={() => {
              onSelectNew();
              setOpen(false);
            }}
            className="w-full text-left px-2 py-1.5 text-sm text-blue-700 hover:bg-blue-50 border-b"
          >
            + Add New Part
          </button>

          {filtered.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-gray-400">No matching parts</div>
          )}

          {filtered.map((part) => (
            <button
              type="button"
              key={part.id}
              onClick={() => {
                onSelectExisting(part);
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

const CreatePurchase = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // present only on the edit route
  const isEditMode = Boolean(id);

  const [suppliers, setSuppliers] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
  const [items, setItems] = useState([emptyItem()]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isEditMode) loadExistingPurchase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      const suppliersRes = await API.get("/suppliers");
      const partsRes = await API.get("/spareparts?limit=10000");

      setSuppliers(suppliersRes.data);
      setSpareParts(partsRes.data.data);
    } catch (error) {
      console.error("Error loading purchase data:", error);
      toast.error("Could not load suppliers or spare parts. Refresh and try again.");
    }
  };

  const loadExistingPurchase = async () => {
    try {
      const res = await getPurchase(id);
      const { purchase, items: existingItems } = res.data;

      if (purchase.status !== "draft") {
        toast.error("Only draft LPOs can be edited.");
        navigate(`/admin/spare-parts/purchases/${id}`);
        return;
      }

      setSupplierId(purchase.supplier_id || "");
      setExpectedDeliveryDate(
        purchase.expected_delivery_date
          ? purchase.expected_delivery_date.slice(0, 10)
          : ""
      );
      setNotes(purchase.notes || "");
      setTaxRate(purchase.tax_rate ?? DEFAULT_TAX_RATE);
      setItems(
        existingItems.map((it) => ({
          isNew: false,
          sparepart_id: it.sparepart_id,
          sparepart_name: it.sparepart_name, // used to prefill the search box
          quantity: Number(it.quantity), 
          unit_cost: Number(it.unit_cost),
          new_part: { name: "", part_number: "", category: "", selling_price: "", discount: "" },
        }))
      );
    } catch (error) {
      console.error("Error loading LPO:", error);
      toast.error(error.response?.data?.message || "Could not load this LPO");
      navigate("/admin/spare-parts/purchases");
    } finally {
      setLoading(false);
    }
  };

  // Top-level fields on a row: sparepart_id, quantity, unit_cost
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  // Fields nested under new_part: name, part_number, category, selling_price, discount
  const handleNewPartChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index].new_part[field] = value;
    setItems(updatedItems);
  };

  // Row selected an existing part from the search dropdown.
  const handlePartPicked = (index, part) => {
    const updatedItems = [...items];
    updatedItems[index].isNew = false;
    updatedItems[index].sparepart_id = part.id;
    updatedItems[index].sparepart_name = part.name;
    updatedItems[index].unit_cost = Number(part.buying_price || 0);
    setItems(updatedItems);
  };

  // Row switched to "new part" mode, from the dropdown's "+ Add New Part" option.
  const handleSwitchToNewPart = (index) => {
    const updatedItems = [...items];
    updatedItems[index].isNew = true;
    updatedItems[index].sparepart_id = "";
    updatedItems[index].sparepart_name = "";
    setItems(updatedItems);
  };

  // Row switched back from "new part" mode to searching existing parts.
  const handleSwitchToExisting = (index) => {
    const updatedItems = [...items];
    updatedItems[index].isNew = false;
    updatedItems[index].sparepart_id = "";
    updatedItems[index].sparepart_name = "";
    setItems(updatedItems);
  };

  const addRow = () => {
    setItems([...items, emptyItem()]);
  };

  const removeRow = (index) => {
    if (items.length === 1) {
      toast.error("An LPO needs at least one item");
      return;
    }
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const calculateSubtotal = () =>
    items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

  const subtotal = calculateSubtotal();
  const taxAmount = subtotal * (Number(taxRate || 0) / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }

    // Validate + shape each row into what the backend expects: either
    // { sparepart_id, quantity, unit_cost } or { new_part: {...}, quantity, unit_cost }
    const payloadItems = [];
    for (const item of items) {
      if (item.quantity <= 0) {
        toast.error("Every item needs a quantity greater than 0");
        return;
      }
      if (item.unit_cost < 0) {
        toast.error("Unit cost can't be negative");
        return;
      }

      if (item.isNew) {
        if (!item.new_part.name.trim()) {
          toast.error("Enter a name for every new part");
          return;
        }
        payloadItems.push({
          new_part: {
            name: item.new_part.name,
            part_number: item.new_part.part_number || null,
            category: item.new_part.category || null,
            selling_price: item.new_part.selling_price ? Number(item.new_part.selling_price) : 0,
            discount: item.new_part.discount ? Number(item.new_part.discount) : 0,
          },
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        });
      } else {
        if (!item.sparepart_id) {
          toast.error("Search and select a part for every row, or switch it to '+ Add New Part'");
          return;
        }
        payloadItems.push({
          sparepart_id: item.sparepart_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        });
      }
    }

    const payload = {
      supplier_id: supplierId,
      items: payloadItems,
      expected_delivery_date: expectedDeliveryDate || null,
      notes: notes || null,
      tax_rate: Number(taxRate || 0),
    };

    setSubmitting(true);
    try {
      if (isEditMode) {
        await updatePurchase(id, payload);
        toast.success("LPO updated.");
        navigate(`/admin/spare-parts/purchases/${id}`);
      } else {
        await createPurchase(payload);
        toast.success("LPO created as draft. Review it, then send it to the supplier.");
        navigate("/admin/spare-parts/purchases");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error(
        error.response?.data?.message ||
          (isEditMode ? "Failed to update LPO" : "Failed to create LPO")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading LPO...</div>;
  }

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-gray-800">
        {isEditMode ? "Edit Local Purchase Order (LPO)" : "Create Local Purchase Order (LPO)"}
      </h1>

      {/* Supplier + delivery details */}
      <div className="bg-white p-6 rounded-xl shadow grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium">
            Select Supplier
          </label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Select Supplier --</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">
            Expected Delivery Date (optional)
          </label>
          <input
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">
            Tax / VAT Rate (%)
          </label>
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
          <label className="block mb-2 text-sm font-medium">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border p-2 rounded"
            rows={2}
            placeholder="Any special instructions for the supplier"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white p-6 rounded-xl shadow">

        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100 text-left text-sm">
              <th className="p-2">Spare Part</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Unit Cost</th>
              <th className="p-2">Total</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b align-top">

                <td className="p-2 min-w-[240px]">
                  {!item.isNew ? (
                    <PartSearchInput
                      spareParts={spareParts}
                      value={item.sparepart_name}
                      onSelectExisting={(part) => handlePartPicked(index, part)}
                      onSelectNew={() => handleSwitchToNewPart(index)}
                    />
                  ) : (
                    <div className="space-y-1 bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-blue-700">New Part</span>
                        <button
                          type="button"
                          onClick={() => handleSwitchToExisting(index)}
                          className="text-xs text-gray-500 underline"
                        >
                          Use existing part
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Part name *"
                        value={item.new_part.name}
                        onChange={(e) => handleNewPartChange(index, "name", e.target.value)}
                        className="w-full border p-1 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Part number"
                        value={item.new_part.part_number}
                        onChange={(e) => handleNewPartChange(index, "part_number", e.target.value)}
                        className="w-full border p-1 rounded text-sm"
                      />
                      <select
                        value={item.new_part.category}
                        onChange={(e) => handleNewPartChange(index, "category", e.target.value)}
                        className="w-full border p-1 rounded text-sm"
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Selling price"
                        value={item.new_part.selling_price}
                        onChange={(e) =>
                          handleNewPartChange(index, "selling_price", e.target.value)
                        }
                        className="w-full border p-1 rounded text-sm"
                      />
                    </div>
                  )}
                </td>

                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    className="w-full border p-1 rounded"
                  />
                </td>

                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_cost}
                    onChange={(e) =>
                      handleItemChange(index, "unit_cost", e.target.value)
                    }
                    className="w-full border p-1 rounded"
                  />
                  {item.isNew && (
                    <p className="text-[10px] text-gray-400 mt-1">Used as this part's buying price</p>
                  )}
                </td>

                <td className="p-2 font-medium">
                  {item.quantity * item.unit_cost}
                </td>

                <td className="p-2">
                  <button
                    onClick={() => removeRow(index)}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addRow}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          + Add Item
        </button>

        <div className="text-right mt-4 space-y-1">
          <p className="text-sm text-gray-600">
            Subtotal: KES {subtotal.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">
            VAT ({Number(taxRate || 0)}%): KES {taxAmount.toFixed(2)}
          </p>
          <p className="text-lg font-bold">
            Total: KES {total.toFixed(2)}
          </p>
        </div>

        <div className="text-right mt-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : isEditMode
              ? "Save Changes"
              : "Save as Draft LPO"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreatePurchase;