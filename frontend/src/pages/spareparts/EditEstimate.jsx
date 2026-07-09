import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";

const EditEstimate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [spareparts, setSpareparts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [taxRate, setTaxRate] = useState(16);

  /* ===============================
     SAFE NUMBER CONVERTER
  =============================== */
  const num = (v) => Number(v) || 0;

  /* ===============================
     FETCH DATA
  =============================== */
useEffect(() => {
  const fetchData = async () => {
    try {
      const [spRes, custRes, estRes] = await Promise.all([
        API.get("/spareparts"),
        API.get("/customers"),
        API.get(`/estimates/${id}`),
      ]);

      // ✅ SAFE spareparts extraction
      const sparepartsData =
        spRes.data?.data ||
        spRes.data?.spareparts ||
        spRes.data ||
        [];

      setSpareparts(Array.isArray(sparepartsData) ? sparepartsData : []);

      // ✅ SAFE customers extraction
      const customersData =
        custRes.data?.data ||
        custRes.data?.customers ||
        custRes.data ||
        [];

      setCustomers(Array.isArray(customersData) ? customersData : []);

      const est = estRes.data;

      if (est.status !== "pending") {
        alert("Only pending estimates can be edited");
        navigate(-1);
        return;
      }

      setSelectedCustomer(est.customer_id || "");
      setDiscount(num(est.discount));

      setTaxRate(num(est.tax_rate));


      setItems(
        (est.items || []).map((item) => ({
          sparepart_id: num(item.sparepart_id),
          quantity: num(item.quantity),
          unit_price: num(item.unit_price),
        }))
      );

    } catch (err) {
      console.error(err);
      alert("Failed to load estimate");
    }
  };

  fetchData();
}, [id, navigate]);


  /* ===============================
     ITEM UPDATE
  =============================== */
 const handleItemChange = (index, field, value) => {
  const updated = [...items];

  const currentItem = updated[index];

  if (field === "sparepart_id") {
    const part = spareparts.find(
      (sp) => sp.id === Number(value)
    );

    updated[index].sparepart_id = num(value);
    updated[index].unit_price = num(part?.selling_price);
  }

  if (field === "quantity") {
    const part = spareparts.find(
      (sp) => sp.id === currentItem.sparepart_id
    );

    const stock = num(part?.quantity);

    if (num(value) > stock) {
      alert(`❌ Only ${stock} items available in stock`);
      return;
    }

    updated[index].quantity = num(value);
  }

  if (field === "unit_price") {
    updated[index].unit_price = num(value);
  }

  setItems(updated);
};

  const addItem = () => {
    setItems([
      ...items,
      { sparepart_id: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  /* ===============================
     TOTALS (ALWAYS SAFE)
  =============================== */
  const subtotal = items.reduce(
    (sum, item) =>
      sum + num(item.quantity) * num(item.unit_price),
    0
  );

  const taxAmount =
  subtotal * (num(taxRate) / 100);


  const total =
    subtotal 
    + taxAmount
    - num(discount);

  /* ===============================
     SUBMIT
  =============================== */
  const submitUpdate = async () => {
    try {
      setLoading(true);

      await API.put(`/estimates/${id}`, {

        customer_id: selectedCustomer || null,

        subtotal: num(subtotal),

        discount: num(discount),

        tax_rate: num(taxRate),

        tax_amount: num(taxAmount),

        total: num(total),

        items,

      });

      alert("✅ Estimate Updated");
      navigate(`/admin/spare-parts/estimates/${id}`);

    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow p-6">

        <h1 className="text-2xl font-bold mb-6">
          Edit Estimate #{id}
        </h1>

        {/* CUSTOMER */}
        <select
          value={selectedCustomer}
          onChange={(e) =>
            setSelectedCustomer(e.target.value)
          }
          className="w-full p-3 border rounded mb-6"
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* ITEMS */}
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th>#</th>
              <th>Part</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t">

                <td>{i + 1}</td>

                <td>
                  <select
                    value={item.sparepart_id}
                    onChange={(e) =>
                      handleItemChange(
                        i,
                        "sparepart_id",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select</option>
                    {spareparts.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) =>
                      handleItemChange(
                        i,
                        "unit_price",
                        e.target.value
                      )
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    onChange={(e) =>
                      handleItemChange(
                        i,
                        "quantity",
                        e.target.value
                      )
                    }
                  />
                </td>

                <td>
                  {(
                    num(item.quantity) *
                    num(item.unit_price)
                  ).toFixed(2)}
                </td>

                <td>
                  <button
                    onClick={() => removeItem(i)}
                    className="bg-red-600 text-white px-2"
                  >
                    X
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addItem}
          className="mt-4 bg-blue-600 text-white px-4 py-2"
        >
          + Add Item
        </button>

        {/* TOTALS */}
        <div className="mt-6 space-y-3">

          <input
            type="number"
            value={discount}
            onChange={(e) =>
              setDiscount(num(e.target.value))
            }
            placeholder="Discount"
            className="border p-2"
          />

          <input
            type="number"
            value={taxRate}
            onChange={(e)=>setTaxRate(num(e.target.value))}
            placeholder="VAT %"
            className="border p-2"
          />

          <div>
            Subtotal: <b>{num(subtotal).toFixed(2)}</b>
          </div>

          <div>
            Total: <b>{num(total).toFixed(2)}</b>
          </div>

        </div>

        <button
          onClick={submitUpdate}
          disabled={loading}
          className="mt-6 bg-yellow-600 text-white px-6 py-3"
        >
          {loading ? "Updating..." : "Update Estimate"}
        </button>

      </div>
    </div>
  );
};

export default EditEstimate;
