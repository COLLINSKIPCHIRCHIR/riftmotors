import React, { useEffect, useState, useRef } from "react";
import API from "../../api/api";
import { FaEdit, FaTrash, FaSearch, FaSort, FaFileExcel, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

const Card = ({ title, value }) => (
  <div className="bg-white border rounded-xl p-4 shadow-sm">
    <p className="text-sm text-gray-500">{title}</p>
    <h3 className="text-2xl font-bold text-gray-800 mt-2">
      {value}
    </h3>
  </div>
);

// All exportable columns: key = field on the row, label = Excel header
const EXPORT_COLUMNS = [
  { key: "part_number", label: "Part Number" },
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "supplier_name", label: "Supplier" },
  { key: "quantity", label: "Qty" },
  { key: "buying_price", label: "Buying Price" },
  { key: "selling_price", label: "Selling Price" },
  { key: "discount", label: "Discount (%)" },
];

export default function SparepartsInventory() {
  const navigate = useNavigate();

  const [spareparts, setSpareparts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  });

  const [currentPage, setCurrentPage] = useState(1);

  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // ===========================
  // Export state
  // ===========================
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(
    EXPORT_COLUMNS.map((c) => c.key) // all selected by default
  );
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    setSelectedColumns((prev) =>
      prev.length === EXPORT_COLUMNS.length
        ? []
        : EXPORT_COLUMNS.map((c) => c.key)
    );
  };

  const handleExportExcel = async () => {
    if (selectedColumns.length === 0) {
      alert("Select at least one column to export.");
      return;
    }

    setExporting(true);

    try {
      const res = await API.get("/spareparts/export", {
        params: { search },
      });

      const columnsToExport = EXPORT_COLUMNS.filter((c) =>
        selectedColumns.includes(c.key)
      );

      const rows = res.data.map((item) => {
        const row = {};
        columnsToExport.forEach((col) => {
          let value = item[col.key];

          if (col.key === "buying_price" || col.key === "selling_price") {
            value = Number(value);
          }
          if (col.key === "supplier_name") {
            value = value || "—";
          }
          if (col.key === "discount") {
            value = value || 0;
          }

          row[col.label] = value;
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Spare Parts");

      XLSX.writeFile(workbook, `spareparts-inventory-${Date.now()}.xlsx`);

      setExportOpen(false);
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ===========================
  // Load Inventory
  // ===========================
  const loadSpareparts = async () => {
    setLoading(true);

    try {
      const res = await API.get("/spareparts", {
        params: {
          page: currentPage,
          limit: 20,
          search,
        },
      });

      let data = res.data.data || [];

      // Sort current page only
      data = [...data].sort((a, b) => {
        const valueA = a[sortField] ?? "";
        const valueB = b[sortField] ?? "";

        if (typeof valueA === "string") {
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        return sortOrder === "asc"
          ? valueA - valueB
          : valueB - valueA;
      });

      setSpareparts(data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // Inventory Statistics
  // ===========================
  const loadInventoryStats = async () => {
    try {
      const res = await API.get("/spareparts/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSpareparts();
  }, [currentPage, search, sortField, sortOrder]);

  useEffect(() => {
    loadInventoryStats();
  }, []);

  // ===========================
  // Sorting
  // ===========================
  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // ===========================
  // Stock Badge
  // ===========================
  const stockBadge = (qty) => {
    if (qty === 0) {
      return (
        <span className="px-2 py-1 rounded-lg text-xs bg-red-600 text-white">
          Out of Stock
        </span>
      );
    }

    if (qty <= 5) {
      return (
        <span className="px-2 py-1 rounded-lg text-xs bg-yellow-500 text-white">
          Low Stock
        </span>
      );
    }

    return (
      <span className="px-2 py-1 rounded-lg text-xs bg-green-600 text-white">
        In Stock
      </span>
    );
  };

  // ===========================
  // Delete
  // ===========================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this spare part?")) return;

    try {
      await API.delete(`/spareparts/${id}`);

      loadSpareparts();
      loadInventoryStats();
    } catch (err) {
      console.error(err);
    }
  };

 return (
  <div className="p-6 min-h-screen bg-gray-100">
    <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-md p-6">

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <Card title="Total Parts" value={stats.total_parts} />

          <Card title="Stock Units" value={stats.total_units} />

          <Card
            title="Inventory Value"
            value={`Ksh ${Number(stats.inventory_value).toLocaleString()}`}
          />

          <Card
            title="Potential Sales"
            value={`Ksh ${Number(
              stats.potential_sales_value
            ).toLocaleString()}`}
          />

          <Card title="Low Stock" value={stats.low_stock_items} />

          <Card title="Out of Stock" value={stats.out_of_stock_items} />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Spare Parts Inventory
        </h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 border rounded-lg px-3 py-2 w-72">
            <FaSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search part..."
              className="bg-transparent outline-none w-full"
              value={search}
              onChange={(e) => {
                setCurrentPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              <FaFileExcel />
              Export
              <FaChevronDown className="text-xs" />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border rounded-xl shadow-lg z-10 p-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Choose columns
                  </p>
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {selectedColumns.length === EXPORT_COLUMNS.length
                      ? "Clear all"
                      : "Select all"}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                  {EXPORT_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(col.key)}
                        onChange={() => toggleColumn(col.key)}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleExportExcel}
                  disabled={exporting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
                >
                  {exporting ? "Exporting..." : "Download Excel"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-center py-10 text-gray-500">
          Loading spare parts...
        </p>
      )}

      {/* Empty */}
      {!loading && spareparts.length === 0 && (
        <p className="text-center py-10 text-gray-500">
          No spare parts found.
        </p>
      )}

      {/* Table */}
      {!loading && spareparts.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
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
                      onClick={() => handleSort(col.field)}
                      className="p-3 text-left cursor-pointer whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        <FaSort className="text-xs text-gray-500" />
                      </div>
                    </th>
                  ))}

                  <th className="p-3 text-left whitespace-nowrap">
                    Discount
                  </th>

                  <th className="p-3 text-left whitespace-nowrap">
                    Status
                  </th>

                  <th className="p-3 text-left whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {spareparts.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3">{item.part_number}</td>

                    <td className="p-3 font-medium">
                      {item.name}
                    </td>

                    <td className="p-3">
                      {item.category}
                    </td>

                    <td className="p-3">
                      {item.supplier_name || "—"}
                    </td>

                    <td
                      className={`p-3 font-semibold ${
                        item.quantity <= 5
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                      {item.quantity}
                    </td>

                    <td className="p-3">
                      Ksh {Number(item.buying_price).toLocaleString()}
                    </td>

                    <td className="p-3">
                      Ksh {Number(item.selling_price).toLocaleString()}
                    </td>

                    <td className="p-3">
                      {item.discount || 0}%
                    </td>

                    <td className="p-3">
                      {stockBadge(item.quantity)}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/spare-parts/history/${item.id}`
                            )
                          }
                          className="text-purple-600 hover:text-purple-800 text-sm"
                        >
                          History
                        </button>

                        <button
                          onClick={() =>
                            navigate(
                              `/admin/spare-parts/edit/${item.id}`
                            )
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 border-t pt-4">

            <p className="text-sm text-gray-600">
              Showing page{" "}
              <strong>{pagination.page}</strong> of{" "}
              <strong>{pagination.totalPages}</strong>
              {" • "}
              {pagination.total} spare parts
            </p>

            <div className="flex gap-2">

              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((p) => p - 1)
                }
                className="px-4 py-2 rounded-lg border bg-gray-100 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                disabled={
                  currentPage >= pagination.totalPages
                }
                onClick={() =>
                  setCurrentPage((p) => p + 1)
                }
                className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-40"
              >
                Next
              </button>

            </div>

          </div>
        </>
      )}
    </div>
  </div>
);
}