import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { FaSearch, FaShoppingCart } from "react-icons/fa";

export default function SellSpareParts() {
  const [spareparts, setSpareparts] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedPart, setSelectedPart] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [cart, setCart] = useState([]);

  const [taxRate,setTaxRate]=useState(16);

  // ------------------------------
  // Fetch Spareparts
  // ------------------------------
  useEffect(() => {
    const fetchSpareParts = async () => {
  try {
    const res = await API.get("/spareparts");

    const data =
      res.data?.data ||
      res.data?.spareparts ||
      res.data ||
      [];

    setSpareparts(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("❌ Failed to fetch spare parts", err);
    setSpareparts([]);
  }
};


    const fetchCustomers = async () => {
  try {
    const res = await API.get("/customers");

    const data =
      res.data?.data ||
      res.data?.customers ||
      res.data ||
      [];

    setCustomers(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Failed to fetch customers", err);
    setCustomers([]);
  }
};


    fetchSpareParts();
    fetchCustomers();
  }, []);

  // ------------------------------
  // Search filter
  // ------------------------------
  const filteredParts = spareparts.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.part_number.toLowerCase().includes(search.toLowerCase())
  );

  // ------------------------------
  // Select part
  // ------------------------------
  const handleSelectPart = (part) => {
    setSelectedPart(part);
    setQuantity(1);
    setDiscount(0);
  };

  // ------------------------------
  // Auto calculate total
  // ------------------------------
  useEffect(() => {
    if (selectedPart) {
      const sellingPrice = Number(selectedPart.selling_price) || 0;
      const discountedPrice =
        sellingPrice - (sellingPrice * Number(discount || 0)) / 100;

      setTotalPrice(discountedPrice * Number(quantity || 0));
    }
  }, [selectedPart, discount, quantity]);

  // ------------------------------
  // Add to Cart (UPDATED ✅)
  // ------------------------------
  const addToCart = () => {
    if (!selectedPart) return alert("Select a spare part first!");
    if (quantity > selectedPart.quantity)
      return alert("Not enough stock available!");

    const existingIndex = cart.findIndex(
      (item) => item.sparepart_id === selectedPart.id
    );

    const itemTotal = totalPrice;

    if (existingIndex !== -1) {
      const updatedCart = [...cart];

      updatedCart[existingIndex].quantity += Number(quantity);
      updatedCart[existingIndex].total += itemTotal;

      setCart(updatedCart);
    } else {
      const item = {
        sparepart_id: selectedPart.id,
        name: selectedPart.name,
        part_number: selectedPart.part_number,
        unit_price: Number(selectedPart.selling_price),
        quantity: Number(quantity),
        discount_percent: Number(discount),
        total: itemTotal,
      };

      setCart([...cart, item]);
    }

    // ✅ stay in selling mode
    setQuantity(1);
    setDiscount(0);
  };

  // ------------------------------
  // Remove Item
  // ------------------------------
  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // ------------------------------
  // Grand Totals
  // ------------------------------
  const grandTotal = cart.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  const totalWithoutDiscount = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const totalDiscountAmount = totalWithoutDiscount - grandTotal;

  // ------------------------------
  // Submit Estimate
  // ------------------------------
  const submitEstimate = async () => {
    if (cart.length === 0) return alert("Cart is empty!");

    try {
      const payload = {
        customer_id: selectedCustomer || null,
        customer_name: selectedCustomer
          ? customers.find((c) => c.id === Number(selectedCustomer))?.name
          : "Walk-in Customer",
        customer_phone: selectedCustomer
          ? customers.find((c) => c.id === Number(selectedCustomer))?.phone
          : "",

        discount: Number(totalDiscountAmount),

        tax_rate:Number(taxRate),

        items: cart.map((item) => ({
          sparepart_id: item.sparepart_id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      };

      console.log("📦 Sending payload:", payload);

      const res = await API.post("/estimates/create", payload);
      const estimate = res.data.estimate || res.data;

      if (!estimate?.id) {
        alert("Estimate created but no ID returned");
        return;
      }

      alert(`✅ Estimate created! ID: ${estimate.id}`);

      setCart([]);
    } catch (err) {
      console.error("❌ Error creating estimate:", err);
      alert("Failed to create estimate. Check console.");
    }
  };

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold mb-6">Sell Spare Parts</h1>

        <div className="mb-4">
          <label className="block font-medium">Customer</label>
          <select
            className="border p-2 w-full rounded"
            value={selectedCustomer || ""}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            <option value="">Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center bg-gray-200 px-3 py-2 rounded-lg w-full mb-4">
          <FaSearch className="text-gray-600 mr-2" />
          <input
            type="text"
            placeholder="Search part name or part number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full"
          />
        </div>

        {/* Parts List */}
        {filteredParts.length > 0 && (
          <div className="bg-gray-100 rounded-lg p-3 max-h-64 overflow-y-auto border">
            {filteredParts.map((part) => (
              <div
                key={part.id}
                className="p-2 border-b cursor-pointer hover:bg-gray-200"
                onClick={() => handleSelectPart(part)}
              >
                <p className="font-medium">{part.name}</p>
                <p className="text-sm text-gray-600">
                  {part.part_number}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Selected Part */}
        {selectedPart && (
          <div className="bg-blue-50 p-4 rounded-xl mt-4 border">
            <h2 className="text-lg font-semibold mb-2">
              Selected Part
            </h2>

            <p><strong>Name:</strong> {selectedPart.name}</p>
            <p><strong>Stock:</strong> {selectedPart.quantity}</p>
            <p>
              <strong>Selling Price:</strong> Ksh{" "}
              {selectedPart.selling_price}
            </p>

            <label>Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(Number(e.target.value))
              }
              className="border p-2 w-full rounded"
            />

            <label>Discount (%)</label>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) =>
                setDiscount(Number(e.target.value))
              }
              className="border p-2 w-full rounded"
            />

            <p className="mt-4 text-xl font-bold">
              Total: Ksh {totalPrice.toFixed(2)}
            </p>

            <button
              onClick={addToCart}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaShoppingCart /> Add to Cart
            </button>
          </div>
        )}

        {/* Cart */}
        {cart.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-3">
              Cart ({cart.length} items)
            </h2>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">Part</th>
                  <th className="p-2 border">Qty</th>
                  <th className="p-2 border">Unit Price</th>
                  <th className="p-2 border">Discount %</th>
                  <th className="p-2 border">Total</th>
                  <th className="p-2 border">Remove</th>
                </tr>
              </thead>

              <tbody>
                {cart.map((item, index) => (
                  <tr key={index} className="text-center">
                    <td className="border p-2">{item.name}</td>
                    <td className="border p-2">{item.quantity}</td>
                    <td className="border p-2">{item.unit_price}</td>
                    <td className="border p-2">
                      {item.discount_percent}%
                    </td>
                    <td className="border p-2">
                      {item.total.toFixed(2)}
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-600"
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 className="text-xl text-right mt-4">
              Total Discount: Ksh{" "}
              {totalDiscountAmount.toFixed(2)}
            </h2>

            <h2 className="text-2xl font-bold text-right">
              Grand Total: Ksh {grandTotal.toFixed(2)}
            </h2>

            <div className="mt-4">

            <label className="font-medium">
            Tax Rate %
            </label>

            <input

            type="number"

            value={taxRate}

            onChange={(e)=>
            setTaxRate(e.target.value)
            }

            className="
            border
            p-2
            w-full
            rounded
            "

            />

            </div>

            <button
              onClick={submitEstimate}
              className="mt-4 w-full bg-yellow-600 text-white py-3 rounded-xl text-lg"
            >
              Generate Estimate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
