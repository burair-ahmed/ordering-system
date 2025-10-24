/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { FC, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  CreditCard,
  Utensils,
  MapPin,
  Tag,
  ChevronDown,
  ChevronUp,
  Box,
} from "lucide-react";
import Preloader from "../components/Preloader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BRAND_COLOR = "#741052";
const BRAND_GRADIENT = "from-[#741052] via-fuchsia-600 to-pink-600";

interface Item {
  id: string;
  title: string;
  quantity: number;
  price: number;
  variations?: { name: string; value: string }[] | string[];
}

export type OrderType = "dinein" | "pickup" | "delivery";

interface Order {
  orderNumber: string;
  customerName: string;
  email: string;
  area?: string;
  phone?: string;
  tableNumber?: string;
  ordertype: OrderType;
  status: string;
  paymentMethod: string;
  items: Item[];
  totalAmount: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  Completed: "bg-green-100/80 text-green-800",
  Pending: "bg-yellow-100/80 text-yellow-800",
  "In Progress": "bg-orange-100/80 text-orange-800",
  Cancelled: "bg-red-100/80 text-red-800",
  Received: "bg-purple-100/80 text-purple-800",
};

const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

  // 🎵 Audio setup
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
      console.error("AudioContext error:", error);
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

  // 🔄 Fetch Orders
  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (response.ok) {
        const newOrders = data.orders || [];
        const previousOrders = previousOrdersRef.current;

        const isNewOrder =
          newOrders.length > previousOrders.length ||
          newOrders.some(
            (o: Order) =>
              !previousOrders.some(
                (p) => p.orderNumber === o.orderNumber
              )
          );

        if (isNewOrder) playNotificationSound();

        setOrders(newOrders);
        previousOrdersRef.current = newOrders;
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔁 Update Status
  const updateOrderStatus = async (orderNumber: string, status: string) => {
    setLoadingOrders((prev) => new Set(prev.add(orderNumber)));
    try {
      await fetch("/api/updateorderstatus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status }),
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders((prev) => {
        const u = new Set(prev);
        u.delete(orderNumber);
        return u;
      });
    }
  };

  // ⬇️ Toggle expand
const toggleExpand = (orderNumber: string) => {
  setExpandedOrders((prev) => {
    const updated = new Set(prev);
    if (updated.has(orderNumber)) {
      updated.delete(orderNumber);
    } else {
      updated.add(orderNumber);
    }
    return updated;
  });
};

  return (
    <div className="p-6">
      {/* 🔔 Enable Sound Dialog */}
{!audioInitialized && (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="w-full max-w-md"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 16 }}
    >
      <Card className="border-0 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600 to-pink-600">
            <Box className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Enable Order Notifications</CardTitle>
          <CardDescription>Allow short sounds when new orders arrive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Enable Sound Alerts</span>
              <input
                type="checkbox"
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
                className="accent-fuchsia-600 w-4 h-4"
              />
            </label>

            <Button
              onClick={initializeAudioContext}
              disabled={!checkboxChecked}
              className={`h-11 w-full ${
                checkboxChecked
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:opacity-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Enable Sound
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </motion.div>
)}


      {/* 🧾 Orders Grid */}
      <div className="max-h-[500px] overflow-y-auto pr-2 pb-2 pl-2 pt-2 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-center py-12">
              <div
                className={`w-20 h-20 rounded-xl flex items-center justify-center bg-gradient-to-br ${BRAND_GRADIENT} text-white shadow-lg`}
              >
                <Tag size={36} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-black dark:text-neutral-200">
                No new orders yet.
              </h3>
              <p className="text-sm text-black/70 dark:text-neutral-400">
                Orders will appear here when received.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {orders.map((order) => (
                <motion.div
                  key={order.orderNumber}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="relative rounded-2xl border border-white/10 bg-white/10 dark:bg-neutral-900/30 backdrop-blur-md p-4 shadow-[0_8px_30px_rgba(116,16,82,0.1)] hover:scale-[1.02] transition-all"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2
                        className="text-base font-semibold"
                        style={{ color: BRAND_COLOR }}
                      >
                        Order #{order.orderNumber}
                      </h2>
                      <p className="text-xs text-black/60 dark:text-neutral-400">
                        {timeAgo(order.createdAt)}
                      </p>
                    </div>
                    <Badge
                      className={`${statusColors[order.status] || "bg-gray-100 text-gray-800"} rounded-full px-3 py-1 text-xs`}
                    >
                      {order.status}
                    </Badge>
                  </div>

                  {/* Customer Info */}
                  <div className="mt-4 text-sm text-black dark:text-neutral-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-pink-500" />
                      <span className="font-medium">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-pink-500" />
                      <span>{order.email}</span>
                    </div>

                    {order.ordertype === "dinein" && order.tableNumber && (
                      <div className="flex items-center gap-2">
                        <Utensils size={14} className="text-pink-500" />
                        <span>Table {order.tableNumber}</span>
                      </div>
                    )}
                    {order.ordertype === "pickup" && (
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-pink-500" />
                        <span>Pickup Order</span>
                      </div>
                    )}
                    {order.ordertype === "delivery" && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-pink-500" />
                        <span>
                          {order.area} — {order.phone}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className="text-pink-500" />
                      <span>{order.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-4 border-t border-white/10 pt-3">
                    <button
                      onClick={() => toggleExpand(order.orderNumber)}
                      className="w-full flex justify-between items-center text-sm font-medium text-[#741052] hover:text-pink-600 transition"
                    >
                      Items ({order.items.length})
                      {expandedOrders.has(order.orderNumber) ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedOrders.has(order.orderNumber) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="mt-3 space-y-2"
                        >
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2"
                            >
                              <div>
                                <p className="font-medium text-black dark:text-neutral-100">
                                  {item.title} × {item.quantity}
                                </p>
                                {item.variations && (
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {item.variations.map((v, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-fuchsia-600/20 text-pink-600"
                                      >
                                        {typeof v === "string"
                                          ? v
                                          : `${v.name}: ${v.value}`}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p
                                className="font-semibold"
                                style={{ color: BRAND_COLOR }}
                              >
                                Rs. {item.price * item.quantity}
                              </p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex justify-between items-center border-t border-white/10 pt-3">
                    <p
                      className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#741052] to-pink-600"
                    >
                      Rs. {order.totalAmount}
                    </p>
                    <Select
                      defaultValue={order.status}
                      onValueChange={(val) =>
                        updateOrderStatus(order.orderNumber, val)
                      }
                    >
                      <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-black dark:text-neutral-100 focus:ring-[#741052]/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Received">Received</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {loadingOrders.has(order.orderNumber) && (
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                      <Preloader />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersList;
