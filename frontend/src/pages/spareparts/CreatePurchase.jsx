// src/pages/spareparts/CreatePurchase.jsx
import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";

const CreatePurchase = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([
    { sparepart_id: "", quantity: 1, unit_cost: 0 }
  ]);

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

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const addRow = () => {
    setItems([...items, { sparepart_id: "", quantity: 1, unit_cost: 0 }]);
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
    try {
      await API.post("/purchases", {
        supplier_id: supplierId,
        items
      });

      alert("Purchase recorded successfully!");
      navigate("/admin/spare-parts/purchases");

    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to record purchase");
    }
  };

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-gray-800">
        Create Purchase
      </h1>

      {/* Supplier Selection */}
      <div className="bg-white p-6 rounded-xl shadow">
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
              <tr key={index} className="border-b">

                <td className="p-2">
                  <select
                    value={item.sparepart_id}
                    onChange={(e) =>
                      handleItemChange(index, "sparepart_id", e.target.value)
                    }
                    className="w-full border p-1 rounded"
                  >
                    <option value="">Select Part</option>
                    {spareParts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.name}
                      </option>
                    ))}
                  </select>
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
            Submit Purchase
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreatePurchase;
