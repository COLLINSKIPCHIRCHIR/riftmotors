import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { FaPrint, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


export default function SpareEstimates() {

  const navigate = useNavigate();

  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ------------------------------
  // Fetch all estimates
  // ------------------------------
  useEffect(() => {
    const fetchEstimates = async () => {
      try {
        const res = await API.get("/estimates");
        setEstimates(res.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch estimates", err);
        setError("Failed to load estimates");
      } finally {
        setLoading(false);
      }
    };

    fetchEstimates();
  }, []);

  // ------------------------------
  // Build printable HTML
  // ------------------------------
  const buildEstimateHtml = (estimate) => {
    const createdAt = new Date(estimate.created_at).toLocaleString();

    const rows = (estimate.items || [])
      .map((item, index) => {
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${item.name || ""}</td>
            <td>${item.part_number || ""}</td>
            <td style="text-align:right">${Number(item.unit_price || 0).toFixed(2)}</td>
            <td style="text-align:center">${item.quantity}</td>
            <td style="text-align:right">${Number(item.total || 0).toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <!doctype html>
      <html>
        <head>
          <title>Estimate #${estimate.id}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2, h3 { margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ccc; padding: 8px; }
            th { background: #f4f4f4; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>Rift Motors Ltd</h2>
          <p>Phone: 07XXXXXXXX</p>
          <hr />

          <h3>Estimate #${estimate.id}</h3>
          <p><strong>Date:</strong> ${createdAt}</p>
          <p><strong>Customer:</strong> ${estimate.customer_name}</p>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Part</th>
                <th>Part No</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <h3 class="right">Subtotal: Ksh ${Number(estimate.subtotal).toFixed(2)}</h3>
          <h3 class="right">Total: Ksh ${Number(estimate.total).toFixed(2)}</h3>

          <p style="margin-top:40px;font-size:12px;">
            This is an estimate. Prices valid for 7 days.
          </p>
        </body>
      </html>
    `;
  };

  // ------------------------------
  // View / Print estimate
  // ------------------------------
  const viewEstimate = async (id) => {
    try {
      const res = await API.get(`/estimates/${id}`);
      const estimate = res.data;

      const html = buildEstimateHtml(estimate);
      const win = window.open("", "_blank");

      if (!win) {
        alert("Please allow popups");
        return;
      }

      win.document.open();
      win.document.write(html);
      win.document.close();

      setTimeout(() => {
        win.focus();
        win.print();
      }, 500);
    } catch (err) {
      console.error("❌ Failed to load estimate", err);
      alert("Failed to open estimate");
    }
  };

  // ------------------------------
  // UI
  // ------------------------------
  if (loading) {
    return <div className="p-6">Loading estimates...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-6">Spare Part Estimates</h1>

        {estimates.length === 0 ? (
          <p>No estimates found.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">ID</th>
                <th className="border p-2">Customer</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Created</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {estimates.map((est) => (
                <tr key={est.id} className="text-center hover:bg-gray-50">
                  <td className="border p-2">{est.id}</td>
                  <td className="border p-2">{est.customer_name}</td>
                  <td className="border p-2">
                    Ksh {Number(est.total).toFixed(2)}
                  </td>
                  <td className="border p-2 capitalize">{est.status}</td>
                  <td className="border p-2">
                    {new Date(est.created_at).toLocaleString()}
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => navigate(`/admin/spare-parts/estimates/${est.id}`)}
                      className="text-blue-600 flex items-center gap-2 justify-center"
                    >
                      <FaEye /> View
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
