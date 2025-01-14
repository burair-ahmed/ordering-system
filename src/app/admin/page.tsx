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

interface Option {
  name: string;
  uuid: string;
}

interface AdditionalChoice {
  heading: string;
  options: Option[];
}

interface Category {
  _id: string;
  categoryName: string;
  options: Option[]; // Defining the type of options as an array of Option objects
}

interface PlatterItem {
  _id: string;
  title: string;
  description: string;
  basePrice: number;
  platterCategory: string;
  image: string; // Base64 image string
  status: "in stock" | "out of stock";
  additionalChoices: AdditionalChoice[]; // Defining additionalChoices as an array of AdditionalChoice objects
  categories: Category[];  
}

const AdminDashboard: FC = () => {
  const [activeTab, setActiveTab] = useState("orders"); // Active tab state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Sidebar toggle state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // Menu items state
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null); // Selected menu item for editing
  const [selectedPlatterItem, setSelectedPlatterItem] = useState<PlatterItem | null>(null); // Selected platter item for editing
  const [showEditMenuItemModal, setShowEditMenuItemModal] = useState(false); // Edit menu item modal visibility
  const [showEditPlatterItemModal, setShowEditPlatterItemModal] = useState(false); // Edit platter item modal visibility
  const [platterItems, setPlatterItems] = useState<PlatterItem[]>([]);


    // States for the password overlay
    const [showPasswordOverlay, setShowPasswordOverlay] = useState(true);
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
  
    const correctPassword = "123-$CLK-Admin-$Panel-786"; // Hardcoded password
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

  // Open Edit Menu Item Modal
  const handleEditMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setShowEditMenuItemModal(true);
  };

  // Close Edit Menu Item Modal
  const handleCloseEditMenuItemModal = () => {
    setShowEditMenuItemModal(false);
    setSelectedMenuItem(null);
  };

  // Open Edit Platter Item Modal
  const handleEditPlatterItem = (item: PlatterItem) => {
    setSelectedPlatterItem(item);
    setShowEditPlatterItemModal(true);
  };

  // Close Edit Platter Item Modal
  const handleCloseEditPlatterItemModal = () => {
    setShowEditPlatterItemModal(false);
    setSelectedPlatterItem(null);
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


        // Handle password submission
        const handlePasswordSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (password === correctPassword) {
            setShowPasswordOverlay(false); // Hide overlay if correct password is entered
          } else {
            setErrorMessage("Incorrect password. Please try again.");
          }
        };

        useEffect(() => {
          if (showPasswordOverlay) {
            document.body.classList.add("overflow-hidden");
          } else {
            document.body.classList.remove("overflow-hidden");
          }
          // Cleanup to avoid side effects
          return () => {
            document.body.classList.remove("overflow-hidden");
          };
        }, [showPasswordOverlay]);
  return (
    <div className="flex h-screen">

            {/* Password Overlay */}
            {showPasswordOverlay && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-2xl font-bold mb-4">Enter Password</h2>
      <form onSubmit={handlePasswordSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full mb-4"
          placeholder="Enter password"
        />
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full"
        >
          Submit
        </button>
      </form>
    </div>
  </div>
)}


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
              activeTab === "addplatter" ? "text-gray-300" : "hover:text-gray-300"
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
                      <Image src={item.image} alt={item.title} width={100} height={100} />
                    </div>
                    <h3 className="text-xl font-semibold text-[#741052]">{item.title}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                      onClick={() => handleEditMenuItem(item)}
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
                      <Image src={item.image} alt={item.title} width={100} height={100} />
                    </div>
                    <h3 className="text-xl font-semibold text-[#741052]">{item.title}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                      onClick={() => handleEditPlatterItem(item)}
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
        {activeTab === "completedOrders" && <CompletedOrders />}
        {activeTab === "analytics" && <AnalyticsPage />}
        {activeTab === "settings" && <div>Settings Content</div>}

        {/* Edit Menu Item Modal */}
        {showEditMenuItemModal && selectedMenuItem && (
          <EditMenuItemForm
            item={selectedMenuItem}
            onClose={handleCloseEditMenuItemModal}
            onUpdate={refreshMenuItems}
          />
        )}

        {/* Edit Platter Item Modal */}
        {showEditPlatterItemModal && selectedPlatterItem && (
          <EditPlatterForm
            item={selectedPlatterItem}
            onClose={handleCloseEditPlatterItemModal}
            onUpdate={refreshPlatterItems}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
