'use client';

import { FC, useState, useEffect } from "react";
import OrdersList from "../components/OrdersList";
import AddMenuItemForm from "../components/MenuItemForm";
import EditMenuItemForm from "../components/EditMenuItemForm";
import TableManagement from "../components/TableManagement";
import AnalyticsPage from "../components/Analytics";
import CompletedOrders from "../components/CompletedOrders"; // Import Completed Orders Component
import { FiMenu, FiList, FiSettings, FiPlus, FiTable, FiBarChart, FiArchive } from "react-icons/fi";
import Image from "next/image";
import AddPlatterForm from "../components/AddPlatterForm";
import EditPlatterForm from "../components/EditPlatterForm";


interface Variation {
  name: string;
  price: number;
}

interface MenuItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  variations: Variation[];
  status: "in stock" | "out of stock";
}
interface PlatterItem {
  _id: string;
  title: string;
  description: string;
  basePrice: number;
  platterCategory: string;
  image: string; // Base64 image string
  status: "in stock" | "out of stock";
  additionalChoices: any[];
  categories: Category[];  
}
interface Category {
  _id: string;
  categoryName: string;   // Ensure this property exists
  options: any[];         // Ensure this property exists (options could be an array of additional choices or something else)
}

const AdminDashboard: FC = () => {
  const [activeTab, setActiveTab] = useState("orders"); // Active tab state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Sidebar toggle state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // Menu items state
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null); // Selected menu item for editing
  const [showEditModal, setShowEditModal] = useState(false); // Edit modal visibility
  const [platterItems, setPlatterItems] = useState<PlatterItem[]>([]);
  const [selectedPlatterItem, setSelectedPlatterItem] = useState<PlatterItem | null>(null);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('/api/getitemsadmin');
        const data: MenuItem[] = await response.json();
        setMenuItems(data); // Store fetched menu items
      } catch (error) {
        console.error("Error fetching menu items:", error);
      }
    };

    if (activeTab === 'menu') {
      fetchMenuItems();
    }
  }, [activeTab]);

  // Handle tab switching
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  // Sidebar toggle
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Open Edit Modal
  const handleEditItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setShowEditModal(true);
  };

  // Close Edit Modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedMenuItem(null);
  };

  // Refresh Menu Items
  const refreshMenuItems = async () => {
    try {
      const response = await fetch('/api/getitemsadmin');
      const data: MenuItem[] = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error("Error refreshing menu items:", error);
    }
  };
    // Refresh Platter Items after update
    const refreshPlatterItems = async () => {
      try {
        const response = await fetch("/api/platteradmin");
        const data: PlatterItem[] = await response.json();
        setPlatterItems(data);
      } catch (error) {
        console.error("Error refreshing platter items:", error);
      }
    };
  // Handle Edit Button Click
  const handleEditPlatter = (item: PlatterItem) => {
    setSelectedPlatterItem(item);
    setShowEditModal(true);
  };

    // Fetch Platter Items from API
    useEffect(() => {
      const fetchPlatterItems = async () => {
        try {
          const response = await fetch("/api/platteradmin"); // Endpoint to fetch platters
          const data: PlatterItem[] = await response.json();
          setPlatterItems(data);
        } catch (error) {
          console.error("Error fetching platter items:", error);
        }
      };
  
      if (activeTab === "platter") {
        fetchPlatterItems();
      }
    }, [activeTab]);

    

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarCollapsed ? "w-16" : "w-64"
        } bg-[#741052] text-white pl-4 pt-4 space-y-6 transition-all duration-300 flex flex-col `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between">
          {!isSidebarCollapsed && <h1 className="text-2xl font-extrabold">Admin</h1>}
          <button className="text-white focus:outline-none" onClick={toggleSidebar}>
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
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Orders</span>
          </button>
          <button
            className={`flex items-center gap-2 ${
              activeTab === "menu" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("menu")}
          >
            <FiList size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Menu Items</span>
          </button>
          <button
            className={`flex items-center gap-2 ${
              activeTab === "platter" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("platter")}
          >
            <FiList size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Platter Items</span>
          </button>
          <button
            className={`flex items-center gap-2 ${
              activeTab === "addmenu" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("addmenu")}
          >
            <FiPlus size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Add Menu Item</span>
          </button>
          <button
            className={`flex items-center gap-2 ${
              activeTab === "addmenu" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("addplatter")}
          >
            <FiPlus size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Add Platter</span>
          </button>
          <button
            className={`flex items-center gap-2 ${
              activeTab === "tables" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("tables")}
          >
            <FiTable size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Table Management</span>
          </button>
          <button
            className={`flex items-center gap-2 ${
              activeTab === "completedOrders" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("completedOrders")}
          >
            <FiArchive size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Completed Orders</span>
          </button>
          <button
            className={`flex items-center gap-2 ${
              activeTab === "analytics" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("analytics")}
          >
            <FiBarChart size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Analytics</span>
          </button>
          <button
            className={`flex items-center gap-2 ${
              activeTab === "settings" ? "text-gray-300" : "hover:text-gray-300"
            }`}
            onClick={() => handleTabClick("settings")}
          >
            <FiSettings size={20} />
            <span className={`${isSidebarCollapsed ? "hidden" : "block"}`}>Settings</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-3xl font-extrabold text-[#741052] mb-8">Admin Dashboard</h1>

        {/* Active Tab Rendering */}
        {activeTab === "orders" && (
          <>
            <h2 className="text-2xl font-semibold text-[#741052] mb-4">Order Management</h2>
            <OrdersList />
          </>
        )}
        {activeTab === "menu" && (
          <div>
            <h2 className="text-2xl font-semibold text-[#741052] mb-4">Menu Management</h2>
            {/* Menu Items List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.length > 0 ? (
                menuItems.map((item) => (
                  <div key={item._id} className="border p-4 rounded-lg shadow-md">
                    <div className="flex justify-center mb-4">
                      <Image
                        src={item.image || "/fallback-image.jpg"}
                        alt={item.title || "Menu Item"}
                        width={150}
                        height={150}
                        className="rounded-md"
                      />
                    </div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="font-bold mt-2">Price: Rs.{item.price}</p>
                    <p className="text-xs text-gray-500 mt-2">Category: {item.category}</p>
                    <button
                      onClick={() => handleEditItem(item)}
                      className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  </div>
                ))
              ) : (
                <p>No menu items available.</p>
              )}
            </div>
          </div>
        )}
         {activeTab === "platter" && (
        <div>
          <h2 className="text-2xl font-semibold text-[#741052] mb-4">Platter Management</h2>
          {/* Platter Items List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platterItems.length > 0 ? (
              platterItems.map((item) => (
                <div key={item._id} className="border p-4 rounded-lg shadow-md">
                  <div className="flex justify-center mb-4">
                    <Image
                      src={item.image || "/fallback-image.jpg"}
                      alt={item.title || "Platter Item"}
                      width={150}
                      height={150}
                      className="rounded-md"
                    />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <p className="font-bold mt-2">Price: Rs.{item.basePrice}</p>
                  <p className="text-xs text-gray-500 mt-2">Category: {item.platterCategory}</p>
                  <button
                    onClick={() => handleEditPlatter(item)}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Edit
                  </button>
                </div>
              ))
            ) : (
              <p>No platter items available.</p>
            )}
          </div>
        </div>
      )}

        {activeTab === "addmenu" && <AddMenuItemForm />}
        {activeTab === "addplatter" && <AddPlatterForm/>}
        {activeTab === "tables" && <TableManagement />}
        {activeTab === "completedOrders" && (
          <div>
            <h2 className="text-2xl font-semibold text-[#741052] mb-4">Completed Orders</h2>
            <CompletedOrders />
          </div>
        )}
        {activeTab === "analytics" && <AnalyticsPage />}
        {activeTab === "settings" && <div>Settings</div>}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedMenuItem && (
        <EditMenuItemForm
          item={selectedMenuItem}
          onClose={handleCloseEditModal}
          onUpdate={refreshMenuItems}
        />
      )} {showEditModal && selectedPlatterItem && (
        <EditPlatterForm
          item={selectedPlatterItem}
          onClose={handleCloseEditModal}
          onUpdate={refreshPlatterItems}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
