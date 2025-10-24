/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "../context/OrderContext";

export default function OrderTypeModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [orderType, setOrderType] = useState<"delivery" | "pickup" | "dinein" | "">("");
  const [selectedArea, setSelectedArea] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const router = useRouter();
  const { setOrder } = useOrder();

  const deliveryAreas = ["DHA Phase 5", "Clifton", "PECHS", "Gulshan", "Nazimabad"];

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

    if (orderType === "delivery" && selectedArea) {
      setOrder({ orderType: "delivery", area: selectedArea });
      router.push(`/order?type=delivery&area=${encodeURIComponent(selectedArea)}`);
    } else if (orderType === "pickup") {
      setOrder({ orderType: "pickup" });
      router.push(`/order?type=pickup`);
    } else if (orderType === "dinein" && tableNumber) {
      setOrder({ orderType: "dinein", tableId: tableNumber });
      router.push(`/order?type=dinein&tableId=${encodeURIComponent(tableNumber)}`);
    }

    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Deep blur background */}
      <div
        className="absolute inset-0 backdrop-blur-lg bg-black/30"
        style={{
          filter: "blur(6px)",
        }}
      ></div>

      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-11/12 max-w-md p-6 z-10">
        <h2 className="text-xl font-bold text-center mb-4">Select your order type</h2>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setOrderType("delivery")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              orderType === "delivery" ? "bg-purple-700 text-white" : "bg-gray-200"
            }`}
          >
            Delivery
          </button>
          <button
            onClick={() => setOrderType("pickup")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              orderType === "pickup" ? "bg-purple-700 text-white" : "bg-gray-200"
            }`}
          >
            Pickup
          </button>
          <button
            onClick={() => setOrderType("dinein")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              orderType === "dinein" ? "bg-purple-700 text-white" : "bg-gray-200"
            }`}
          >
            Dine-In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
          {orderType === "delivery" && (
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              required
              className="border border-gray-300 rounded-lg p-2 w-full"
            >
              <option value="" disabled>Select your area</option>
              {deliveryAreas.map((area, idx) => (
                <option key={idx} value={area}>{area}</option>
              ))}
            </select>
          )}

          {orderType === "dinein" && (
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              required
              className="border border-gray-300 rounded-lg p-2 w-full"
            >
              <option value="" disabled>Choose a table</option>
              {generateTableOptions().map((table, idx) => (
                <option key={idx} value={table}>{table}</option>
              ))}
            </select>
          )}

          {orderType && (
            <button
              type="submit"
              className="w-full bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition"
            >
              Select
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
