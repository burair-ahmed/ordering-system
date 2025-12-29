/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Eye,
  X,
  Phone,
  MessageCircle,
  Download,
} from "lucide-react";
import Preloader from "../components/Preloader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

const BRAND_COLOR = "#C46A47"; // Chai Clay
const BRAND_GRADIENT = "from-[#C46A47] to-[#A65638]"; // Chai Gradient

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

interface FeedbackEntry {
  rating: number;
  comment: string;
  createdAt: string;
}

interface ConsentEntry {
  channel: string;
  consent: boolean;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  Completed: "bg-green-100/80 text-green-800",
  Received: "bg-yellow-100/80 text-yellow-800",
  Preparing: "bg-orange-100/80 text-orange-800",
  Ready: "bg-blue-100/80 text-blue-800",
  "Out for delivery": "bg-purple-100/80 text-purple-800",
  Cancelled: "bg-red-100/80 text-red-800",
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

interface OrdersListProps {
  audioContextRef?: React.RefObject<AudioContext | null>;
  audioBufferRef?: React.RefObject<AudioBuffer | null>;
  playNotificationSound?: () => void;
  audioInitialized?: boolean;
}

const OrdersList: FC<OrdersListProps> = ({
  audioContextRef: externalAudioContextRef,
  audioBufferRef: externalAudioBufferRef,
  playNotificationSound: externalPlayNotificationSound,
  audioInitialized: externalAudioInitialized = false
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const previousOrdersRef = useRef<Order[]>([]);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [consents, setConsents] = useState<ConsentEntry[]>([]);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [showAllConsents, setShowAllConsents] = useState<boolean>(false);

  // 🎵 Audio setup (using external context if provided)
  const playNotificationSound = () => {
    if (externalPlayNotificationSound) {
      externalPlayNotificationSound();
    } else if (audioContextRef.current && audioBufferRef.current) {
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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesType = typeFilter === "all" || order.ordertype === typeFilter;
      const matchesPayment =
        paymentFilter === "all" ||
        order.paymentMethod.toLowerCase() === paymentFilter.toLowerCase();
      const term = searchTerm.trim().toLowerCase();
      const matchesTerm =
        term.length === 0 ||
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        (order.phone || "").toLowerCase().includes(term);
      return matchesStatus && matchesType && matchesPayment && matchesTerm;
    });
  }, [orders, statusFilter, typeFilter, paymentFilter, searchTerm]);

  // Allowed transitions to reduce accidental jumps
  const allowedStatusMap: Record<string, string[]> = {
    Received: ["Received", "Preparing", "Ready", "Out for delivery", "Completed", "Cancelled"],
    Preparing: ["Preparing", "Ready", "Out for delivery", "Completed", "Cancelled"],
    Ready: ["Ready", "Out for delivery", "Completed", "Cancelled"],
    "Out for delivery": ["Out for delivery", "Ready", "Completed", "Cancelled"],
    Completed: ["Completed"],
    Cancelled: ["Cancelled"],
  };

  const safeUpdateStatus = (order: Order, next: string) => {
    const allowed = allowedStatusMap[order.status] || [];
    if (!allowed.includes(next)) {
      toast.error("Not allowed", {
        description: `Cannot move from ${order.status} to ${next}`,
      });
      return;
    }
    updateOrderStatus(order.orderNumber, next);
  };

  const openDetail = async (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      const [fbRes, consentRes] = await Promise.all([
        fetch(`/api/order-feedback?orderNumber=${order.orderNumber}`),
        fetch(`/api/notification-consent?orderNumber=${order.orderNumber}`),
      ]);
      if (fbRes.ok) {
        const fbJson = await fbRes.json();
        setFeedbackList(fbJson.feedback || []);
      } else {
        setFeedbackList([]);
      }
      if (consentRes.ok) {
        const cJson = await consentRes.json();
        setConsents(cJson.consents || []);
      } else {
        setConsents([]);
      }
    } catch (e) {
      setFeedbackList([]);
      setConsents([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedOrder(null);
    setFeedbackList([]);
    setConsents([]);
  };

  const downloadReceipt = (order: Order) => {
    const lines = [
      `Order: ${order.orderNumber}`,
      `Type: ${order.ordertype}`,
      order.tableNumber ? `Table: ${order.tableNumber}` : "",
      order.area ? `Area: ${order.area}` : "",
      order.phone ? `Phone: ${order.phone}` : "",
      `Payment: ${order.paymentMethod}`,
      `Status: ${order.status}`,
      "",
      "Items:",
      ...order.items.map(
        (it, idx) =>
          `${idx + 1}. ${it.title} x${it.quantity} @ Rs.${it.price} = Rs.${
            it.price * it.quantity
          }`
      ),
      "",
      `Total: Rs.${order.totalAmount}`,
    ]
      .filter(Boolean)
      .join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${order.orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">Search</p>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Order #, name, phone"
            className="h-10"
            aria-label="Search orders"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">Status</p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C46A47] rounded-xl" aria-label="Filter by status">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Preparing">Preparing</SelectItem>
              <SelectItem value="Ready">Ready</SelectItem>
              <SelectItem value="Out for delivery">Out for delivery</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">Order type</p>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as OrderType | "all")}>
            <SelectTrigger className="h-10 bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C46A47] rounded-xl" aria-label="Filter by order type">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="dinein">Dine-in</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">Payment</p>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="h-10 bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C46A47] rounded-xl" aria-label="Filter by payment method">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>
          </div>

      <div className="mt-2 flex gap-3 text-xs text-neutral-600">
        <span>{filteredOrders.length} showing</span>
        <button
          onClick={() => {
            setStatusFilter("all");
            setTypeFilter("all");
            setPaymentFilter("all");
            setSearchTerm("");
          }}
          className="underline text-[#C46A47] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C46A47]"
        >
          Clear filters
        </button>
          </div>


      {/* 🧾 Orders Grid */}
      <div className="max-h-[500px] overflow-y-auto lg:pr-2 lg:pb-2 lg:pl-2 lg:pt-2 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-center py-12">
              <div
                className={`lg:w-20 w-40 h-20 rounded-xl flex items-center justify-center bg-gradient-to-br ${BRAND_GRADIENT} text-white shadow-lg`}
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
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.orderNumber}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="relative rounded-2xl border border-white/10 bg-white/10 dark:bg-neutral-900/30 backdrop-blur-md p-4 shadow-lg hover:scale-[1.02] transition-all focus-within:ring-2 focus-within:ring-[#C46A47]/30"
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
                      <User size={14} className="text-[#C46A47]" />
                      <span className="font-medium">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-[#C46A47]" />
                      <span>{order.email}</span>
                    </div>

                    {order.ordertype === "dinein" && order.tableNumber && (
                      <div className="flex items-center gap-2">
                        <Utensils size={14} className="text-[#C46A47]" />
                        <span>Table {order.tableNumber}</span>
                      </div>
                    )}
                    {order.ordertype === "pickup" && (
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-[#C46A47]" />
                        <span>Pickup Order</span>
                      </div>
                    )}
                    {order.ordertype === "delivery" && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#C46A47]" />
                        <span>
                          {order.area} — {order.phone}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className="text-[#C46A47]" />
                      <span>{order.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-4 border-t border-white/10 pt-3">
                    <button
                      onClick={() => toggleExpand(order.orderNumber)}
                      className="w-full flex justify-between items-center text-sm font-medium text-[#C46A47] hover:opacity-80 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C46A47]"
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
                                      className="text-xs px-2 py-1 rounded-full bg-[#C46A47]/10 text-[#C46A47]"
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
                  <div className="mt-4 flex justify-between items-center border-t border-white/10 pt-3 gap-2">
                    <p
                      className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#C46A47] to-[#A65638]"
                    >
                      Rs. {order.totalAmount}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetail(order)}
                        className="h-9 w-9"
                        aria-label={`Open details for order ${order.orderNumber}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    <Select
                      defaultValue={order.status}
                    onValueChange={(val) => safeUpdateStatus(order, val)}
                    >
                    <SelectTrigger className="w-[200px] bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C46A47] rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Received">Received</SelectItem>
                      <SelectItem value="Preparing">Preparing</SelectItem>
                      <SelectItem value="Ready">Ready</SelectItem>
                      <SelectItem value="Out for delivery">Out for delivery</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
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

      {/* Detail Modal */}
      <AnimatePresence>
        {detailOpen && selectedOrder && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-[#C46A47] to-[#A65638] rounded-t-3xl p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm opacity-90 mb-1">Order Details</p>
                    <h2 className="text-2xl font-bold mb-1">
                      #{selectedOrder.orderNumber}
                    </h2>
                    <p className="text-sm opacity-80">{timeAgo(selectedOrder.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`${statusColors[selectedOrder.status] || "bg-white/20 text-white"} rounded-full px-4 py-2 text-sm font-medium border-0`}
                    >
                      {selectedOrder.status}
                    </Badge>
                    <button
                      onClick={closeDetail}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                      aria-label="Close details"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Customer & Order Info Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200">
                    <h3 className="text-xl font-semibold text-[#C46A47] mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#C46A47] to-[#A65638] flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
                          <p className="text-sm text-gray-600">{selectedOrder.email || "No email provided"}</p>
                        </div>
                      </div>
                      {selectedOrder.phone && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#C46A47] to-[#A65638] flex items-center justify-center">
                            <Phone className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{selectedOrder.phone}</p>
                            <p className="text-sm text-gray-600">Phone number</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Information */}
                  <div className="bg-gradient-to-br from-orange-50 to-[#C46A47]/5 rounded-2xl p-5 border border-orange-200">
                    <h3 className="text-xl font-semibold text-[#C46A47] mb-4 flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Order Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#C46A47] to-[#A65638] flex items-center justify-center">
                          <Utensils className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{selectedOrder.ordertype}</p>
                          <p className="text-sm text-gray-600">Order type</p>
                        </div>
                      </div>
                      {selectedOrder.tableNumber && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#C46A47] to-[#A65638] flex items-center justify-center">
                            <Utensils className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Table {selectedOrder.tableNumber}</p>
                            <p className="text-sm text-gray-600">Table number</p>
                          </div>
                        </div>
                      )}
                      {selectedOrder.area && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#C46A47] to-[#A65638] flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{selectedOrder.area}</p>
                            <p className="text-sm text-gray-600">Delivery area</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions & Status Update */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-orange-50 to-[#C46A47]/5 rounded-2xl p-5 border border-orange-100">
                    <h3 className="text-xl font-semibold text-[#C46A47] mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {selectedOrder.phone && (
                        <Button
                          onClick={() => window.open(`tel:${selectedOrder.phone}`, "_blank")}
                          className="bg-gradient-to-r from-[#C46A47] to-[#A65638] text-white font-semibold px-4 py-3 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2 h-auto"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </Button>
                      )}
                      {selectedOrder.phone && (
                        <Button
                          onClick={() =>
                            window.open(
                              `https://wa.me/${selectedOrder.phone}?text=Hello%20regarding%20order%20${selectedOrder.orderNumber}`,
                              "_blank"
                            )
                          }
                          className="bg-gradient-to-r from-[#C46A47] to-[#A65638] text-white font-semibold px-4 py-3 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2 h-auto"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </Button>
                      )}
                        <Button
                          onClick={() => downloadReceipt(selectedOrder)}
                          className="bg-white border-2 border-[#C46A47] text-[#C46A47] font-semibold px-4 py-3 rounded-xl hover:bg-[#C46A47] hover:text-white transition-all duration-200 flex items-center gap-2 h-auto"
                        >
                        <Download className="h-4 w-4" />
                        Receipt
                      </Button>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="bg-gradient-to-br from-orange-50 to-[#C46A47]/5 rounded-2xl p-5 border border-orange-100">
                    <h3 className="text-xl font-semibold text-[#C46A47] mb-4">Update Status</h3>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Change order status (allowed transitions only)</p>
                      <Select
                        defaultValue={selectedOrder.status}
                        onValueChange={(val) => safeUpdateStatus(selectedOrder, val)}
                      >
                        <SelectTrigger className="w-full h-12 bg-white border-2 border-orange-100 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C46A47]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Received">Received</SelectItem>
                          <SelectItem value="Preparing">Preparing</SelectItem>
                          <SelectItem value="Ready">Ready</SelectItem>
                          <SelectItem value="Out for delivery">Out for delivery</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gradient-to-br from-orange-50 to-[#C46A47]/10 rounded-2xl p-5 border border-orange-200">
                  <h3 className="text-xl font-semibold text-[#C46A47] mb-4 flex items-center gap-2">
                    <Box className="h-5 w-5" />
                    Order Items ({selectedOrder.items.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedOrder.items.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">Quantity: {item.quantity}</p>
                            {item.variations && item.variations.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {item.variations.map((v, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-gradient-to-r from-[#C46A47]/10 to-[#A65638]/10 text-[#C46A47] text-xs font-medium rounded-full border border-[#C46A47]/20"
                                  >
                                    {typeof v === "string" ? v : `${v.name}: ${v.value}`}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#C46A47]">
                              Rs. {(item.price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Rs. {item.price.toFixed(2)} each
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-[#C46A47] to-[#A65638] bg-clip-text text-transparent">
                        Rs. {selectedOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">Payment Method:</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{selectedOrder.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Feedback & Notifications */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Feedback */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-5 border border-amber-200">
                    <h3 className="text-xl font-semibold text-[#C46A47] mb-4">Customer Feedback</h3>
                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C46A47]"></div>
                      </div>
                    ) : feedbackList.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No feedback submitted yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {feedbackList.map((feedback, idx) => (
                          <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-lg ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-sm font-medium text-gray-600">
                                {feedback.rating}/5
                              </span>
                            </div>
                            {feedback.comment && (
                              <p className="text-sm text-gray-700 mb-2">"{feedback.comment}"</p>
                            )}
                            <p className="text-xs text-gray-500">{timeAgo(feedback.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notification Consent */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200">
                    <h3 className="text-xl font-semibold text-[#C46A47] mb-4">Notification Preferences</h3>
                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C46A47]"></div>
                      </div>
                    ) : consents.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No notification preferences recorded.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {consents.slice(0, showAllConsents ? consents.length : 2).map((consent, idx) => (
                          <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${consent.consent ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="font-medium text-gray-900 capitalize">{consent.channel}</span>
                              </div>
                              <span className={`text-sm px-2 py-1 rounded-full ${consent.consent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {consent.consent ? 'Opted In' : 'Opted Out'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{timeAgo(consent.createdAt)}</p>
                          </div>
                        ))}

                        {consents.length > 2 && (
                          <div className="text-center pt-2">
                            <button
                              onClick={() => setShowAllConsents(!showAllConsents)}
                              className="inline-flex items-center gap-2 text-[#C46A47] hover:text-[#A65638] font-medium text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C46A47] rounded-lg px-3 py-2 hover:bg-[#C46A47]/5"
                            >
                              {showAllConsents ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  Show {consents.length - 2} More
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 rounded-b-3xl p-6 border-t border-gray-200">
                <div className="flex justify-end">
                  <Button
                    onClick={closeDetail}
                    className="bg-white border-2 border-[#C46A47] text-[#C46A47] font-semibold px-8 py-3 rounded-xl hover:bg-[#C46A47] hover:text-white transition-all duration-200"
                  >
                    Close Details
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersList;
