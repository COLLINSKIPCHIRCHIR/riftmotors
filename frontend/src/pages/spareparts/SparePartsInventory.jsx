import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { FaEdit, FaTrash, FaSearch, FaSort } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function SparepartsInventory() {
  const [spareparts, setSpareparts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search + Sorting + Pagination
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const navigate = useNavigate();

  useEffect(() => {
    const loadSpareparts = async () => {
      try {
        const res = await API.get("/spareparts");

        console.log("📦 FULL API RESPONSE:", res);
        console.log("📦 res.data:", res.data);
        console.log("📦 Is res.data array?", Array.isArray(res.data));

        setSpareparts(res.data.data);
        setFiltered(res.data.data);
      } catch (err) {
        console.error("❌ Failed to fetch spare parts:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSpareparts();
  }, []);

  // 🔎 Search Filter
  useEffect(() => {
    console.log("🔍 Running filter...");
    console.log("spareparts:", spareparts);

    const result = Array.isArray(spareparts)
      ? spareparts.filter((item) =>
          (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (item.part_number || "").toLowerCase().includes(search.toLowerCase())
        )
      : [];

    console.log("🔍 Filtered result:", result);

    setFiltered(result);
    setCurrentPage(1);
  }, [search, spareparts]);

  // 🔽 Sorting
  const handleSort = (field) => {
    const order = sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);

    console.log("🔽 Sorting by:", field, "Order:", order);
    console.log("Before sort:", filtered);

    const sorted = Array.isArray(filtered)
      ? [...filtered].sort((a, b) => {
          const valueA = a[field] ?? "";
          const valueB = b[field] ?? "";

          if (typeof valueA === "string") {
            return order === "asc"
              ? valueA.localeCompare(valueB)
              : valueB.localeCompare(valueA);
          }

          return order === "asc" ? valueA - valueB : valueB - valueA;
        })
      : [];

    console.log("After sort:", sorted);

    setFiltered(sorted);
  };

  // 📄 Pagination logic
  console.log("📄 Pagination input (filtered):", filtered);
  console.log("📄 Is filtered array?", Array.isArray(filtered));

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;

  const currentItems = Array.isArray(filtered)
    ? filtered.slice(indexOfFirst, indexOfLast)
    : [];

  console.log("📄 Current items:", currentItems);

  const totalPages = Array.isArray(filtered)
    ? Math.ceil(filtered.length / itemsPerPage)
    : 0;

  // 🏷 Stock Status Badge
  const stockBadge = (qty) => {
    if (qty === 0)
      return (
        <span className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs">
          Out of Stock
        </span>
      );

    if (qty < 5)
      return (
        <span className="px-2 py-1 bg-yellow-500 text-white rounded-lg text-xs">
          Low Stock
        </span>
      );

    return (
      <span className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs">
        In Stock
      </span>
    );
  };

  // 🗑 Delete Part
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this part?")) return;

    try {
      await API.delete(`/spareparts/${id}`);
      setSpareparts(spareparts.filter((item) => item.id !== id));
    } catch (err) {
      console.error("❌ Failed to delete:", err);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-2xl shadow-md">

        {/* Header + Search */}
        <div className="flex flex-wrap items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Spare Parts Inventory</h1>

          <div className="flex items-center bg-gray-200 px-3 py-2 rounded-lg w-64">
            <FaSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search part name or number..."
              className="bg-transparent outline-none text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && <p className="text-center text-gray-500">Loading...</p>}

        {/* No Data */}
        {!loading && Array.isArray(filtered) && filtered.length === 0 && (
          <p className="text-center text-gray-500">No spare parts available.</p>
        )}

        {/* Table */}
        {!loading && Array.isArray(filtered) && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-200 text-left">
                  {[
                    { label: "Part Number", field: "part_number" },
                    { label: "Name", field: "name" },
                    { label: "Category", field: "category" },
                    { label: "Supplier", field: "supplier_name" },
                    { label: "Qty", field: "quantity" },
                    { label: "Buy Price", field: "buying_price" },
                    { label: "Sell Price", field: "selling_price" },
                  ].map((col) => (
                    <th
                      key={col.field}
                      className="p-3 border cursor-pointer"
                      onClick={() => handleSort(col.field)}
                    >
                      <div className="flex items-center gap-2">
                        {col.label} <FaSort className="text-gray-500" />
                      </div>
                    </th>
                  ))}

                  <th className="p-3 border">Discount %</th>
                  <th className="p-3 border">Status</th>
                  <th className="p-3 border">Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-100">
                    <td className="p-3 border">{item.part_number}</td>
                    <td className="p-3 border">{item.name}</td>
                    <td className="p-3 border">{item.category}</td>
                    <td className="p-3 border">
                      {item.supplier_name || "—"}
                    </td>

                    <td
                      className={`p-3 border font-semibold ${
                        item.quantity < 5 ? "text-red-600" : ""
                      }`}
                    >
                      {item.quantity}
                    </td>

                    <td className="p-3 border">Ksh {item.buying_price}</td>
                    <td className="p-3 border">Ksh {item.selling_price}</td>
                    <td className="p-3 border">{item.discount || 0}%</td>

                    <td className="p-3 border">
                      {stockBadge(item.quantity)}
                    </td>

                    <td className="p-3 border flex items-center gap-3">
                      <button
                        onClick={() =>
                          navigate(`/admin/spare-parts/history/${item.id}`)
                        }
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        History
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/admin/spare-parts/edit/${item.id}`)
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {Array.isArray(filtered) && filtered.length > itemsPerPage && (
          <div className="flex justify-center mt-6 gap-3">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
