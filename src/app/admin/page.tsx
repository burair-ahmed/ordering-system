'use client';

import { FC, useState, useEffect } from "react";
import OrdersList from "../components/OrdersList";
import AddMenuItemForm from "../components/MenuItemForm";
import TableManagement from "../components/TableManagement";
import { FiMenu, FiList, FiSettings, FiPlus, FiTable, FiBarChart } from "react-icons/fi";
import AnalyticsPage from "../components/Analytics";
import Image from "next/image";

const AdminDashboard: FC = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [menuItems, setMenuItems] = useState<any[]>([]); // State to store menu items

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('/api/getitems');
        const data = await response.json();
        setMenuItems(data); // Store the fetched menu items
      } catch (error) {
        console.error("Error fetching menu items:", error);
      }
    };

    if (activeTab === 'menu') {
      fetchMenuItems(); // Fetch menu items when the "Menu Items" tab is selected
    }
  }, [activeTab]); // Only fetch when the "Menu Items" tab is active

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen -mb-[1em] -mt-[3em]">
      {/* Sidebar */}
      <div
        className={`${isSidebarCollapsed ? "w-16" : "w-64"} bg-[#741052] text-white p-6 space-y-6 transition-all duration-300 flex flex-col`}
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
            className={`flex items-center gap-2 ${activeTab === "orders" ? "text-gray-300" : "hover:text-gray-300"}`}
            onClick={() => handleTabClick("orders")}
          >
            <FiList size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Orders</span>
          </button>
          <button
            className={`flex items-center gap-2 ${activeTab === "menu" ? "text-gray-300" : "hover:text-gray-300"}`}
            onClick={() => handleTabClick("menu")}
          >
            <FiList size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Menu Items</span>
          </button>
          <button
            className={`flex items-center gap-2 ${activeTab === "addmenu" ? "text-gray-300" : "hover:text-gray-300"}`}
            onClick={() => handleTabClick("addmenu")}
          >
            <FiPlus size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Add Menu Item</span>
          </button>
          <button
            className={`flex items-center gap-2 ${activeTab === "tables" ? "text-gray-300" : "hover:text-gray-300"}`}
            onClick={() => handleTabClick("tables")}
          >
            <FiTable size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Table Management</span>
          </button>
          <button
            className={`flex items-center gap-2 ${activeTab === "analytics" ? "text-gray-300" : "hover:text-gray-300"}`}
            onClick={() => handleTabClick("analytics")}
          >
            <FiBarChart size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Analytics</span>
          </button>
          <button
            className={`flex items-center gap-2 ${activeTab === "settings" ? "text-gray-300" : "hover:text-gray-300"}`}
            onClick={() => handleTabClick("settings")}
          >
            <FiSettings size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Settings</span>
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
            <h2 className="text-2xl font-semibold text-[#741052] mb-4">Menu Management</h2>
            {/* Render list of menu items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.length > 0 ? (
                menuItems.map((item) => (
                  <div key={item._id} className="border p-4 rounded-lg shadow-md">
                    <div className="flex justify-center mb-4">
                      <Image
                        src={item.image || "/fallback-image.jpg"}
                        alt={item.name || "Menu Item Image"}
                        width={150}
                        height={150}
                        className="rounded-md"
                      />
                    </div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="font-bold mt-2">Price: Rs.{item.price}</p>
                    {item.variations && item.variations.length > 0 && (
                      <div className="mt-2">
                        <h4 className="font-semibold">Variations:</h4>
                        <ul className="list-disc pl-4">
                          {item.variations.map((variation: { name: string; price: number }, index: number) => (
                            <li key={index}>
                              {variation.name} (+Rs.{variation.price})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Category: {item.category}</p>
                    <p className="text-xs text-gray-500">Created: {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <p>No menu items available.</p>
              )}
            </div>
          </div>
        )}
        {activeTab === "addmenu" && (
          <div>
            <AddMenuItemForm />
          </div>
        )}
        {activeTab === "tables" && (
          <div>
            <h2 className="text-2xl font-semibold text-[#741052] mb-4">Table Management</h2>
            <TableManagement />
          </div>
        )}
        {activeTab === "analytics" && (
          <div>
            <h2 className="text-2xl font-semibold text-[#741052] mb-4">Analytics</h2>
            <AnalyticsPage />
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
