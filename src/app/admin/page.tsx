// src/pages/admin-dashboard.tsx
'use client';

import { FC, useState } from "react";
import OrdersList from "../components/OrdersList";

const AdminDashboard: FC = () => {
  const [activeTab, setActiveTab] = useState("orders");

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-[#741052] text-white p-6 space-y-6">
        <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
        <nav className="space-y-4">
          <button
            className={`block text-xl font-semibold hover:text-gray-300 ${activeTab === 'orders' ? 'text-gray-300' : ''}`}
            onClick={() => handleTabClick("orders")}
          >
            Orders
          </button>
          <button
            className={`block text-xl font-semibold hover:text-gray-300 ${activeTab === 'menu' ? 'text-gray-300' : ''}`}
            onClick={() => handleTabClick("menu")}
          >
            Menu Items
          </button>
          <button
            className={`block text-xl font-semibold hover:text-gray-300 ${activeTab === 'customers' ? 'text-gray-300' : ''}`}
            onClick={() => handleTabClick("customers")}
          >
            Customers
          </button>
          <button
            className={`block text-xl font-semibold hover:text-gray-300 ${activeTab === 'settings' ? 'text-gray-300' : ''}`}
            onClick={() => handleTabClick("settings")}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-3xl font-extrabold text-[#741052] mb-8">Admin Dashboard</h1>
        
        {activeTab === "orders" && (
          <>
            <h2 className="text-2xl font-semibold text-[#741052] mb-4">Order Management</h2>
            <OrdersList />
          </>
        )}
        {activeTab === "menu" && (
          <div>
            {/* Menu management content goes here */}
            <h2>Menu Management</h2>
          </div>
        )}
        {activeTab === "customers" && (
          <div>
            {/* Customer management content goes here */}
            <h2>Customers</h2>
          </div>
        )}
        {activeTab === "settings" && (
          <div>
            {/* Settings content goes here */}
            <h2>Settings</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
