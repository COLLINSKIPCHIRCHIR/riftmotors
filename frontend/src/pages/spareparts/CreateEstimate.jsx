import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

const CreateEstimate = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [spareparts, setSpareparts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [spRes, custRes] = await Promise.all([
          API.get("/spareparts"),
          API.get("/customers"),
        ]);
        setSpareparts(spRes.data);
        setCustomers(custRes.data);
      } catch (err) {
        console.error("❌ Failed to load data", err);
      }
    };
    fetchData();
  }, []);

  const addItem = () => {
    setItems([...items, { sparepart_id: "", quantity: 1, unit_price: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSelectSparepart = (index, sparepartId) => {
    const sparepart = spareparts.find((sp) => sp.id === Number(sparepartId));
    if (!sparepart) return;

    // Prevent duplicate spare parts
    const alreadyExists = items.some(
      (it, i) => it.sparepart_id === sparepart.id && i !== index
    );
    if (alreadyExists) {
      alert("Spare part already added");
      return;
    }

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      sparepart_id: sparepart.id,
      unit_price: Number(sparepart.selling_price),
    };
    setItems(updated);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Subtotal & total calculations
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const total = subtotal - Number(discount || 0);

  const submitEstimate = async () => {
    const validItems = items.filter(
      (item) => item.sparepart_id && item.quantity > 0
    );

    if (!validItems.length) return alert("Add valid spare parts");

    try {
      setLoading(true);

      const selected = customers.find(
        (c) => c.id === Number(selectedCustomer)
      );

      const payload = {
        customer_id: selectedCustomer || null,
        customer_name: selected ? selected.name : "Walk-in Customer",
        customer_phone: selected ? selected.phone : "",
        discount: Number(discount || 0),
        items: validItems.map((item) => ({
          sparepart_id: Number(item.sparepart_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      };

      await API.post("/estimates/create", payload);

      alert("✅ Estimate created");
      navigate("/admin/spare-parts/estimates");
    } catch (err) {
      console.error(err);
      alert("Failed to create estimate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create Estimate</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>

        {/* Customer */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2">
            Customer
          </label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3 text-left">Spare Part</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2 text-center">{index + 1}</td>
                  <td className="p-2">
                    <select
                      value={item.sparepart_id}
                      onChange={(e) =>
                        handleSelectSparepart(index, e.target.value)
                      }
                      className="w-full border rounded p-2"
                    >
                      <option value="">Select spare part</option>
                      {spareparts.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", Number(e.target.value))
                      }
                      className="w-20 border rounded p-1 text-center"
                    />
                  </td>

                  <td className="p-2 text-right">
                    {item.unit_price.toFixed(2)}
                  </td>

                  <td className="p-2 text-right">
                    {(item.quantity * item.unit_price).toFixed(2)}
                  </td>

                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-600"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addItem}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          + Add Item
        </button>

        {/* Totals Card */}
        <div className="mt-6 max-w-sm ml-auto bg-gray-50 p-4 rounded-xl shadow">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <strong>{subtotal.toFixed(2)}</strong>
          </p>

          <div className="flex justify-between items-center mt-2">
            <span>Discount</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-24 border rounded p-1 text-right"
            />
          </div>

          <p className="flex justify-between mt-3 text-lg">
            <span>Total</span>
            <strong>{total.toFixed(2)}</strong>
          </p>
        </div>

        <button
          onClick={submitEstimate}
          disabled={loading}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          {loading ? "Saving..." : "Create Estimate"}
        </button>

      </div>
    </div>
  );
};

export default CreateEstimate;
