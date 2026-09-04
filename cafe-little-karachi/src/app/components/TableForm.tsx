/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "../context/OrderContext";
import { X } from "lucide-react";
import {
  trackEvent,
  CLK_FUNNEL_LANDING,
  CLK_FUNNEL_MODE_SELECTED,
  CLK_FUNNEL_TABLE_SELECTED,
  trackClarityFunnelStep
} from "../lib/analytics";

export default function OrderTypeModal() {
  const router = useRouter();
  const {
    orderType: currentOrderType,
    area: currentArea,
    tableId: currentTableId,
    setOrder,
    isLocationModalOpen,
    setLocationModalOpen,
  } = useOrder();

  const [orderType, setOrderType] = useState<"delivery" | "pickup" | "dinein" | "">("");
  const [selectedArea, setSelectedArea] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Sync state with OrderContext when modal opens
  useEffect(() => {
    if (isLocationModalOpen) {
      if (currentOrderType) setOrderType(currentOrderType);
      if (currentArea) setSelectedArea(currentArea);
      if (currentTableId) setTableNumber(currentTableId);
    }
  }, [isLocationModalOpen, currentOrderType, currentArea, currentTableId]);

  // Stage 1: Customer landed on home page
  useEffect(() => {
    trackClarityFunnelStep(CLK_FUNNEL_LANDING);
    trackEvent('journey_landing', {});
  }, []);

  useEffect(() => {
    if (orderType === "delivery") {
      setLoadingAreas(true);
      fetch('/api/delivery-areas')
        .then((res) => res.json())
        .then((data) => {
          setDeliveryAreas(data);
          setLoadingAreas(false);
        })
        .catch((err) => {
          console.error("Failed to load delivery areas:", err);
          setLoadingAreas(false);
        });
    }
  }, [orderType]);

  const generateTableOptions = () => {
    const tables: string[] = [];
    for (let i = 1; i <= 30; i++) {
      tables.push(`${i}`);
      tables.push(`OT-${i}`);
    }
    return tables;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Stage 3: Mode confirmed + table/area selected
    trackEvent('journey_table_selected', {
      order_type: orderType,
      table: tableNumber,
      area: selectedArea,
    });

    // Save location state to OrderContext (persists to localStorage + Cookies)
    // No query params needed — the address bar stays clean!
    if (orderType === "delivery" && selectedArea) {
      setOrder({ orderType: "delivery", area: selectedArea });
    } else if (orderType === "pickup") {
      setOrder({ orderType: "pickup" });
    } else if (orderType === "dinein" && tableNumber) {
      setOrder({ orderType: "dinein", tableId: tableNumber });
    }

    setLocationModalOpen(false);
  };

  if (!isLocationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Deep blur background */}
      <div
        onClick={() => setLocationModalOpen(false)}
        className="absolute inset-0 backdrop-blur-md bg-black/40 transition-opacity"
      />

      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 border border-gray-100">
        {/* Close button */}
        <button
          onClick={() => setLocationModalOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          aria-label="Close location modal"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-center mb-1 text-black">
          Select Your Order Mode
        </h2>
        <p className="text-xs text-gray-500 text-center mb-6">
          Choose how you would like to enjoy your meal
        </p>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setOrderType("delivery");
              trackEvent('journey_mode_selected', { mode: 'delivery' });
            }}
            className={`py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
              orderType === "delivery"
                ? "bg-purple-700 text-white shadow-md shadow-purple-700/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Delivery
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderType("pickup");
              trackEvent('journey_mode_selected', { mode: 'pickup' });
            }}
            className={`py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
              orderType === "pickup"
                ? "bg-purple-700 text-white shadow-md shadow-purple-700/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pickup
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderType("dinein");
              trackEvent('journey_mode_selected', { mode: 'dinein' });
            }}
            className={`py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
              orderType === "dinein"
                ? "bg-purple-700 text-white shadow-md shadow-purple-700/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Dine-In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
          {orderType === "delivery" && (
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Select Delivery Area
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                required
                className="border border-gray-300 bg-white text-black rounded-xl p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="" disabled>
                  {loadingAreas ? "Loading delivery areas..." : "Choose your area"}
                </option>
                {deliveryAreas.map((area, idx) => (
                  <option key={area._id || idx} value={area.name} disabled={!area.isAvailable}>
                    {area.name} {area.isAvailable ? `(Rs. ${area.charge})` : "(Unavailable)"} {area.note ? ` - ${area.note}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {orderType === "dinein" && (
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Select Table Number
              </label>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
                className="border border-gray-300 rounded-xl p-3 w-full text-black bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="" disabled>
                  Choose a table
                </option>
                {generateTableOptions().map((table, idx) => (
                  <option key={idx} value={table}>
                    Table {table}
                  </option>
                ))}
              </select>
            </div>
          )}

          {orderType && (
            <button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-purple-700/25 transition-all mt-2"
            >
              Confirm Location
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
