import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPurchase, receiveGoods } from "../../api/purchaseApi";

export default function ReceiveGoods() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [receiveQty, setReceiveQty] = useState({}); // { [purchase_item_id]: qty }

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const res = await getPurchase(id);
      setPurchase(res.data.purchase);
      setItems(res.data.items);
    } catch (err) {
      console.log(err);
    }
  };

  if (!purchase) return <div className="p-6">Loading...</div>;

  const remaining = (item) => item.quantity - item.quantity_received;

  const handleQtyChange = (itemId, value, max) => {
    const qty = Math.max(0, Math.min(Number(value), max));
    setReceiveQty({ ...receiveQty, [itemId]: qty });
  };

  const handleFillAll = () => {
    const filled = {};
    items.forEach((item) => {
      filled[item.id] = remaining(item);
    });
    setReceiveQty(filled);
  };

  const handleSubmit = async () => {
    const payloadItems = Object.entries(receiveQty)
      .filter(([, qty]) => qty > 0)
      .map(([purchase_item_id, quantity_received]) => ({
        purchase_item_id: Number(purchase_item_id),
        quantity_received,
      }));

    if (payloadItems.length === 0) {
      alert("Enter at least one received quantity");
      return;
    }

    try {
      await receiveGoods(id, { items: payloadItems, notes });
      alert("Delivery recorded — stock has been updated");
      navigate(`/admin/spare-parts/purchases/${id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record delivery");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Receive Goods</h1>
            <p className="text-gray-500 text-sm">
              Against {purchase.lpo_number || `PO-${purchase.id}`}
            </p>
          </div>
          <button onClick={handleFillAll} className="text-blue-600 text-sm underline">
            Fill all as fully delivered
          </button>
        </div>

        <table className="w-full border text-sm mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">Part</th>
              <th className="p-2 border">Ordered</th>
              <th className="p-2 border">Already Received</th>
              <th className="p-2 border">Receiving Now</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const max = remaining(item);
              return (
                <tr key={item.id}>
                  <td className="border p-2">{item.sparepart_name}</td>
                  <td className="border p-2 text-center">{item.quantity}</td>
                  <td className="border p-2 text-center">{item.quantity_received}</td>
                  <td className="border p-2 text-center">
                    {max === 0 ? (
                      <span className="text-green-600 text-xs">Fully received</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={max}
                        value={receiveQty[item.id] ?? ""}
                        onChange={(e) => handleQtyChange(item.id, e.target.value, max)}
                        placeholder={`max ${max}`}
                        className="w-20 border p-1 rounded text-center"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Delivery notes (optional) — e.g. delivery note number, condition of goods"
          className="w-full border p-2 rounded text-sm mb-4"
          rows={3}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate(`/admin/spare-parts/purchases/${id}`)}
            className="px-5 py-2 rounded border"
          >
            Cancel
          </button>
          <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded">
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
}