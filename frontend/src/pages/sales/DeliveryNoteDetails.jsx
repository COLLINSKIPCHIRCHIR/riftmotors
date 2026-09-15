import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

const DeliveryNoteDetails = () => {
  const { id } = useParams();
  const [note, setNote] = useState(null);

  const fetchNote = () => {
    API.get(`/delivery-notes/${id}`).then((res) => setNote(res.data));
  };

  useEffect(() => { fetchNote(); }, [id]);

  const toggleItem = async (itemId, current) => {
    try {
      await API.patch(`/delivery-notes/items/${itemId}`, { is_checked: !current });
      fetchNote();
    } catch (err) {
      toast.error("Error updating item");
    }
  };

  if (!note) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 print:shadow-none">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">DELIVERY NOTE</h2>

        <div className="text-sm mb-6 space-y-1">
          <p><strong>Date:</strong> {new Date(note.delivery_date).toLocaleDateString()}</p>
          <p><strong>Invoice:</strong> {note.invoice_no}</p>
          <p><strong>Vehicle:</strong> {note.make} {note.model} — Chassis: {note.chassis_no}</p>
          <p><strong>Customer:</strong> {note.customer_name}</p>
          <p><strong>Mileage on Delivery:</strong> {note.mileage_on_delivery ?? "—"} km</p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
          {note.items.map((item) => (
            <label key={item.id} className="flex items-center gap-2">
              <input type="checkbox" checked={item.is_checked}
                onChange={() => toggleItem(item.id, item.is_checked)} />
              <span>{item.item_name} {item.quantity > 1 ? `(x${item.quantity})` : ""}</span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm border-t pt-4">
          <div>
            <p className="text-gray-500 mb-6">Delivered by: {note.delivered_by || "________"}</p>
            <p className="border-t border-gray-300 pt-1">Signature</p>
          </div>
          <div>
            <p className="text-gray-500 mb-6">Received by: {note.received_by || "________"}</p>
            <p className="border-t border-gray-300 pt-1">Signature</p>
          </div>
        </div>

        <button onClick={() => window.print()}
          className="mt-6 w-full border border-gray-300 py-2 rounded-md hover:bg-gray-50 print:hidden">
          Print
        </button>
      </div>
    </div>
  );
};

export default DeliveryNoteDetails;