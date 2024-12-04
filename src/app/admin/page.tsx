'use client';

import { FC, useState } from "react";
import OrdersList from "../components/OrdersList";
import AddMenuItemForm from "../components/MenuItemForm";
import { FiMenu, FiList, FiSettings, FiPlus } from "react-icons/fi"; // Icons

const AdminDashboard: FC = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Collapsed by default

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarCollapsed ? "w-16" : "w-64"
        } bg-[#741052] text-white p-6 space-y-6 transition-all duration-300 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h1 className="text-2xl font-extrabold">Admin</h1>
          )}
          <button
            className="text-white focus:outline-none"
            onClick={toggleSidebar}
          >
            <FiMenu size={24} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="space-y-4">
          <button
            className={`flex items-center gap-2 ${
              activeTab === "orders" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("orders")}
          >
            <FiList size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>
              Orders
            </span>
          </button>
          <button
            className={`flex items-center gap-2 ${
              activeTab === "menu" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("menu")}
          >
            <FiList size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>
              Menu Items
            </span>
          </button>
          <button
            className={`flex items-center gap-2 ${
              activeTab === "addmenu" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("addmenu")}
          >
            <FiPlus size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>
              Add Menu Item
            </span>
          </button>
          <button
            className={`flex items-center gap-2 ${
              activeTab === "settings" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("settings")}
          >
            <FiSettings size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>
              Settings
            </span>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-3xl font-extrabold text-[#741052] mb-8">
          Admin Dashboard
        </h1>

        {activeTab === "orders" && (
          <>
            <h2 className="text-2xl font-semibold text-[#741052] mb-4">
              Order Management
            </h2>
            <OrdersList />
          </>
        )}
        {activeTab === "menu" && (
          <div>
            <h2>Menu Management</h2>
          </div>
        )}
        {activeTab === "addmenu" && (
          <div>
            <AddMenuItemForm />
          </div>
        )}
        {activeTab === "settings" && (
          <div>
            <h2>Settings</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
