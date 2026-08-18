// src/pages/spareparts/CreatePurchase.jsx
import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { createPurchase } from "../../api/purchaseApi";
import { useNavigate } from "react-router-dom";

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

const emptyItem = () => ({
  isNew: false,
  sparepart_id: "",
  quantity: 1,
  unit_cost: 0,
  new_part: { name: "", part_number: "", category: "", selling_price: "", discount: "" },
});

const CreatePurchase = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const suppliersRes = await API.get("/suppliers");
      const partsRes = await API.get("/spareparts");

      setSuppliers(suppliersRes.data);
      setSpareParts(partsRes.data.data);
    } catch (error) {
      console.error("Error loading purchase data:", error);
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

  // Dropdown switches a row between "existing part" and "new part" modes.
  const handlePartSelect = (index, value) => {
    const updatedItems = [...items];
    if (value === NEW_PART_VALUE) {
      updatedItems[index].isNew = true;
      updatedItems[index].sparepart_id = "";
    } else {
      updatedItems[index].isNew = false;
      updatedItems[index].sparepart_id = value;
    }
    setItems(updatedItems);
  };

  const addRow = () => {
    setItems([...items, emptyItem()]);
  };

  const removeRow = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.unit_cost,
      0
    );
  };

  const handleSubmit = async () => {
    if (!supplierId) {
      alert("Please select a supplier");
      return;
    }

    // Validate + shape each row into what the backend expects: either
    // { sparepart_id, quantity, unit_cost } or { new_part: {...}, quantity, unit_cost }
    const payloadItems = [];
    for (const item of items) {
      if (item.isNew) {
        if (!item.new_part.name.trim()) {
          alert("Enter a name for every new part");
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
          alert("Select a part for every row, or switch it to '+ Add New Part'");
          return;
        }
        payloadItems.push({
          sparepart_id: item.sparepart_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        });
      }
    }

    try {
      await createPurchase({
        supplier_id: supplierId,
        items: payloadItems,
        expected_delivery_date: expectedDeliveryDate || null,
        notes: notes || null,
      });

      alert("LPO created as draft. Review it, then send it to the supplier.");
      navigate("/admin/spare-parts/purchases");

    } catch (error) {
      console.error("Purchase error:", error);
      alert(error.response?.data?.message || "Failed to create LPO");
    }
  };

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-gray-800">
        Create Local Purchase Order (LPO)
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

                <td className="p-2 min-w-[220px]">
                  {!item.isNew ? (
                    <select
                      value={item.sparepart_id}
                      onChange={(e) => handlePartSelect(index, e.target.value)}
                      className="w-full border p-1 rounded"
                    >
                      <option value="">Select Part</option>
                      <option value={NEW_PART_VALUE}>+ Add New Part</option>
                      {spareParts.map((part) => (
                        <option key={part.id} value={part.id}>
                          {part.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-1 bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-blue-700">New Part</span>
                        <button
                          type="button"
                          onClick={() => handlePartSelect(index, "")}
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
                        placeholder="Selling price"
                        value={item.new_part.selling_price}
                        onChange={(e) => handleNewPartChange(index, "selling_price", e.target.value)}
                        className="w-full border p-1 rounded text-sm"
                      />
                    </div>
                  )}
                </td>

                <td className="p-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", Number(e.target.value))
                    }
                    className="w-full border p-1 rounded"
                  />
                </td>

                <td className="p-2">
                  <input
                    type="number"
                    value={item.unit_cost}
                    onChange={(e) =>
                      handleItemChange(index, "unit_cost", Number(e.target.value))
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

        <div className="text-right mt-4">
          <p className="text-lg font-bold">
            Subtotal: {calculateSubtotal()}
          </p>
        </div>

        <div className="text-right mt-4">
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-6 py-2 rounded"
          >
            Save as Draft LPO
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreatePurchase;