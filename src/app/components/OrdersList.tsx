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

const OrdersList: FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const previousOrdersRef = useRef<Order[]>([]);
  const [audioInitialized, setAudioInitialized] = useState(false);
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
            <SelectTrigger className="h-10 bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]" aria-label="Filter by status">
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
            <SelectTrigger className="h-10 bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]" aria-label="Filter by order type">
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
            <SelectTrigger className="h-10 bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]" aria-label="Filter by payment method">
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
          className="underline text-[#741052] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]"
        >
          Clear filters
        </button>
      </div>
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
                  className="relative rounded-2xl border border-white/10 bg-white/10 dark:bg-neutral-900/30 backdrop-blur-md p-4 shadow-[0_8px_30px_rgba(116,16,82,0.1)] hover:scale-[1.02] transition-all focus-within:ring-2 focus-within:ring-[#741052]/30"
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
                      className="w-full flex justify-between items-center text-sm font-medium text-[#741052] hover:text-pink-600 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]"
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
                  <div className="mt-4 flex justify-between items-center border-t border-white/10 pt-3 gap-2">
                    <p
                      className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#741052] to-pink-600"
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
                    <SelectTrigger className="w-[200px] bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]">
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

      {/* Detail drawer */}
      <AnimatePresence>
        {detailOpen && selectedOrder && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl p-6"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <button
                onClick={closeDetail}
                className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-neutral-500">Order</p>
                    <h3 className="text-xl font-semibold text-[#741052]">
                      #{selectedOrder.orderNumber}
                    </h3>
                    <p className="text-xs text-neutral-500">{timeAgo(selectedOrder.createdAt)}</p>
                  </div>
                  <Badge
                    className={`${statusColors[selectedOrder.status] || "bg-gray-100 text-gray-800"} rounded-full px-3 py-1 text-xs`}
                  >
                    {selectedOrder.status}
                  </Badge>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm text-neutral-700 dark:text-neutral-200">
                  <div className="space-y-1">
                    <p className="font-semibold">Customer</p>
                    <p>{selectedOrder.customerName}</p>
                    <p className="text-xs text-neutral-500">{selectedOrder.email || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">Order type</p>
                    <p className="capitalize">{selectedOrder.ordertype}</p>
                    {selectedOrder.tableNumber && <p>Table: {selectedOrder.tableNumber}</p>}
                    {selectedOrder.area && <p>Area: {selectedOrder.area}</p>}
                    {selectedOrder.phone && <p>Phone: {selectedOrder.phone}</p>}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">Payment</p>
                    <p>{selectedOrder.paymentMethod}</p>
                    <p>Total: Rs. {selectedOrder.totalAmount}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Quick actions</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${selectedOrder.phone}`, "_blank")}
                          className="gap-2"
                        >
                          <Phone className="h-4 w-4" /> Call
                        </Button>
                      )}
                      {selectedOrder.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://wa.me/${selectedOrder.phone}?text=Hello%20regarding%20order%20${selectedOrder.orderNumber}`,
                              "_blank"
                            )
                          }
                          className="gap-2"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReceipt(selectedOrder)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" /> Receipt
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-xl p-3 bg-neutral-50 dark:bg-neutral-900/60">
                  <div>
                    <p className="text-sm font-semibold">Update status</p>
                    <p className="text-xs text-neutral-500">Allowed moves only</p>
                  </div>
                  <Select
                    defaultValue={selectedOrder.status}
                    onValueChange={(val) => safeUpdateStatus(selectedOrder, val)}
                  >
                    <SelectTrigger className="w-[200px] bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]">
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

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Items</p>
                  <div className="space-y-2 max-h-56 overflow-auto pr-1">
                    {selectedOrder.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex justify-between items-start rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white/70 dark:bg-neutral-800/50 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{it.title}</p>
                          <p className="text-xs text-neutral-500">Qty: {it.quantity}</p>
                          {it.variations && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {it.variations.map((v, idx) => (
                                <span key={idx} className="text-[11px] px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                                  {typeof v === "string" ? v : `${v.name}: ${v.value}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold">Rs. {it.price * it.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 p-3 bg-white/70 dark:bg-neutral-800/40">
                    <p className="text-sm font-semibold mb-2">Feedback</p>
                    {loadingDetail ? (
                      <p className="text-xs text-neutral-500">Loading…</p>
                    ) : feedbackList.length === 0 ? (
                      <p className="text-xs text-neutral-500">No feedback yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {feedbackList.map((f, idx) => (
                          <div key={idx} className="rounded-lg border border-neutral-100 dark:border-neutral-700 p-2">
                            <p className="text-sm font-semibold">Rating: {f.rating}/5</p>
                            {f.comment && <p className="text-xs text-neutral-600 dark:text-neutral-300">{f.comment}</p>}
                            <p className="text-[11px] text-neutral-500">{timeAgo(f.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 p-3 bg-white/70 dark:bg-neutral-800/40">
                    <p className="text-sm font-semibold mb-2">Notification consent</p>
                    {loadingDetail ? (
                      <p className="text-xs text-neutral-500">Loading…</p>
                    ) : consents.length === 0 ? (
                      <p className="text-xs text-neutral-500">No consents recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {consents.map((c, idx) => (
                          <div key={idx} className="rounded-lg border border-neutral-100 dark:border-neutral-700 p-2 text-sm">
                            <p className="font-semibold capitalize">{c.channel}</p>
                            <p className="text-xs text-neutral-600">
                              {c.consent ? "Opted in" : "Opted out"} — {timeAgo(c.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={closeDetail}
                className="mt-4 w-full rounded-full border border-neutral-200 dark:border-neutral-700 py-2 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersList;
