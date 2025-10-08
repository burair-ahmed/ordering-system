/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-expressions */

"use client";

import { FC, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // shadcn/ui select
import { Badge } from "@/components/ui/badge"; // shadcn/ui badge
import {
  User,
  Mail,
  CreditCard,
  Utensils,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Preloader from "../components/Preloader";

interface Item {
  id: string;
  title: string;
  quantity: number;
  price: number;
  variations?: { name: string; value: string }[] | string[];
}

interface Order {
  orderNumber: string;
  customerName: string;
  email: string;
  tableNumber: string;
  status: string;
  paymentMethod: string;
  items: Item[];
  totalAmount: number;
}

const statusColors: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-orange-100 text-orange-700",
  Cancelled: "bg-red-100 text-red-700",
};

const OrdersList: FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const previousOrdersRef = useRef<Order[]>([]);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  // ✅ Audio setup
  const initializeAudioContext = async () => {
    try {
      const audioContext = new AudioContext();
      const response = await fetch("/notification/notification.mp3");
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContextRef.current = audioContext;
      audioBufferRef.current = audioBuffer;
      setAudioInitialized(true);
    } catch (error) {
      console.error("Error initializing AudioContext:", error);
    }
  };

  const playNotificationSound = () => {
    if (audioContextRef.current && audioBufferRef.current) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    }
  };

  // ✅ Fetch Orders
  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (response.ok) {
        const newOrders = data.orders || [];
        const previousOrders = previousOrdersRef.current;

        // Detect new orders
        if (
          newOrders.length > previousOrders.length ||
          newOrders.some(
            (order: Order) =>
              !previousOrders.some(
                (prevOrder) => prevOrder.orderNumber === order.orderNumber
              )
          )
        ) {
          playNotificationSound();
        }

        setOrders(newOrders.filter((o: Order) => o.status !== "Completed"));
        previousOrdersRef.current = newOrders;
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Update status
  const updateOrderStatus = async (orderNumber: string, status: string) => {
    setLoadingOrders((prev) => new Set(prev.add(orderNumber)));
    try {
      const response = await fetch("/api/updateorderstatus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status }),
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setLoadingOrders((prev) => {
        const updated = new Set(prev);
        updated.delete(orderNumber);
        return updated;
      });
    }
  };

  // ✅ Toggle expand
  const toggleExpand = (orderNumber: string) => {
    setExpandedOrders((prev) => {
      const updated = new Set(prev);
      updated.has(orderNumber)
        ? updated.delete(orderNumber)
        : updated.add(orderNumber);
      return updated;
    });
  };

  return (
    <div className="p-4">
      {/* 🔔 Enable Sound Modal */}
      {!audioInitialized && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 dark:bg-gray-900/90 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🔔 Enable Notification Sound
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Allow sound alerts when new orders arrive.
            </p>
            <div className="flex items-center justify-center space-x-3">
              <input
                type="checkbox"
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
                className="w-5 h-5 accent-[#741052]"
              />
              <span className="text-gray-800 dark:text-gray-200">
                I agree to enable notification sound
              </span>
            </div>
            <button
              onClick={initializeAudioContext}
              disabled={!checkboxChecked}
              className={`w-full px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                checkboxChecked
                  ? "bg-gradient-to-r from-[#741052] to-pink-600 text-white hover:opacity-90 shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Enable Sound
            </button>
          </div>
        </div>
      )}

      {/* ✅ Orders Grid */}
      <div className="max-h-[500px] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {orders.length === 0 ? (
            <p className="text-xl text-gray-600 text-center">No orders yet.</p>
          ) : (
            orders.map((order) => (
              <motion.div
                key={order.orderNumber}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-[#741052] bg-white dark:bg-neutral-900 shadow-md hover:shadow-xl hover:border-[#d0269b] hover:scale-[1.02] transition-all"
              >
                {/* Card Header */}
                <div className="flex justify-between items-center p-4 border-b">
                  <h2 className="text-xl font-bold text-[#741052]">
                    Order #{order.orderNumber}
                  </h2>
                  <Badge
                    className={`${statusColors[order.status]} rounded-full px-3 py-1 text-sm`}
                  >
                    {order.status}
                  </Badge>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4 p-4 text-gray-700 dark:text-gray-300">
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <User size={14} /> Customer
                    </p>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                      <Mail size={14} /> Email
                    </p>
                    <p className="font-medium">{order.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Utensils size={14} /> Table
                    </p>
                    <p className="font-medium">{order.tableNumber}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                      <CreditCard size={14} /> Payment
                    </p>
                    <p className="font-medium">{order.paymentMethod}</p>
                  </div>
                </div>

                {/* Items Section */}
                <div className="p-4 border-t">
                  <button
                    onClick={() => toggleExpand(order.orderNumber)}
                    className="flex justify-between w-full items-center text-sm font-semibold text-[#741052] hover:text-[#d0269b]"
                  >
                    Items ({order.items.length})
                    {expandedOrders.has(order.orderNumber) ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>

                  {expandedOrders.has(order.orderNumber) && (
                    <div className="mt-3 space-y-2">
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">
                              {item.title} × {item.quantity}
                            </p>
                            {item.variations && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {item.variations.map((variation, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-[#d0269b] text-white text-xs px-2 py-1 rounded-full"
                                  >
                                    {typeof variation === "string"
                                      ? variation
                                      : `${variation.name}: ${variation.value}`}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="font-semibold text-[#741052]">
                            Rs. {item.price * item.quantity}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-4 border-t">
                  <p className="text-lg font-bold text-[#741052]">
                    Rs. {order.totalAmount}
                  </p>
                  <Select
                    defaultValue={order.status}
                    onValueChange={(val) =>
                      updateOrderStatus(order.orderNumber, val)
                    }
                  >
                    <SelectTrigger className="w-[160px] border-[#741052] focus:ring-[#741052]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loadingOrders.has(order.orderNumber) && <Preloader />}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersList;
