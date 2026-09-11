import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { FaSearch, FaShoppingCart } from "react-icons/fa";
import { getCustomerVehicles } from "../../api/serviceApi";

export default function SellSpareParts() {
  const [spareparts, setSpareparts] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedPart, setSelectedPart] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Manually entered selling price for this sale. Pre-filled with the
  // catalog selling_price as a suggestion, editable per sale, but never
  // allowed below buying_price — same rule as the job card parts flow.
  const [unitPrice, setUnitPrice] = useState(0);
  const [priceError, setPriceError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [cart, setCart] = useState([]);

  const [taxRate,setTaxRate]=useState(16);


  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");

    const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");

  const [billToSearch, setBillToSearch] = useState("");
  const [showBillToDropdown, setShowBillToDropdown] = useState(false);
  const [billToCustomerId, setBillToCustomerId] = useState("");
  const [billToName, setBillToName] = useState("");
  const [billToKraPin, setBillToKraPin] = useState("");

  // ------------------------------
  // Fetch Spareparts
  // ------------------------------
  useEffect(() => {
    const fetchSpareParts = async () => {
  try {
    const res = await API.get("/spareparts?limit=10000");

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


const fetchVehicles = async () => {
    try {
      const res = await getCustomerVehicles();
      setVehicles(res.data || []);
    } catch (err) {
      console.error("Failed to fetch vehicles", err);
      setVehicles([]);
    }
  };


    fetchSpareParts();
    fetchCustomers();
    fetchVehicles();
  }, []);


    const filteredBillToCustomers = customers.filter(c => {
    const term = billToSearch.toLowerCase().trim();
    if (!term) return true;
    return (
      (c.name || "").toLowerCase().includes(term) ||
      (c.phone || "").toLowerCase().includes(term)
    );
  });

  const handleBillToCustomerSelect = (c) => {
    setBillToCustomerId(c.id);
    setBillToName(c.name);
    setBillToKraPin(c.kra_pin || "");
    setBillToSearch("");
    setShowBillToDropdown(false);
  };

  const clearBillToCustomer = () => {
    setBillToCustomerId("");
    setBillToSearch("");
    setShowBillToDropdown(true);
  };



  // ------------------------------
  // Search filter
  // ------------------------------
  const filteredParts = spareparts.filter(
  (item) =>
    (item?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (item?.part_number ?? "").toLowerCase().includes(search.toLowerCase())
);

const customerVehicles = vehicles.filter(
  (v) => selectedCustomer && String(v.customer_id) === String(selectedCustomer)
);

  // ------------------------------
  // Select part
  // ------------------------------
  const handleSelectPart = (part) => {
    setSelectedPart(part);
    setQuantity(1);
    setDiscount(0);
    setUnitPrice(part.selling_price);
    setPriceError("");
  };

  // ------------------------------
  // Auto calculate total — now driven by the manually entered unitPrice
  // instead of selectedPart.selling_price directly
  // ------------------------------
  useEffect(() => {
    if (selectedPart) {
      const price = Number(unitPrice) || 0;
      const discountedPrice =
        price - (price * Number(discount || 0)) / 100;

      setTotalPrice(discountedPrice * Number(quantity || 0));

      if (
        unitPrice !== "" &&
        Number(unitPrice) < Number(selectedPart.buying_price)
      ) {
        setPriceError(
          `Price cannot be below buying price (Ksh ${selectedPart.buying_price})`
        );
      } else {
        setPriceError("");
      }
    }
  }, [selectedPart, unitPrice, discount, quantity]);

  // ------------------------------
  // Add to Cart (UPDATED ✅)
  // ------------------------------
  const addToCart = () => {
    if (!selectedPart) return alert("Select a spare part first!");
    if (quantity > selectedPart.quantity)
      return alert("Not enough stock available!");

    if (!unitPrice || Number(unitPrice) <= 0)
      return alert("Enter a selling price!");

    if (Number(unitPrice) < Number(selectedPart.buying_price))
      return alert(
        `Price cannot be below buying price (Ksh ${selectedPart.buying_price})`
      );

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
        unit_price: Number(unitPrice),
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
          ? customers.find(
              (c) => String(c.id) === String(selectedCustomer)
            )?.name
          : "Walk-in Customer",

        customer_phone: selectedCustomer
          ? customers.find(
              (c) => String(c.id) === String(selectedCustomer)
            )?.phone
          : "",

        vehicle_id: selectedVehicle || null,

        driver_name: driverName.trim() || null,
        driver_phone: driverPhone.trim() || null,

        bill_to_customer_id: billToCustomerId || null,
        bill_to_name: billToName.trim() || null,
        bill_to_kra_pin: billToKraPin.trim() || null,

        discount: Number(totalDiscountAmount),
        tax_rate: Number(taxRate),

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
      setSelectedCustomer("");
      setSelectedVehicle("");
      setDriverName("");
      setDriverPhone("");

      setBillToCustomerId("");
      setBillToSearch("");
      setBillToName("");
      setBillToKraPin("");
      setShowBillToDropdown(false);
    } catch (err) {
      console.error("❌ Error creating estimate:", err);
      alert(err.response?.data?.message || "Failed to create estimate. Check console.");
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
            onChange={(e) => {
              const val = e.target.value;

              setSelectedCustomer(val);
              setSelectedVehicle("");

              // Default Bill To to the selected customer.
              // The user can change it below if someone else is paying.
              if (val) {
                const c = customers.find((c) => String(c.id) === String(val));

                if (c) {
                  setBillToCustomerId(c.id);
                  setBillToName(c.name);
                  setBillToKraPin(c.kra_pin || "");
                  setBillToSearch("");
                }
              } else {
                setBillToCustomerId("");
                setBillToName("");
                setBillToKraPin("");
                setBillToSearch("");
              }
            }}
          >
            <option value="">Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        {selectedCustomer && (
          <div className="mb-4">
            <label className="block font-medium">Vehicle (optional)</label>
            <select
              className="border p-2 w-full rounded"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="">No vehicle</option>
              {customerVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} - {v.registration_number}
                </option>
              ))}
            </select>
            {customerVehicles.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                No vehicles on file for this customer.
              </p>
            )}
          </div>
        )}

                {/* Driver / Contact */}
        <div className="mb-4">
          <label className="block font-medium">
            Driver / Contact Name
          </label>

          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="Person collecting the parts, if different from customer"
            className="border p-2 w-full rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium">
            Driver / Contact Phone
          </label>

          <input
            type="text"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            placeholder="Contact phone"
            className="border p-2 w-full rounded"
          />
        </div>

        {/* Bill To */}
        <div className="mb-4">
          <label className="block font-medium">
            Bill To (only if someone else is paying)
          </label>

          <div className="relative">
            <input
              type="text"
              value={
                billToCustomerId
                  ? billToName
                  : billToSearch
              }
              onChange={(e) => {
                const value = e.target.value;

                setBillToSearch(value);
                setShowBillToDropdown(true);

                // If a linked customer was selected,
                // typing means the user wants to change it.
                if (billToCustomerId) {
                  setBillToCustomerId("");
                  setBillToName(value);
                }
              }}
              onFocus={() => setShowBillToDropdown(true)}
              placeholder="Search customer, or type manually..."
              className="border p-2 w-full rounded pr-8"
            />

            {billToCustomerId && (
              <button
                type="button"
                onClick={clearBillToCustomer}
                className="absolute right-3 top-2 text-slate-400 hover:text-red-500"
              >
                ×
              </button>
            )}

            {showBillToDropdown && !billToCustomerId && (
              <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border rounded-lg shadow-lg">
                {filteredBillToCustomers.length === 0 ? (
                  <div className="p-3 text-sm text-slate-400">
                    No customers found
                  </div>
                ) : (
                  filteredBillToCustomers.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => handleBillToCustomerSelect(c)}
                      className="w-full text-left p-3 hover:bg-blue-50"
                    >
                      <p className="font-medium">
                        {c.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {c.phone}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <input
            type="text"
            value={billToKraPin}
            onChange={(e) => setBillToKraPin(e.target.value)}
            placeholder="Bill To KRA PIN"
            className="border p-2 w-full rounded mt-2"
          />
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
            <p className="text-sm text-gray-600">
              Suggested selling price: Ksh {selectedPart.selling_price}
              {" "}·{" "}
              Buying price: Ksh {selectedPart.buying_price} (minimum allowed)
            </p>

            <label>Selling Price (Ksh)</label>
            <input
              type="number"
              min={selectedPart.buying_price}
              step="0.01"
              value={unitPrice}
              onChange={(e) =>
                setUnitPrice(e.target.value)
              }
              className="border p-2 w-full rounded"
            />
            {priceError && (
              <p className="text-red-600 text-sm mt-1">{priceError}</p>
            )}

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
              disabled={!!priceError || !unitPrice}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400"
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