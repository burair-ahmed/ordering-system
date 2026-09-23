/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { FC, useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  Utensils,
  MapPin,
  Tag,
  Box,
  Eye,
  X,
  Phone,
  MessageCircle,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bike,
  LayoutGrid,
  Kanban,
  List,
  Copy,
  Check,
  Search,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  Ban,
  XCircle,
} from "lucide-react";
import Preloader from "../components/Preloader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

type ViewMode = "grid" | "kanban" | "table";

// Helper to normalize status into 3 main states: "Received" (active), "Delivered" (completed), and "Cancelled"
const isOrderDelivered = (status: string) => {
  const s = (status || "").toLowerCase().trim();
  return s === "delivered" || s === "completed";
};

const isOrderCancelled = (status: string) => {
  const s = (status || "").toLowerCase().trim();
  return s === "cancelled" || s === "canceled" || s === "rejected";
};

const isOrderActive = (status: string) => {
  return !isOrderDelivered(status) && !isOrderCancelled(status);
};

const ORDER_TYPE_CONFIG: Record<
  OrderType,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  dinein: {
    label: "Dine-In",
    bg: "bg-[#741052]/10 dark:bg-[#741052]/25",
    text: "text-[#741052] dark:text-pink-300",
    border: "border-[#741052]/25 dark:border-[#741052]/40",
    icon: Utensils,
  },
  delivery: {
    label: "Delivery",
    bg: "bg-[#96156a]/10 dark:bg-[#96156a]/20",
    text: "text-[#96156a] dark:text-pink-200",
    border: "border-[#96156a]/25 dark:border-[#96156a]/35",
    icon: Bike,
  },
  pickup: {
    label: "Pickup / Takeaway",
    bg: "bg-[#5c0d40]/10 dark:bg-[#5c0d40]/20",
    text: "text-[#5c0d40] dark:text-pink-200",
    border: "border-[#5c0d40]/25 dark:border-[#5c0d40]/35",
    icon: Box,
  },
};

const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const formatExactTime = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
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
  audioInitialized: externalAudioInitialized = false,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set());
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const previousOrdersRef = useRef<Order[]>([]);

  // Filter states (Received vs Delivered vs Cancelled vs All)
  const [statusFilter, setStatusFilter] = useState<"received" | "delivered" | "cancelled" | "all">("received");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [consents, setConsents] = useState<ConsentEntry[]>([]);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Audio Playback
  const playNotificationSound = useCallback(() => {
    if (externalPlayNotificationSound) {
      externalPlayNotificationSound();
    } else if (audioContextRef.current && audioBufferRef.current) {
      try {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        source.start(0);
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    }
  }, [externalPlayNotificationSound]);

  // Fetch Orders
  const fetchOrders = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (response.ok) {
        const newOrders: Order[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const previousOrders = previousOrdersRef.current;
        const isNewOrder =
          previousOrders.length > 0 &&
          (newOrders.length > previousOrders.length ||
            newOrders.some(
              (o: Order) =>
                !previousOrders.some((p) => p.orderNumber === o.orderNumber)
            ));

        if (isNewOrder) {
          playNotificationSound();
          toast.success("🔔 New Order Received!", {
            description: "A customer placed a new order.",
          });
        }

        setOrders(newOrders);
        previousOrdersRef.current = newOrders;
        setLastSynced(new Date());
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      if (showRefreshIndicator) {
        setTimeout(() => setIsRefreshing(false), 350);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 60000); // 1 minute auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Update Status (Received <-> Delivered <-> Cancelled)
  const setOrderStatus = async (
    orderNumber: string,
    newStatus: "Received" | "Delivered" | "Cancelled"
  ) => {
    setLoadingOrders((prev) => new Set(prev.add(orderNumber)));
    try {
      const res = await fetch("/api/updateorderstatus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status: newStatus }),
      });
      if (res.ok) {
        if (newStatus === "Delivered") {
          toast.success(`✓ Order #${orderNumber} Marked as DELIVERED!`);
        } else if (newStatus === "Cancelled") {
          toast.error(`✕ Order #${orderNumber} Marked as CANCELLED!`);
        } else {
          toast.info(`Order #${orderNumber} moved back to RECEIVED queue`);
        }
        fetchOrders();
        if (selectedOrder && selectedOrder.orderNumber === orderNumber) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating order status");
    } finally {
      setLoadingOrders((prev) => {
        const u = new Set(prev);
        u.delete(orderNumber);
        return u;
      });
    }
  };

  // Copy order ID
  const handleCopyOrderId = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrderId(orderNumber);
    toast.success(`Copied #${orderNumber}`);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Counts for Received vs Delivered vs Cancelled
  const counts = useMemo(() => {
    let receivedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let receivedRevenue = 0;
    let deliveredRevenue = 0;
    let cancelledRevenue = 0;

    for (const o of orders) {
      const amount = Number(o.totalAmount) || 0;
      if (isOrderDelivered(o.status)) {
        deliveredCount++;
        deliveredRevenue += amount;
      } else if (isOrderCancelled(o.status)) {
        cancelledCount++;
        cancelledRevenue += amount;
      } else {
        receivedCount++;
        receivedRevenue += amount;
      }
    }

    return {
      receivedCount,
      deliveredCount,
      cancelledCount,
      totalCount: orders.length,
      receivedRevenue,
      deliveredRevenue,
      cancelledRevenue,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const delivered = isOrderDelivered(order.status);
      const cancelled = isOrderCancelled(order.status);
      const active = !delivered && !cancelled;

      // Status Filter
      if (statusFilter === "received" && !active) return false;
      if (statusFilter === "delivered" && !delivered) return false;
      if (statusFilter === "cancelled" && !cancelled) return false;

      // Type Filter
      if (typeFilter !== "all" && order.ordertype !== typeFilter) return false;

      // Search term
      const term = searchTerm.trim().toLowerCase();
      if (term.length > 0) {
        const match =
          order.orderNumber.toLowerCase().includes(term) ||
          order.customerName.toLowerCase().includes(term) ||
          (order.phone || "").toLowerCase().includes(term) ||
          (order.area || "").toLowerCase().includes(term) ||
          (order.tableNumber || "").toLowerCase().includes(term);
        if (!match) return false;
      }

      return true;
    });
  }, [orders, statusFilter, typeFilter, searchTerm]);

  // Open Detail Modal
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
    const isDelivered = isOrderDelivered(order.status);
    const isCancelled = isOrderCancelled(order.status);
    const statusLabel = isCancelled
      ? "CANCELLED"
      : isDelivered
      ? "DELIVERED"
      : "RECEIVED";

    const lines = [
      `========================================`,
      `       CAFE LITTLE KARACHI (CLK)        `,
      `          Official Order Slip           `,
      `========================================`,
      `Order #:        #${order.orderNumber}`,
      `Date & Time:    ${new Date(order.createdAt).toLocaleString("en-PK")}`,
      `Order Type:     ${order.ordertype.toUpperCase()}`,
      order.tableNumber ? `Table Number:   Table #${order.tableNumber}` : "",
      order.area ? `Delivery Area:  ${order.area}` : "",
      `Customer Name:  ${order.customerName}`,
      order.phone ? `Phone:          ${order.phone}` : "",
      order.email ? `Email:          ${order.email}` : "",
      `Payment Method: ${order.paymentMethod?.toUpperCase()}`,
      `Order Status:   ${statusLabel}`,
      `----------------------------------------`,
      `ITEMS:`,
      ...order.items.map((it, idx) => {
        const variations = it.variations
          ? ` (${it.variations
              .map((v) => (typeof v === "string" ? v : `${v.name}: ${v.value}`))
              .join(", ")})`
          : "";
        return `${idx + 1}. [${it.quantity}x] ${it.title}${variations} - Rs. ${
          it.price * it.quantity
        }`;
      }),
      `----------------------------------------`,
      `TOTAL AMOUNT:   Rs. ${order.totalAmount}`,
      `========================================`,
      `       Thank you for ordering!          `,
      `========================================`,
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CLK-Receipt-${order.orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Receipt downloaded for #${order.orderNumber}`);
  };
  return (
    <div className="space-y-5">
      {/* ─────────────────────────────────────────────────────────────
          1. HARMONIOUS LUXURY 3-STATUS + ALL ACTION DASHBOARD
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* BUTTON 1: RECEIVED (PENDING / NEED TO DELIVER) - CLK Royal Plum Theme */}
        <button
          type="button"
          onClick={() => setStatusFilter("received")}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all text-left shadow-sm cursor-pointer ${
            statusFilter === "received"
              ? "bg-[#741052]/10 dark:bg-[#741052]/25 border-[#741052] ring-4 ring-[#741052]/20 shadow-[0_4px_24px_rgba(116,16,82,0.18)]"
              : "bg-white dark:bg-neutral-900 border-neutral-200/90 dark:border-neutral-800 hover:border-[#741052]/50"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#741052] to-[#96156a] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-[#741052] dark:text-pink-400 block">
                Pending Queue
              </span>
              <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                RECEIVED
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-black text-[#741052] dark:text-pink-400 block">
              {counts.receivedCount}
            </span>
            <span className="text-[11px] font-bold text-neutral-500">
              {formatPrice(counts.receivedRevenue)}
            </span>
          </div>
        </button>

        {/* BUTTON 2: DELIVERED (COMPLETED) - Deep Plum Theme */}
        <button
          type="button"
          onClick={() => setStatusFilter("delivered")}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all text-left shadow-sm cursor-pointer ${
            statusFilter === "delivered"
              ? "bg-[#3d0a2b]/10 dark:bg-[#3d0a2b]/50 border-[#3d0a2b] dark:border-[#741052]/60 ring-4 ring-[#3d0a2b]/15 shadow-[0_4px_24px_rgba(61,10,43,0.15)]"
              : "bg-white dark:bg-neutral-900 border-neutral-200/90 dark:border-neutral-800 hover:border-[#3d0a2b]/40"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3d0a2b] to-[#5c0d40] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <CheckCircle2 className="h-6 w-6 text-pink-200" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-[#5c0d40] dark:text-pink-300 block">
                Fulfilled Orders
              </span>
              <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                DELIVERED
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-black text-[#5c0d40] dark:text-pink-300 block">
              {counts.deliveredCount}
            </span>
            <span className="text-[11px] font-bold text-[#741052]/60 dark:text-pink-400/60 uppercase">
              Settled
            </span>
          </div>
        </button>

        {/* BUTTON 3: CANCELLED (VOIDED) - Bold Rose / Red Theme */}
        <button
          type="button"
          onClick={() => setStatusFilter("cancelled")}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all text-left shadow-sm cursor-pointer ${
            statusFilter === "cancelled"
              ? "bg-rose-500/10 dark:bg-rose-950/40 border-rose-600 dark:border-rose-500 ring-4 ring-rose-500/20 shadow-[0_4px_24px_rgba(225,29,72,0.18)]"
              : "bg-white dark:bg-neutral-900 border-neutral-200/90 dark:border-neutral-800 hover:border-rose-500/40"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <Ban className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-rose-600 dark:text-rose-400 block">
                Voided Orders
              </span>
              <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                CANCELLED
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 block">
              {counts.cancelledCount}
            </span>
            <span className="text-[11px] font-bold text-rose-600/70 dark:text-rose-400/70 uppercase">
              Voided
            </span>
          </div>
        </button>

        {/* BUTTON 4: ALL ORDERS - Muted Rose-Plum Theme */}
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all text-left shadow-sm cursor-pointer ${
            statusFilter === "all"
              ? "bg-[#741052]/8 dark:bg-[#741052]/20 border-[#741052]/50 dark:border-[#741052]/50 ring-4 ring-[#741052]/10"
              : "bg-white dark:bg-neutral-900 border-neutral-200/90 dark:border-neutral-800 hover:border-[#741052]/30"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#741052]/80 to-[#3d0a2b] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <Tag className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-extrabold tracking-wider text-[#741052]/70 dark:text-pink-300/80 block">
                Total History
              </span>
              <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                ALL ORDERS
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-black text-[#741052] dark:text-pink-300 block">
              {counts.totalCount}
            </span>
            <span className="text-[11px] font-bold text-[#741052]/50 dark:text-pink-400/50 uppercase">
              Total
            </span>
          </div>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SIMPLE SEARCH & FILTER CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 sm:p-4 border border-neutral-200/90 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order #, customer name, phone, table..."
            className="pl-10 h-11 bg-neutral-50 dark:bg-neutral-800/70 border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold focus-visible:ring-[#741052]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Order Type Dropdown */}
        <div className="flex items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as OrderType | "all")}
          >
            <SelectTrigger className="h-11 w-[140px] sm:w-[160px] bg-neutral-50 dark:bg-neutral-800/70 border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold focus:ring-[#741052]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="dinein">🍽️ Dine-In</SelectItem>
              <SelectItem value="delivery">🛵 Delivery</SelectItem>
              <SelectItem value="pickup">🛍️ Pickup</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="inline-flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-neutral-700 text-[#741052] dark:text-pink-300 shadow-sm"
                  : "text-neutral-500"
              }`}
              title="Grid Cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-neutral-700 text-[#741052] dark:text-pink-300 shadow-sm"
                  : "text-neutral-500"
              }`}
              title="3-Column Board"
            >
              <Kanban className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-neutral-700 text-[#741052] dark:text-pink-300 shadow-sm"
                  : "text-neutral-500"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Refresh button */}
          <Button
            onClick={() => fetchOrders(true)}
            variant="outline"
            disabled={isRefreshing}
            className="h-11 px-3.5 rounded-xl border-neutral-200 dark:border-neutral-700 font-bold text-xs hover:border-[#741052] hover:text-[#741052] cursor-pointer"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin text-[#741052]" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ORDERS LIST (Grid / 3-Column Board / Table)
      ───────────────────────────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#741052]/10 text-[#741052] dark:text-pink-400 flex items-center justify-center mb-3">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-neutral-900 dark:text-white">
            {statusFilter === "received"
              ? "All caught up! No pending orders right now."
              : statusFilter === "delivered"
              ? "No delivered orders found in this view."
              : statusFilter === "cancelled"
              ? "No cancelled orders. All customer orders are active or fulfilled!"
              : "No orders found."}
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm">
            {statusFilter === "received"
              ? "When customers place orders, they will appear here in the RECEIVED queue."
              : statusFilter === "cancelled"
              ? "Voided or cancelled orders will be archived here for your records."
              : "Try switching filters to view other order queues."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* ═══════════════════════════════════════════════════════════════
           GRID VIEW: Luxury CLK Plum, Slate & Crimson Design
        ═══════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => {
              const delivered = isOrderDelivered(order.status);
              const cancelled = isOrderCancelled(order.status);
              const active = !delivered && !cancelled;

              const typeCfg =
                ORDER_TYPE_CONFIG[order.ordertype] || ORDER_TYPE_CONFIG.dinein;
              const TypeIcon = typeCfg.icon;

              return (
                <motion.div
                  key={order.orderNumber}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative flex flex-col bg-white dark:bg-neutral-900 rounded-3xl border-2 shadow-sm transition-all overflow-hidden ${
                    cancelled
                      ? "border-rose-500/30 dark:border-rose-500/40 opacity-90"
                      : delivered
                      ? "border-[#3d0a2b]/25 dark:border-[#5c0d40]/35 opacity-90"
                      : "border-[#741052]/30 dark:border-[#741052]/40 shadow-[0_4px_20px_rgba(116,16,82,0.08)] ring-1 ring-[#741052]/10"
                  }`}
                >
                  {/* Top Status Header Banner */}
                  <div
                    className={`px-5 py-3 flex items-center justify-between text-white ${
                      cancelled
                        ? "bg-gradient-to-r from-rose-700 via-rose-800 to-red-900"
                        : delivered
                        ? "bg-gradient-to-r from-[#3d0a2b] to-[#5c0d40]"
                        : "bg-gradient-to-r from-[#741052] via-[#8d1664] to-[#a01a72]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {cancelled ? (
                        <Ban className="h-5 w-5 text-white" />
                      ) : delivered ? (
                        <CheckCircle2 className="h-5 w-5 text-pink-200" />
                      ) : (
                        <AlertCircle className="h-5 w-5 animate-pulse text-pink-200" />
                      )}
                      <span className="font-black text-sm uppercase tracking-wider">
                        {cancelled ? "CANCELLED" : delivered ? "DELIVERED" : "RECEIVED"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold leading-tight block">
                        {timeAgo(order.createdAt)}
                      </span>
                      <span className="text-[11px] font-medium opacity-85 leading-tight block mt-0.5">
                        {formatExactTime(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Order # and Type / Location */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleCopyOrderId(order.orderNumber)}
                          className="flex items-center gap-1.5 text-lg font-black text-neutral-900 dark:text-white hover:text-[#741052] transition-colors cursor-pointer"
                          title="Copy Order ID"
                        >
                          <span>#{order.orderNumber}</span>
                          {copiedOrderId === order.orderNumber ? (
                            <Check className="h-4 w-4 text-[#741052] dark:text-pink-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-neutral-400" />
                          )}
                        </button>

                        {/* Order Type Badge */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
                        >
                          <TypeIcon className="h-4 w-4" />
                          <span>{typeCfg.label}</span>
                        </div>
                      </div>

                      {/* Location Chip */}
                      {(order.tableNumber || order.area) && (
                        <div className="mt-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          {order.ordertype === "dinein" && order.tableNumber && (
                            <span className="px-2.5 py-1 bg-[#741052] text-white rounded-lg font-black text-xs">
                              Table #{order.tableNumber}
                            </span>
                          )}
                          {order.ordertype === "delivery" && order.area && (
                            <span className="px-2.5 py-1 bg-[#741052]/10 text-[#741052] dark:text-pink-300 rounded-lg font-black text-xs flex items-center gap-1 border border-[#741052]/20">
                              <MapPin className="h-3.5 w-3.5" />
                              {order.area}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Customer Info & 1-Click WhatsApp / Call Buttons */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl p-3.5 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-neutral-900 dark:text-white truncate">
                          {order.customerName}
                        </p>
                        <p className="text-xs font-semibold text-neutral-500 truncate mt-0.5">
                          {order.phone || "No phone number"}
                        </p>
                      </div>

                      {order.phone && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`https://wa.me/${order.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Hello ${order.customerName}, this is Cafe Little Karachi regarding your order #${order.orderNumber}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 bg-[#741052] hover:bg-[#5c0d40] text-white rounded-xl font-black text-xs transition-colors shadow-sm"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>WhatsApp</span>
                          </a>
                          <a
                            href={`tel:${order.phone}`}
                            className="p-2 bg-[#5c0d40]/10 dark:bg-[#5c0d40]/25 hover:bg-[#5c0d40]/20 text-[#5c0d40] dark:text-pink-300 border border-[#5c0d40]/20 rounded-xl transition-colors shadow-sm"
                            title="Call Customer"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Items List (Clear & Readable) */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 block">
                        Ordered Items ({order.items.length})
                      </span>

                      <div className="bg-neutral-50/70 dark:bg-neutral-800/40 rounded-2xl p-3 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={`${item.id}-${idx}`}
                            className="flex items-start justify-between gap-2 text-xs"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-black text-sm text-neutral-900 dark:text-white mr-1.5">
                                {item.quantity}×
                              </span>
                              <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                {item.title}
                              </span>
                              {item.variations && item.variations.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {item.variations.map((v, vIdx) => (
                                    <span
                                      key={vIdx}
                                      className="text-[10px] font-bold px-1.5 py-0.2 bg-[#741052]/10 text-[#741052] dark:text-pink-300 rounded"
                                    >
                                      {typeof v === "string"
                                        ? v
                                        : `${v.name}: ${v.value}`}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="font-black text-xs text-neutral-700 dark:text-neutral-300 shrink-0">
                              Rs. {item.price * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                          Total Payable ({order.paymentMethod?.toUpperCase()})
                        </span>
                        <span className={`text-xl font-black ${cancelled ? "text-rose-600 dark:text-rose-400 line-through opacity-80" : "text-[#741052] dark:text-pink-400"}`}>
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(order)}
                        className="text-xs font-bold text-neutral-600 dark:text-neutral-300 flex items-center gap-1 hover:text-[#741052] cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
                    </div>

                    {/* ─────────────────────────────────────────────────────────────
                        MAIN ACTION BUTTONS (Deliver / Cancel / Restore / Undo)
                    ───────────────────────────────────────────────────────────── */}
                    <div className="pt-1">
                      {active ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setOrderStatus(order.orderNumber, "Delivered")}
                            disabled={loadingOrders.has(order.orderNumber)}
                            className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#741052] via-[#8a1361] to-[#a01671] hover:from-[#5c0d40] hover:to-[#741052] active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#741052]/25 transition-all cursor-pointer"
                          >
                            <Check className="h-5 w-5 stroke-[3]" />
                            <span>MARK AS DELIVERED</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setOrderStatus(order.orderNumber, "Cancelled")}
                            disabled={loadingOrders.has(order.orderNumber)}
                            className="w-full h-9 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            <span>Cancel Order</span>
                          </button>
                        </div>
                      ) : delivered ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-11 rounded-2xl bg-[#3d0a2b]/10 dark:bg-[#3d0a2b]/30 border border-[#3d0a2b]/20 dark:border-[#5c0d40]/40 text-[#5c0d40] dark:text-pink-300 font-black text-xs flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>DELIVERED</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setOrderStatus(order.orderNumber, "Received")}
                            disabled={loadingOrders.has(order.orderNumber)}
                            className="px-3 h-11 rounded-2xl bg-[#741052]/10 dark:bg-[#741052]/20 hover:bg-[#741052]/20 text-[#741052] dark:text-pink-300 font-bold text-xs flex items-center gap-1 transition-colors border border-[#741052]/20 cursor-pointer"
                            title="Move back to Received"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Undo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setOrderStatus(order.orderNumber, "Cancelled")}
                            disabled={loadingOrders.has(order.orderNumber)}
                            className="px-3 h-11 rounded-2xl bg-rose-500/10 dark:bg-rose-950/30 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1 transition-colors border border-rose-500/20 cursor-pointer"
                            title="Cancel Order"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      ) : (
                        /* Cancelled State */
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-11 rounded-2xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-xs flex items-center justify-center gap-1.5">
                            <Ban className="h-4 w-4" />
                            <span>CANCELLED</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setOrderStatus(order.orderNumber, "Received")}
                            disabled={loadingOrders.has(order.orderNumber)}
                            className="px-4 h-11 rounded-2xl bg-[#741052] hover:bg-[#5c0d40] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                            title="Restore order to Received queue"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Restore</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Loading spinner overlay */}
                  {loadingOrders.has(order.orderNumber) && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <Preloader />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : viewMode === "kanban" ? (
        /* ═══════════════════════════════════════════════════════════════
           KANBAN / 3-COLUMN STAGE BOARD (Received vs Delivered vs Cancelled)
        ═══════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* COLUMN 1: RECEIVED */}
          <div className="bg-[#741052]/[0.04] dark:bg-[#741052]/[0.10] rounded-3xl p-4 border-2 border-[#741052]/30 dark:border-[#741052]/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#741052]/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#741052] dark:text-pink-400" />
                <h3 className="font-black text-base text-neutral-900 dark:text-white uppercase">
                  RECEIVED (Pending)
                </h3>
              </div>
              <Badge className="bg-[#741052] text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                {counts.receivedCount}
              </Badge>
            </div>

            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
              {orders
                .filter((o) => isOrderActive(o.status))
                .map((order) => (
                  <div
                    key={order.orderNumber}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-base text-neutral-900 dark:text-white">
                        #{order.orderNumber}
                      </span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-neutral-400 block leading-tight">
                          {timeAgo(order.createdAt)}
                        </span>
                        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block leading-tight mt-0.5">
                          {formatExactTime(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs">
                      <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {order.customerName}
                      </p>
                      <p className="text-neutral-500 font-medium">
                        {order.ordertype.toUpperCase()}{" "}
                        {order.tableNumber ? `· Table #${order.tableNumber}` : ""}{" "}
                        {order.area ? `· ${order.area}` : ""}
                      </p>
                    </div>

                    <div className="text-xs bg-neutral-50 dark:bg-neutral-900/60 p-2.5 rounded-xl font-medium">
                      {order.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {i.quantity}× {i.title}
                          </span>
                          <span className="font-bold">
                            Rs. {i.price * i.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-black text-base text-[#741052] dark:text-pink-400">
                        {formatPrice(order.totalAmount)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setOrderStatus(order.orderNumber, "Delivered")}
                          className="px-3 py-1.5 bg-[#741052] hover:bg-[#5c0d40] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Deliver</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderStatus(order.orderNumber, "Cancelled")}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/40 cursor-pointer"
                          title="Cancel Order"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* COLUMN 2: DELIVERED */}
          <div className="bg-[#3d0a2b]/[0.05] dark:bg-[#3d0a2b]/[0.15] rounded-3xl p-4 border-2 border-[#3d0a2b]/25 dark:border-[#5c0d40]/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#3d0a2b]/15 dark:border-[#5c0d40]/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#5c0d40] dark:text-pink-300" />
                <h3 className="font-black text-base text-neutral-900 dark:text-white uppercase">
                  DELIVERED (Fulfilled)
                </h3>
              </div>
              <Badge className="bg-gradient-to-r from-[#3d0a2b] to-[#5c0d40] text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                {counts.deliveredCount}
              </Badge>
            </div>

            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
              {orders
                .filter((o) => isOrderDelivered(o.status))
                .map((order) => (
                  <div
                    key={order.orderNumber}
                    className="bg-white dark:bg-neutral-900/80 rounded-2xl p-4 border border-[#3d0a2b]/15 dark:border-[#5c0d40]/25 shadow-sm space-y-3 opacity-90"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-base text-neutral-900 dark:text-white">
                        #{order.orderNumber}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-xs font-bold text-neutral-400 block leading-tight">
                            {timeAgo(order.createdAt)}
                          </span>
                          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block leading-tight mt-0.5">
                            {formatExactTime(order.createdAt)}
                          </span>
                        </div>
                        <Badge className="bg-[#3d0a2b]/10 dark:bg-[#3d0a2b]/40 text-[#5c0d40] dark:text-pink-300 border border-[#3d0a2b]/20 text-[10px] font-black">
                          DELIVERED
                        </Badge>
                      </div>
                    </div>

                    <div className="text-xs">
                      <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {order.customerName}
                      </p>
                      <p className="text-neutral-500 font-medium">
                        {order.ordertype.toUpperCase()} · {formatPrice(order.totalAmount)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(order)}
                        className="text-xs font-bold cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>

                      <button
                        type="button"
                        onClick={() => setOrderStatus(order.orderNumber, "Received")}
                        className="px-3 py-1.5 bg-[#741052]/10 dark:bg-[#741052]/20 hover:bg-[#741052]/20 text-[#741052] dark:text-pink-300 border border-[#741052]/20 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Undo</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* COLUMN 3: CANCELLED */}
          <div className="bg-rose-500/[0.04] dark:bg-rose-950/[0.15] rounded-3xl p-4 border-2 border-rose-500/25 dark:border-rose-500/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-black text-base text-neutral-900 dark:text-white uppercase">
                  CANCELLED (Voided)
                </h3>
              </div>
              <Badge className="bg-gradient-to-r from-rose-600 to-red-700 text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                {counts.cancelledCount}
              </Badge>
            </div>

            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
              {orders
                .filter((o) => isOrderCancelled(o.status))
                .map((order) => (
                  <div
                    key={order.orderNumber}
                    className="bg-white dark:bg-neutral-900/80 rounded-2xl p-4 border border-rose-500/20 shadow-sm space-y-3 opacity-90"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-base text-neutral-900 dark:text-white">
                        #{order.orderNumber}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-xs font-bold text-neutral-400 block leading-tight">
                            {timeAgo(order.createdAt)}
                          </span>
                          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block leading-tight mt-0.5">
                            {formatExactTime(order.createdAt)}
                          </span>
                        </div>
                        <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-black">
                          CANCELLED
                        </Badge>
                      </div>
                    </div>

                    <div className="text-xs">
                      <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {order.customerName}
                      </p>
                      <p className="text-neutral-500 font-medium">
                        {order.ordertype.toUpperCase()} · {formatPrice(order.totalAmount)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(order)}
                        className="text-xs font-bold cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>

                      <button
                        type="button"
                        onClick={() => setOrderStatus(order.orderNumber, "Received")}
                        className="px-3 py-1.5 bg-[#741052] hover:bg-[#5c0d40] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           TABLE LIST VIEW: Comprehensive Status Scanner
        ═══════════════════════════════════════════════════════════════ */
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 uppercase tracking-wider text-[11px] text-neutral-500 font-extrabold">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Type / Table / Area</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium">
                {filteredOrders.map((order) => {
                  const delivered = isOrderDelivered(order.status);
                  const cancelled = isOrderCancelled(order.status);
                  const active = !delivered && !cancelled;

                  const typeCfg =
                    ORDER_TYPE_CONFIG[order.ordertype] || ORDER_TYPE_CONFIG.dinein;

                  return (
                    <tr
                      key={order.orderNumber}
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-black text-sm text-[#741052] dark:text-pink-400">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-neutral-700 dark:text-neutral-300 text-xs leading-tight">
                          {timeAgo(order.createdAt)}
                        </div>
                        <div className="text-[11px] font-medium text-neutral-400 leading-tight mt-0.5">
                          {formatExactTime(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900 dark:text-white">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {order.phone || "No phone"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold">
                          {typeCfg.label}
                          {order.tableNumber ? ` · Table #${order.tableNumber}` : ""}
                          {order.area ? ` · ${order.area}` : ""}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px] truncate font-medium">
                        {order.items
                          .map((i) => `${i.quantity}x ${i.title}`)
                          .join(", ")}
                      </td>
                      <td className={`py-3.5 px-4 font-black text-sm whitespace-nowrap ${cancelled ? "text-rose-600 dark:text-rose-400 line-through opacity-75" : "text-neutral-900 dark:text-white"}`}>
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          className={`font-black text-xs px-3 py-1 rounded-full ${
                            cancelled
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                              : delivered
                              ? "bg-[#3d0a2b]/10 dark:bg-[#3d0a2b]/30 text-[#5c0d40] dark:text-pink-300 border border-[#3d0a2b]/20 dark:border-[#5c0d40]/30"
                              : "bg-[#741052]/10 text-[#741052] dark:text-pink-300 border border-[#741052]/30"
                          }`}
                        >
                          {cancelled ? "CANCELLED" : delivered ? "DELIVERED" : "RECEIVED"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {active ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setOrderStatus(order.orderNumber, "Delivered")}
                              className="px-3 py-1.5 bg-[#741052] hover:bg-[#5c0d40] text-white font-black text-xs rounded-xl shadow-sm cursor-pointer"
                            >
                              ✓ Deliver
                            </button>
                            <button
                              type="button"
                              onClick={() => setOrderStatus(order.orderNumber, "Cancelled")}
                              className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 font-bold text-xs rounded-xl cursor-pointer"
                              title="Cancel Order"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        ) : delivered ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setOrderStatus(order.orderNumber, "Received")}
                              className="px-2.5 py-1 bg-[#741052]/10 dark:bg-[#741052]/20 hover:bg-[#741052]/20 text-[#741052] dark:text-pink-300 border border-[#741052]/20 font-bold text-xs rounded-lg cursor-pointer"
                            >
                              Undo
                            </button>
                            <button
                              type="button"
                              onClick={() => setOrderStatus(order.orderNumber, "Cancelled")}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 font-bold text-xs rounded-lg cursor-pointer"
                              title="Cancel Order"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setOrderStatus(order.orderNumber, "Received")}
                            className="px-3 py-1.5 bg-[#741052] hover:bg-[#5c0d40] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                          >
                            ↺ Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. DIGITAL POS TICKET INSPECTOR MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailOpen && selectedOrder && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header */}
              <div
                className={`p-5 text-white flex items-center justify-between ${
                  isOrderCancelled(selectedOrder.status)
                    ? "bg-gradient-to-r from-rose-700 to-red-900"
                    : isOrderDelivered(selectedOrder.status)
                    ? "bg-gradient-to-r from-[#3d0a2b] to-[#5c0d40]"
                    : "bg-gradient-to-r from-[#741052] to-[#96156a]"
                }`}
              >
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block opacity-90">
                    Order Ticket
                  </span>
                  <h2 className="text-2xl font-black">
                    #{selectedOrder.orderNumber}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs font-semibold opacity-90 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {timeAgo(selectedOrder.createdAt)} ({formatExactTime(selectedOrder.createdAt)})
                    </span>
                  </div>
                </div>

                <button
                  onClick={closeDetail}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
                {/* Status indicator */}
                <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800 p-4 rounded-2xl border">
                  <div>
                    <span className="text-neutral-400 font-bold block uppercase text-[10px]">
                      Current Order Status
                    </span>
                    <span className={`text-lg font-black ${
                      isOrderCancelled(selectedOrder.status)
                        ? "text-rose-600 dark:text-rose-400"
                        : isOrderDelivered(selectedOrder.status)
                        ? "text-[#5c0d40] dark:text-pink-300"
                        : "text-[#741052] dark:text-pink-400"
                    }`}>
                      {isOrderCancelled(selectedOrder.status)
                        ? "CANCELLED (VOIDED)"
                        : isOrderDelivered(selectedOrder.status)
                        ? "DELIVERED ✓"
                        : "RECEIVED (PENDING)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOrderActive(selectedOrder.status) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setOrderStatus(selectedOrder.orderNumber, "Delivered");
                            closeDetail();
                          }}
                          className="px-4 py-2 bg-[#741052] hover:bg-[#5c0d40] text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                        >
                          ✓ Mark as Delivered
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOrderStatus(selectedOrder.orderNumber, "Cancelled");
                            closeDetail();
                          }}
                          className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          ✕ Cancel Order
                        </button>
                      </>
                    ) : isOrderDelivered(selectedOrder.status) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setOrderStatus(selectedOrder.orderNumber, "Received");
                            closeDetail();
                          }}
                          className="px-3 py-1.5 bg-[#741052]/10 dark:bg-[#741052]/20 hover:bg-[#741052]/20 text-[#741052] dark:text-pink-300 border border-[#741052]/20 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Move to Received
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOrderStatus(selectedOrder.orderNumber, "Cancelled");
                            closeDetail();
                          }}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setOrderStatus(selectedOrder.orderNumber, "Received");
                          closeDetail();
                        }}
                        className="px-4 py-2 bg-[#741052] hover:bg-[#5c0d40] text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore to Received</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer details */}
                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-2xl border space-y-2">
                  <span className="text-neutral-400 font-bold block uppercase text-[10px]">
                    Customer & Location
                  </span>
                  <p className="text-sm font-black text-neutral-900 dark:text-white">
                    {selectedOrder.customerName}
                  </p>
                  {selectedOrder.phone && (
                    <p className="font-bold text-neutral-700 dark:text-neutral-300">
                      Phone: {selectedOrder.phone}
                    </p>
                  )}
                  {selectedOrder.tableNumber && (
                    <p className="font-bold text-[#741052] dark:text-pink-400">
                      Dine-In Table #{selectedOrder.tableNumber}
                    </p>
                  )}
                  {selectedOrder.area && (
                    <p className="font-bold text-[#741052] dark:text-pink-400">
                      Delivery: {selectedOrder.area}
                    </p>
                  )}

                  {selectedOrder.phone && (
                    <div className="pt-2 flex gap-2">
                      <a
                        href={`https://wa.me/${selectedOrder.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Hello ${selectedOrder.customerName}, this is Cafe Little Karachi regarding your order #${selectedOrder.orderNumber}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-[#741052] hover:bg-[#5c0d40] text-white font-black text-center rounded-xl"
                      >
                        WhatsApp Chat
                      </a>
                      <a
                        href={`tel:${selectedOrder.phone}`}
                        className="flex-1 py-2 bg-[#5c0d40]/15 dark:bg-[#5c0d40]/30 hover:bg-[#5c0d40]/25 text-[#5c0d40] dark:text-pink-300 border border-[#5c0d40]/25 font-black text-center rounded-xl"
                      >
                        Call Phone
                      </a>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-2xl border space-y-2">
                  <span className="text-neutral-400 font-bold block uppercase text-[10px]">
                    Ordered Items
                  </span>

                  <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {selectedOrder.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="py-2 first:pt-0 flex justify-between font-medium"
                      >
                        <div>
                          <span className="font-black text-sm mr-1">
                            {it.quantity}×
                          </span>
                          <span className="font-bold">{it.title}</span>
                          {it.variations && itemVariationsText(it.variations)}
                        </div>
                        <span className="font-black">
                          Rs. {it.price * it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t-2 border-dashed flex justify-between items-center text-sm font-black text-neutral-900 dark:text-white">
                    <span>Total ({selectedOrder.paymentMethod?.toUpperCase()})</span>
                    <span className={`text-lg ${isOrderCancelled(selectedOrder.status) ? "text-rose-600 dark:text-rose-400 line-through opacity-80" : "text-[#741052] dark:text-pink-400"}`}>
                      {formatPrice(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-neutral-100 dark:bg-neutral-800 border-t flex justify-between">
                <Button
                  onClick={() => downloadReceipt(selectedOrder)}
                  variant="outline"
                  size="sm"
                  className="font-bold text-xs hover:border-[#741052] cursor-pointer"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Receipt
                </Button>

                <Button
                  onClick={closeDetail}
                  className="bg-[#741052] hover:bg-[#5c0d40] text-white font-bold text-xs px-6 cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function itemVariationsText(variations: { name: string; value: string }[] | string[]) {
  if (!variations || variations.length === 0) return null;
  return (
    <p className="text-[10px] text-neutral-400">
      {variations
        .map((v) => (typeof v === "string" ? v : `${v.name}: ${v.value}`))
        .join(", ")}
    </p>
  );
}

export default OrdersList;
