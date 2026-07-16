// src/pages/Inventory.jsx
import React, { useEffect, useState } from "react";
import axios from "../api/api";
import { motion } from "framer-motion";
import { FaSearch, FaBoxOpen, FaCar, FaCogs } from "react-icons/fa";

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get("/inventory");
        setInventory(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error("❌ Error fetching inventory:", err);
        setError("Failed to load inventory data");
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // 🔍 Handle search and filter
  useEffect(() => {
    let filteredData = [...inventory];

    // Filter by type (All, vehicle, spare)
    if (filter !== "All") {
      filteredData = filteredData.filter(
        (item) => item.type.toLowerCase() === filter.toLowerCase()
      );
    }

    // Search by brand or name
    if (searchTerm.trim() !== "") {
      filteredData = filteredData.filter(
        (item) =>
          item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFiltered(filteredData);
  }, [searchTerm, filter, inventory]);

  // 🧭 Loading and error states
  if (loading)
    return <div className="text-center mt-10 text-blue-600 font-medium">Loading inventory...</div>;
  if (error)
    return <div className="text-center mt-10 text-red-500 font-medium">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100 text-center">
        Inventory Overview
      </h1>

      {/* 🔍 Search + Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Search Bar */}
        <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-2 rounded-xl shadow-sm w-full sm:w-1/2">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by brand or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3">
          {["All", "vehicle", "spare"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                filter === type
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700"
              }`}
            >
              {type === "All" && <FaBoxOpen />}
              {type === "vehicle" && <FaCar />}
              {type === "spare" && <FaCogs />}
              <span className="capitalize">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 🧩 Inventory Cards */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400 mt-12">
          No items match your search or filter.
        </p>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              whileHover={{ scale: 1.03 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all"
            >
              {/* ✅ Vehicle / Spare Image */}
              {item.image_url ? (
                <img
                  src={`${import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5004"}${item.image_url.startsWith("/") ? item.image_url : `/${item.image_url}`}`}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />

              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500">
                  No Image
                </div>
              )}

              {/* Card Content */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {item.brand || "Unknown"} {item.name || ""}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Type: <span className="capitalize">{item.type}</span>
                </p>
                {item.year && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Year: {item.year}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Status:{" "}
                  <span
                    className={`${
                      item.status === "available"
                        ? "text-green-500"
                        : "text-red-500"
                    } font-medium`}
                  >
                    {item.status}
                  </span>
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">
                  Ksh {Number(item.selling_price || 0).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Inventory;
