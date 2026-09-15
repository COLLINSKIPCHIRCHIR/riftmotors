import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { hasPermission } from "../../utils/permissions";

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("");

  const fetchInvoice = () => {
    API.get(`/sales-invoices/${id}`).then((res) => {
      setInvoice(res.data);
      setPaymentStatus(res.data.payment_status);
    });
  };

  useEffect(() => { fetchInvoice(); }, [id]);

  const updatePayment = async (e) => {
    const status = e.target.value;
    setPaymentStatus(status);
    try {
      await API.patch(`/sales-invoices/${id}/payment-status`, { payment_status: status });
      toast.success("Payment status updated");
      fetchInvoice();
    } catch (err) {
      toast.error("Error updating payment status");
    }
  };

  const handleCreateDeliveryNote = () => {
    navigate(`/admin/sales/delivery-notes/create?invoice_id=${invoice.id}`);
  };

  if (!invoice) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">SALES INVOICE</h2>
            <p className="text-sm text-gray-500">Invoice No: {invoice.invoice_no}</p>
          </div>
          <select value={paymentStatus} onChange={updatePayment}
            className="border rounded-md p-1.5 text-xs capitalize">
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <p className="font-semibold text-gray-700 mb-1">Client Details</p>
            <p>{invoice.customer_name}</p>
            <p className="text-gray-500">{invoice.customer_address}</p>
            <p className="text-gray-500">{invoice.customer_phone}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">Vehicle Details</p>
            <p>{invoice.make} {invoice.model} ({invoice.year})</p>
            <p className="text-gray-500">Chassis: {invoice.chassis_no}</p>
            <p className="text-gray-500">Engine: {invoice.engine_no}</p>
          </div>
        </div>

        {invoice.items && invoice.items.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Accessories / Add-ons</p>
            <table className="w-full text-sm">
              <tbody>
                {invoice.items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="py-1 text-gray-600">{it.item_name} {it.quantity > 1 ? `(x${it.quantity})` : ""}</td>
                    <td className="py-1 text-right">Ksh {(Number(it.price) * Number(it.quantity)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <table className="w-full text-sm mb-6">
          <tbody>
            <tr className="border-t">
              <td className="py-2 text-gray-600">Sale Price</td>
              <td className="py-2 text-right">Ksh {Number(invoice.sale_price).toLocaleString()}</td>
            </tr>
            {invoice.trade_in_amount > 0 && (
              <tr>
                <td className="py-2 text-gray-600">Less: Trade-in</td>
                <td className="py-2 text-right text-red-600">
                  -Ksh {Number(invoice.trade_in_amount).toLocaleString()}
                </td>
              </tr>
            )}
            {invoice.vat_amount > 0 && (
              <tr>
                <td className="py-2 text-gray-600">VAT</td>
                <td className="py-2 text-right">Ksh {Number(invoice.vat_amount).toLocaleString()}</td>
              </tr>
            )}
            <tr className="border-t font-bold">
              <td className="py-2">Total</td>
              <td className="py-2 text-right">Ksh {Number(invoice.total_amount).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        {hasPermission("sales.delivery.create") && (
          <button onClick={handleCreateDeliveryNote}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
            Create Delivery Note
          </button>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;