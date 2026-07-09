import React from "react";

const CashierDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Cashier Dashboard</h1>
        <p className="text-gray-600 mb-4">
          Welcome, <span className="font-semibold">{user?.username}</span> 👋
        </p>
        <div className="space-y-3">
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            Record Sale
          </button>
          <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
            View Sales History
          </button>
          <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
