// pages/spareparts/spareReceipts.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

export default function SpareReceipts() {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await API.get("/spare-sales");
        setSales(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch sales", err);
      }
    };
    fetchSales();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">All Spare Sales Receipts</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Receipt #</th>
            <th className="border p-2">Customer</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Payment</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className="hover:bg-gray-50">
              <td className="border p-2">{sale.receipt_number}</td>
              <td className="border p-2">{sale.customer_name}</td>
              <td className="border p-2">{Number(sale.total).toFixed(2)}</td>
              <td className="border p-2">{sale.payment_method}</td>
              <td className="border p-2">{new Date(sale.sale_date).toLocaleString()}</td>
              <td className="border p-2">
                <Link
                  to={`/admin/spare-parts/receipts/${sale.id}`}
                  className="text-blue-600 underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
