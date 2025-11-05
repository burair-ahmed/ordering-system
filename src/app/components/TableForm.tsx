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

  const deliveryAreas = [
    "Gulistan-e-Johar (All Blocks)",
    "Johor Block 7",
    "Johor Block 8",
    "Johor Block 9",
    "Johor Block 10",
    "Dalmia Road",
    "Askari 4",
    "NHS Phase 1",
    "NHS Phase 2",
    "NHS Phase 3",
    "NHS Phase 4",
    "Scheme 33",
    "Saadi Town (All Areas)",
    "Malir Checkpost 5",
    "Malir Checkpost 6",
    "Malir (All Areas)",
    "Gulshan-e-Iqbal Block 1",
    "Gulshan-e-Iqbal Block 2",
    "Gulshan-e-Iqbal Block 3",
    "Gulshan-e-Iqbal Block 4",
    "Gulshan-e-Iqbal Block 5",
    "Gulshan-e-Iqbal Block 6",
    "Gulshan-e-Iqbal Block 7",
    "Gulshan-e-Iqbal Block 8",
    "Gulshan-e-Iqbal Block 9",
    "Gulshan-e-Iqbal Block 10",
    "Gulshan-e-Iqbal Block 11",
    "Gulshan-e-Iqbal Block 13",
    "Gulshan-e-Iqbal Block 14",
    "Gulshan-e-Iqbal Block 15",
    "Gulshan-e-Iqbal Block 16",
    "Gulshan-e-Iqbal Block 17",
    "Gulshan-e-Iqbal Block 18",
    "Gulshan-e-Iqbal Block 19",
    "FB Area (All Blocks)",
    "Shah Faisal Colony",
    "Bahadurabad (All Areas)",
    "Shahrah-e-Faisal (On Demand)",
  ];

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
        <h2 className="text-xl font-bold text-center mb-4 text-black">Select your order type</h2>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setOrderType("delivery")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              orderType === "delivery" ? "bg-purple-700 text-white" : "bg-gray-200 text-purple-700"
            }`}
          >
            Delivery
          </button>
          <button
            onClick={() => setOrderType("pickup")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              orderType === "pickup" ? "bg-purple-700 text-white" : "bg-gray-200 text-purple-700"
            }`}
          >
            Pickup
          </button>
          <button
            onClick={() => setOrderType("dinein")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              orderType === "dinein" ? "bg-purple-700 text-white" : "bg-gray-200 text-purple-700"
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
              className="border border-gray-300 bg-white text-black capitalize rounded-lg p-2 w-full"
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
              className="border border-gray-300 rounded-lg p-2 w-full text-black bg-white"
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
