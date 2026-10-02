'use client';

import React, { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  MapPin,
  Clock,
  Flame,
  Users,
  Award,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Eye,
  CheckCircle2,
  XCircle,
  Phone,
  Store,
  DollarSign,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Receipt,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import {
  exportAnalyticsToXLSX,
  exportAnalyticsToCSV,
  exportAnalyticsToPDF,
} from '@/lib/exportAnalytics';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';

// --- Interfaces ---
interface AnalyticsData {
  filter: string;
  dateRange: {
    start: string;
    end: string;
    label: string;
  };
  previousDateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    activeOrders: number;
    totalItemsSold: number;
    aov: number;
    aoq: number;
    revenueGrowth: number;
    ordersGrowth: number;
    aovGrowth: number;
    aoqGrowth: number;
    prevRevenue: number;
    prevOrders: number;
  };
  timeline: Array<{
    label: string;
    date: string;
    revenue: number;
    orders: number;
    delivered: number;
    cancelled: number;
  }>;
  productLeaderboard: Array<{
    id: string;
    title: string;
    image?: string;
    timesOrdered: number;
    totalQuantity: number;
    totalRevenue: number;
    avgQuantityPerOrder: number;
    revenueShare: number;
    rank: number;
  }>;
  stagnantProducts: Array<{
    id: string;
    title: string;
    category: string;
    price: number;
    image: string;
    timesOrdered: number;
  }>;
  areaAnalytics: Array<{
    area: string;
    orderCount: number;
    totalRevenue: number;
    totalDeliveryCharges: number;
    revenueShare: number;
  }>;
  channels: {
    fulfillment: Array<{
      type: 'dinein' | 'delivery' | 'pickup';
      label: string;
      orderCount: number;
      totalRevenue: number;
      share: number;
    }>;
    marketingSources: Array<{
      source: string;
      label: string;
      orderCount: number;
      totalRevenue: number;
      aov: number;
      share: number;
    }>;
  };
  peakHours: Array<{
    hour: number;
    hourLabel: string;
    orderCount: number;
    totalRevenue: number;
  }>;
  dayOfWeekTrends: Array<{
    dayNumber: number;
    dayName: string;
    shortDay: string;
    orderCount: number;
    totalRevenue: number;
  }>;
  basketAffinity: Array<{
    itemA: string;
    itemB: string;
    pairCount: number;
    pairLabel: string;
  }>;
  customerRetention: {
    totalIdentifiedCustomers: number;
    newCustomers: number;
    repeatCustomers: number;
    repeatRate: number;
    topLoyalCustomers: Array<{
      phoneMasked: string;
      name: string;
      orderCount: number;
      totalSpent: number;
    }>;
  };
}

interface HistoricalOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  email?: string;
  phone?: string;
  ordertype: 'dinein' | 'pickup' | 'delivery';
  deliveryCharge: number;
  tableNumber?: string;
  area?: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    variations?: string[];
  }>;
  orderSource?: {
    source: string;
    label: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
}

const BRAND_PALETTE = ['#741052', '#991b1b', '#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777'];
const CHANNEL_COLORS: Record<string, string> = {
  delivery: '#741052',
  dinein: '#d97706',
  pickup: '#059669',
};

const AnalyticsPage: FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [timelineMetric, setTimelineMetric] = useState<'revenue' | 'orders'>('revenue');

  // Product Leaderboard Search & Pagination
  const [productSearch, setProductSearch] = useState('');
  const [productSortBy, setProductSortBy] = useState<'quantity' | 'revenue' | 'orders'>('quantity');

  // Historical Ledger State
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerOrders, setLedgerOrders] = useState<HistoricalOrder[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStatus, setLedgerStatus] = useState('all');
  const [ledgerOrderType, setLedgerOrderType] = useState('all');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotalOrders, setLedgerTotalOrders] = useState(0);
  const [selectedLedgerOrder, setSelectedLedgerOrder] = useState<HistoricalOrder | null>(null);

  // Export Menu State
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Safe Purge Modal State (Feature A6)
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeDays, setPurgeDays] = useState<number>(14);
  const [purgeLoading, setPurgeLoading] = useState(false);

  // Safe Purge Execution (Feature A6)
  const handleExecutePurge = async () => {
    setPurgeLoading(true);
    try {
      const res = await fetch('/api/orders/purge-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          olderThanDays: purgeDays,
          targetStatuses: ['Delivered', 'Completed', 'Cancelled', 'Canceled', 'Voided'],
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message || 'Orders purged and preserved in OrderLedger.');
        setShowPurgeModal(false);
        fetchAnalytics(filter, customStart, customEnd);
      } else {
        toast.error(result.message || 'Failed to purge orders.');
      }
    } catch (err) {
      console.error('Purge error:', err);
      toast.error('Network error while executing purge.');
    } finally {
      setPurgeLoading(false);
    }
  };

  // Fetch Analytics API
  const fetchAnalytics = useCallback(async (selectedFilter: string, start?: string, end?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('filter', selectedFilter);
      if (start && end) {
        params.append('startDate', start);
        params.append('endDate', end);
      }
      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load analytics payload');
      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('[Analytics] Fetch error:', err);
      toast.error('Failed to load analytics dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Historical Ledger Orders
  const fetchLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(ledgerPage));
      params.append('limit', '15');
      if (ledgerSearch.trim()) params.append('search', ledgerSearch.trim());
      if (ledgerStatus !== 'all') params.append('status', ledgerStatus);
      if (ledgerOrderType !== 'all') params.append('ordertype', ledgerOrderType);

      const res = await fetch(`/api/analytics/ledger?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLedgerOrders(json.orders || []);
        setLedgerTotalOrders(json.pagination?.totalOrders || 0);
      }
    } catch (err) {
      console.error('[Ledger] Fetch error:', err);
      toast.error('Failed to fetch historical orders ledger.');
    } finally {
      setLedgerLoading(false);
    }
  }, [ledgerPage, ledgerSearch, ledgerStatus, ledgerOrderType]);

  useEffect(() => {
    fetchAnalytics(filter, customStart, customEnd);
  }, [filter, fetchAnalytics]);

  useEffect(() => {
    if (showLedgerModal) {
      fetchLedger();
    }
  }, [showLedgerModal, fetchLedger]);

  const handleApplyCustomDate = () => {
    if (!customStart || !customEnd) {
      toast.error('Please select both start and end dates.');
      return;
    }
    setFilter('custom');
    setShowCustomPicker(false);
    fetchAnalytics('custom', customStart, customEnd);
  };

  // Filtered & Sorted Product Leaderboard
  const filteredProducts = useMemo(() => {
    if (!data?.productLeaderboard) return [];
    let list = [...data.productLeaderboard];
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    if (productSortBy === 'quantity') {
      list.sort((a, b) => b.totalQuantity - a.totalQuantity);
    } else if (productSortBy === 'revenue') {
      list.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } else if (productSortBy === 'orders') {
      list.sort((a, b) => b.timesOrdered - a.timesOrdered);
    }
    return list;
  }, [data?.productLeaderboard, productSearch, productSortBy]);

  return (
    <div className="w-full space-y-6 p-3 sm:p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-950/50 min-h-screen">
      {/* ── Top Header & Filter Ribbon ────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-neutral-200/80 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#741052] to-[#a31572] flex items-center justify-center text-white shadow-md shadow-[#741052]/20">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                Analytics & Business Intelligence
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Live Sales Engine · {data?.dateRange.label || 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Buttons & Historical Ledger Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
            {[
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: 'last-month', label: 'Last Month' },
              { key: 'year', label: 'This Year' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setFilter(tab.key);
                  setShowCustomPicker(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === tab.key
                    ? 'bg-[#741052] text-white shadow-sm shadow-[#741052]/30 scale-[1.02]'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === 'custom'
                  ? 'bg-[#741052] text-white shadow-sm shadow-[#741052]/30 scale-[1.02]'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Custom
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(filter, customStart, customEnd)}
            disabled={loading}
            className="rounded-xl border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Export Reports Dropdown (Requirement #7) */}
          <div className="relative">
            <Button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={loading || !data}
              className="rounded-xl bg-[#741052] hover:bg-[#8c1463] text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </Button>

            <AnimatePresence>
              {showExportMenu && data && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-1.5 z-40 text-xs space-y-1"
                >
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      exportAnalyticsToXLSX(data, ledgerOrders);
                      toast.success('Excel workbook exported successfully.');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-bold text-neutral-700 dark:text-neutral-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Excel Workbook (.xlsx)</p>
                      <p className="text-[10px] text-neutral-400 font-normal">Multi-sheet comprehensive</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      exportAnalyticsToCSV(data);
                      toast.success('CSV spreadsheet exported successfully.');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-bold text-neutral-700 dark:text-neutral-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-bold">CSV Spreadsheet (.csv)</p>
                      <p className="text-[10px] text-neutral-400 font-normal">Raw sales & products</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      exportAnalyticsToPDF(data);
                      toast.success('Executive PDF report exported successfully.');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-bold text-neutral-700 dark:text-neutral-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                  >
                    <Receipt className="w-4 h-4 text-[#741052] dark:text-rose-400 shrink-0" />
                    <div>
                      <p className="font-bold">Executive PDF (.pdf)</p>
                      <p className="text-[10px] text-neutral-400 font-normal">Formatted printable report</p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            onClick={() => setShowLedgerModal(true)}
            className="rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 text-white font-bold shadow-md text-xs"
          >
            <Receipt className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
            Historical Ledger
          </Button>

          {/* Safe Purge Trigger Button (Feature A6) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPurgeModal(true)}
            className="rounded-xl border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Safe Purge
          </Button>
        </div>
      </div>

      {/* ── Custom Date Range Popover ──────────────────────────────────────── */}
      <AnimatePresence>
        {showCustomPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-xl border border-[#741052]/20 flex flex-wrap items-center gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-500 uppercase">From</span>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-40 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-500 uppercase">To</span>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-40 rounded-xl"
              />
            </div>
            <Button
              onClick={handleApplyCustomDate}
              className="bg-[#741052] hover:bg-[#8c1463] text-white rounded-xl font-bold"
            >
              Apply Filter
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCustomPicker(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Executive KPI HUD Cards (Feature A3 Growth Badges) ─────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Gross Revenue */}
        <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#741052]/5 dark:bg-[#741052]/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Gross Revenue
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading ? (
              <Skeleton className="h-9 w-32 my-1" />
            ) : (
              <div className="space-y-1.5">
                <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                  Rs. {data?.summary.totalRevenue.toLocaleString() || 0}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {data && data.summary.revenueGrowth >= 0 ? (
                    <span className="inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +{data.summary.revenueGrowth}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      {data?.summary.revenueGrowth}%
                    </span>
                  )}
                  <span className="text-neutral-400 truncate">vs prior period</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Total Orders */}
        <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Total Orders
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading ? (
              <Skeleton className="h-9 w-24 my-1" />
            ) : (
              <div className="space-y-1.5">
                <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                  {data?.summary.totalOrders || 0}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {data && data.summary.ordersGrowth >= 0 ? (
                    <span className="inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +{data.summary.ordersGrowth}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      {data?.summary.ordersGrowth}%
                    </span>
                  )}
                  <span className="text-neutral-400 text-[11px] truncate">
                    {data?.summary.deliveredOrders} delivered · {data?.summary.cancelledOrders} void
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Average Order Value (AOV) */}
        <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Avg Order Value (AOV)
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading ? (
              <Skeleton className="h-9 w-28 my-1" />
            ) : (
              <div className="space-y-1.5">
                <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                  Rs. {data?.summary.aov.toLocaleString() || 0}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {data && data.summary.aovGrowth >= 0 ? (
                    <span className="inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +{data.summary.aovGrowth}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      {data?.summary.aovGrowth}%
                    </span>
                  )}
                  <span className="text-neutral-400 truncate">per customer order</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Average Order Quantity (AOQ - Requirement #2) */}
        <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Avg Order Qty (AOQ)
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading ? (
              <Skeleton className="h-9 w-28 my-1" />
            ) : (
              <div className="space-y-1.5">
                <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                  {data?.summary.aoq || 0} <span className="text-base font-medium text-neutral-500">items</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">
                    {data?.summary.totalItemsSold || 0}
                  </span>
                  <span>total dishes prepared</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Main Charts Grid (Requirement #5) ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Multi-Axis Area Chart (Spans 2 columns) */}
        <Card className="lg:col-span-2 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">Sales & Order Volume Timeline</CardTitle>
              <CardDescription className="text-xs">
                Hourly and daily sales velocity over the selected timeframe
              </CardDescription>
            </div>
            <div className="inline-flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
              <button
                onClick={() => setTimelineMetric('revenue')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  timelineMetric === 'revenue'
                    ? 'bg-[#741052] text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Revenue (PKR)
              </button>
              <button
                onClick={() => setTimelineMetric('orders')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  timelineMetric === 'orders'
                    ? 'bg-[#741052] text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Order Volume
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.timeline || []}>
                  <defs>
                    <linearGradient id="colorPlum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#741052" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#741052" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="label"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      timelineMetric === 'revenue' ? `Rs. ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}` : val
                    }
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const row = payload[0].payload;
                        return (
                          <div className="bg-neutral-950/90 text-white p-3 rounded-xl shadow-xl backdrop-blur-md border border-white/10 text-xs space-y-1">
                            <p className="font-bold text-rose-300">{label} ({row.date})</p>
                            <p className="text-emerald-400 font-semibold">Revenue: Rs. {row.revenue?.toLocaleString()}</p>
                            <p className="text-neutral-300">Total Orders: {row.orders}</p>
                            <p className="text-neutral-400">Delivered: {row.delivered} · Void: {row.cancelled}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={timelineMetric === 'revenue' ? 'revenue' : 'orders'}
                    stroke="#741052"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPlum)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Channels & Fulfillment Split (Requirement #4) */}
        <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
          <CardTitle className="text-base sm:text-lg font-bold mb-1">Order Channels Split</CardTitle>
          <CardDescription className="text-xs mb-4">
            Dine-In, Delivery & Takeaway Fulfillment Breakdown
          </CardDescription>

          <div className="h-52 w-full flex items-center justify-center">
            {loading ? (
              <Skeleton className="h-44 w-44 rounded-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.channels.fulfillment || []}
                    dataKey="orderCount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data?.channels.fulfillment.map((entry) => (
                      <Cell
                        key={entry.type}
                        fill={CHANNEL_COLORS[entry.type] || '#741052'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-neutral-950/90 text-white p-2.5 rounded-xl shadow-xl backdrop-blur-md border border-white/10 text-xs">
                            <p className="font-bold">{item.label}</p>
                            <p className="text-rose-300">{item.orderCount} orders ({item.share}%)</p>
                            <p className="text-emerald-400">Rs. {item.totalRevenue?.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Channel Legend List */}
          <div className="space-y-2 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            {data?.channels.fulfillment.map((item) => (
              <div key={item.type} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CHANNEL_COLORS[item.type] || '#741052' }}
                  />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 dark:text-white">{item.orderCount} orders</span>
                  <span className="text-neutral-400 text-[11px]">({item.share}%)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Operational Intelligence: Peak Rush Hours & Day of Week ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Rush Hours Bar Chart (Feature A1) */}
        <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#741052]" />
                <CardTitle className="text-base font-bold">Peak Kitchen Rush Hours</CardTitle>
              </div>
              <CardDescription className="text-xs">
                24-hour order distribution to optimize kitchen prep & staffing
              </CardDescription>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg">
              Rush Window: 7 PM – 1 AM
            </span>
          </div>

          <div className="h-56 w-full">
            {loading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.peakHours || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="hourLabel"
                    stroke="#888888"
                    fontSize={9}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0].payload;
                        return (
                          <div className="bg-neutral-950/90 text-white p-2.5 rounded-xl shadow-xl backdrop-blur-md border border-white/10 text-xs">
                            <p className="font-bold text-rose-300">{p.hourLabel}</p>
                            <p className="text-white font-semibold">{p.orderCount} Orders placed</p>
                            <p className="text-emerald-400">Rs. {p.totalRevenue?.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="orderCount"
                    fill="#741052"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Day-of-the-Week Sales Distribution */}
        <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base font-bold">Day-of-the-Week Sales Trends</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Weekly sales distribution comparing weekday vs weekend spikes
              </CardDescription>
            </div>
          </div>

          <div className="h-56 w-full">
            {loading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.dayOfWeekTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="shortDay" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-neutral-950/90 text-white p-2.5 rounded-xl shadow-xl backdrop-blur-md border border-white/10 text-xs">
                            <p className="font-bold text-emerald-400">{d.dayName}</p>
                            <p className="text-white">{d.orderCount} Orders</p>
                            <p className="text-rose-300 font-semibold">Rs. {d.totalRevenue?.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="orderCount" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* ── Product Performance Leaderboard & Low Velocity Alerts (Req #1, #2, A5) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Product Sales Table (Spans 2 columns on desktop) */}
        <Card className="xl:col-span-2 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-base sm:text-lg font-bold">Product Sales & Order Frequency</CardTitle>
              </div>
              <CardDescription className="text-xs">
                How many times each dish was ordered, total units sold, and revenue share
              </CardDescription>
            </div>

            {/* Search and Sort Filter */}
            <div className="flex items-center gap-2">
              <div className="relative w-44 sm:w-52">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search dish..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl"
                />
              </div>
              <select
                value={productSortBy}
                onChange={(e: any) => setProductSortBy(e.target.value)}
                className="h-8 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-2 font-medium"
              >
                <option value="quantity">Sort: Units Sold</option>
                <option value="revenue">Sort: Revenue</option>
                <option value="orders">Sort: Times Ordered</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-neutral-100/90 dark:bg-neutral-800/90 backdrop-blur-md text-neutral-500 font-bold uppercase tracking-wider text-[10px] z-10 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="py-3 px-4">Rank & Item</th>
                  <th className="py-3 px-3 text-center">Times Ordered</th>
                  <th className="py-3 px-3 text-center">Units Sold</th>
                  <th className="py-3 px-3 text-center">Avg / Order</th>
                  <th className="py-3 px-4 text-right">Gross Revenue</th>
                  <th className="py-3 px-4 text-right">Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="p-3">
                        <Skeleton className="h-8 w-full rounded" />
                      </td>
                    </tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400">
                      No products found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              item.rank === 1
                                ? 'bg-amber-400 text-amber-950 font-black shadow-sm'
                                : item.rank === 2
                                ? 'bg-slate-300 text-slate-800 font-bold'
                                : item.rank === 3
                                ? 'bg-amber-700 text-amber-100'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            #{item.rank}
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#741052] dark:text-rose-400 font-bold">
                          {item.timesOrdered}x
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-neutral-900 dark:text-white">
                        {item.totalQuantity}
                      </td>
                      <td className="py-2.5 px-3 text-center text-neutral-500 font-semibold">
                        {item.avgQuantityPerOrder}
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-neutral-900 dark:text-white">
                        Rs. {item.totalRevenue.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                            <div
                              className="h-full bg-[#741052] rounded-full"
                              style={{ width: `${Math.min(100, item.revenueShare * 2)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-neutral-500 font-bold w-9 text-right">
                            {item.revenueShare}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Low-Velocity / Stagnant Menu Alerts (Feature A5) */}
        <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-base font-bold">Zero-Order Menu Items</CardTitle>
            </div>
            <CardDescription className="text-xs mb-4">
              Catalog items with 0 sales in the selected timeframe (consider promotions or pairing)
            </CardDescription>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))
              ) : data?.stagnantProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8" />
                  All active dishes had orders in this timeframe!
                </div>
              ) : (
                data?.stagnantProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-xs"
                  >
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white truncate max-w-[170px]">
                        {p.title}
                      </p>
                      <p className="text-[10px] text-neutral-500">{p.category} · Rs. {p.price}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                      0 Orders
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
            Tip: Create combo platters or cart upsells for dormant dishes to boost menu velocity.
          </div>
        </Card>
      </div>

      {/* ── Delivery Areas (Req #3) & Basket Affinity (Feature A2) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Ordered Areas (Requirement #3) */}
        <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-600" />
                <CardTitle className="text-base font-bold">Top Delivery Areas & Revenue</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Most popular delivery destinations ranked by order count & revenue
              </CardDescription>
            </div>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))
            ) : data?.areaAnalytics.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-400">
                No delivery area records for this period.
              </div>
            ) : (
              data?.areaAnalytics.map((area, idx) => (
                <div
                  key={area.area}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white">{area.area}</p>
                      <p className="text-[10px] text-neutral-400">
                        {area.orderCount} delivery orders ({area.revenueShare}% share)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-neutral-900 dark:text-white">
                      Rs. {area.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      Fees: Rs. {area.totalDeliveryCharges}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Frequently Bought Together (Feature A2) */}
        <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-base font-bold">Frequently Bought Together</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Top item pairs co-ordered in multi-dish baskets (great for combo packaging)
              </CardDescription>
            </div>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))
            ) : data?.basketAffinity.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-400">
                Not enough multi-item orders in this period to compute pairings.
              </div>
            ) : (
              data?.basketAffinity.map((pair, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-200/70 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 flex items-center justify-center font-bold text-[10px]">
                      #{idx + 1}
                    </span>
                    <p className="font-bold text-neutral-900 dark:text-white">
                      {pair.pairLabel}
                    </p>
                  </div>
                  <span className="font-black text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full text-[11px]">
                    {pair.pairCount}x pairs
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── Customer Retention & Loyalty (Feature A4) ─────────────────────── */}
      <Card className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base sm:text-lg font-bold">Customer Loyalty & Retention Engine</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Tracking repeat diners vs new customers based on customer phone verification
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-neutral-400">Repeat Diner Rate</p>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                {data?.customerRetention.repeatRate || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Repeat Summary Box */}
          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 flex flex-col justify-center">
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2">
              Diner Breakdown
            </p>
            <div className="space-y-1 text-sm">
              <p className="flex justify-between">
                <span className="text-neutral-500">Total Unique Diners:</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {data?.customerRetention.totalIdentifiedCustomers || 0}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-neutral-500">First-Time Diners:</span>
                <span className="font-bold text-emerald-600">
                  {data?.customerRetention.newCustomers || 0}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-neutral-500">Repeat Diners (2+ Orders):</span>
                <span className="font-bold text-blue-600">
                  {data?.customerRetention.repeatCustomers || 0}
                </span>
              </p>
            </div>
          </div>

          {/* Top Loyal Diners Leaderboard (2 Cols) */}
          <div className="md:col-span-2 space-y-2">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Top Loyal Diners In This Period
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data?.customerRetention.topLoyalCustomers.map((c, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white truncate max-w-[120px]">
                        {c.name}
                      </p>
                      <p className="text-[10px] text-neutral-400">{c.phoneMasked}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-neutral-900 dark:text-white">{c.orderCount} Orders</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      Rs. {c.totalSpent.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Historical Order Ledger Drawer / Modal (Requirement #6) ──────── */}
      <AnimatePresence>
        {showLedgerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden"
            >
              {/* Ledger Header */}
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#741052] text-white flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-neutral-900 dark:text-white">
                      Immutable Historical Order Ledger
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Permanent audit records preserved forever even if live queue is cleared ({ledgerTotalOrders} total orders)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLedgerModal(false)}
                  className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Ledger Filter & Search Toolbar */}
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input
                    placeholder="Search by Order #, Customer Name, Phone, Area, Item..."
                    value={ledgerSearch}
                    onChange={(e) => {
                      setLedgerSearch(e.target.value);
                      setLedgerPage(1);
                    }}
                    className="pl-9 h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={ledgerStatus}
                    onChange={(e) => {
                      setLedgerStatus(e.target.value);
                      setLedgerPage(1);
                    }}
                    className="h-9 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-2 font-medium"
                  >
                    <option value="all">All Statuses</option>
                    <option value="delivered">Delivered / Completed</option>
                    <option value="received">Received / Active</option>
                    <option value="cancelled">Cancelled / Voided</option>
                  </select>

                  <select
                    value={ledgerOrderType}
                    onChange={(e) => {
                      setLedgerOrderType(e.target.value);
                      setLedgerPage(1);
                    }}
                    className="h-9 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-2 font-medium"
                  >
                    <option value="all">All Types</option>
                    <option value="delivery">Delivery</option>
                    <option value="dinein">Dine-In</option>
                    <option value="pickup">Pickup</option>
                  </select>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Order #</th>
                      <th className="p-2.5">Date & Time</th>
                      <th className="p-2.5">Customer & Mode</th>
                      <th className="p-2.5">Items Summary</th>
                      <th className="p-2.5">Total Amount</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                    {ledgerLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="p-3">
                            <Skeleton className="h-8 w-full rounded" />
                          </td>
                        </tr>
                      ))
                    ) : ledgerOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-neutral-400">
                          No historical orders match the current search filters.
                        </td>
                      </tr>
                    ) : (
                      ledgerOrders.map((ord) => (
                        <tr
                          key={ord.orderNumber}
                          className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                        >
                          <td className="p-2.5 font-mono font-bold text-[#741052] dark:text-rose-400">
                            #{ord.orderNumber}
                          </td>
                          <td className="p-2.5 text-neutral-500 text-[11px]">
                            {new Date(ord.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            <span className="text-neutral-400">
                              {new Date(ord.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <p className="font-bold text-neutral-900 dark:text-white truncate max-w-[140px]">
                              {ord.customerName}
                            </p>
                            <p className="text-[10px] text-neutral-400 uppercase">
                              {ord.ordertype === 'dinein'
                                ? `Table #${ord.tableNumber || '?'}`
                                : ord.ordertype === 'delivery'
                                ? ord.area || 'Delivery'
                                : 'Pickup'}
                            </p>
                          </td>
                          <td className="p-2.5 text-neutral-700 dark:text-neutral-300">
                            <span className="font-semibold text-neutral-900 dark:text-white">
                              {ord.items?.length || 0} items:
                            </span>{' '}
                            <span className="text-[11px] text-neutral-500 truncate max-w-[200px] inline-block align-bottom">
                              {ord.items?.map((it) => `${it.quantity}x ${it.title}`).join(', ')}
                            </span>
                          </td>
                          <td className="p-2.5 font-black text-neutral-900 dark:text-white">
                            Rs. {ord.totalAmount?.toLocaleString()}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                /^(delivered|completed)$/i.test(ord.status)
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : /^(cancelled|canceled|voided)$/i.test(ord.status)
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedLedgerOrder(ord)}
                              className="h-7 px-2 text-xs rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#741052] dark:text-rose-400 font-bold"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Ledger Pagination Footer */}
              <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">
                  Showing page {ledgerPage} of {Math.max(1, Math.ceil(ledgerTotalOrders / 15))}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={ledgerPage <= 1}
                    onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                    className="h-7 rounded-lg text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={ledgerPage >= Math.ceil(ledgerTotalOrders / 15)}
                    onClick={() => setLedgerPage((p) => p + 1)}
                    className="h-7 rounded-lg text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Individual Order Ticket Inspector Modal ──────────────────────── */}
      <AnimatePresence>
        {selectedLedgerOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-r from-[#741052] to-[#911366] text-white flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-rose-200">Historical Ticket</span>
                  <h3 className="text-xl font-black">#{selectedLedgerOrder.orderNumber}</h3>
                </div>
                <button
                  onClick={() => setSelectedLedgerOrder(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                {/* Customer Details */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1.5 border border-neutral-100 dark:border-neutral-700/50">
                  <p className="flex justify-between">
                    <span className="text-neutral-500">Customer:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {selectedLedgerOrder.customerName}
                    </span>
                  </p>
                  {selectedLedgerOrder.phone && (
                    <p className="flex justify-between">
                      <span className="text-neutral-500">Phone:</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {selectedLedgerOrder.phone}
                      </span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span className="text-neutral-500">Order Type:</span>
                    <span className="font-bold uppercase text-[#741052] dark:text-rose-400">
                      {selectedLedgerOrder.ordertype}
                      {selectedLedgerOrder.tableNumber && ` (Table #${selectedLedgerOrder.tableNumber})`}
                      {selectedLedgerOrder.area && ` (${selectedLedgerOrder.area})`}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-neutral-500">Date & Time:</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {new Date(selectedLedgerOrder.createdAt).toLocaleString()}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-neutral-500">Status:</span>
                    <span className="font-bold text-emerald-600">{selectedLedgerOrder.status}</span>
                  </p>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <p className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[10px]">
                    Ordered Items
                  </p>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden">
                    {selectedLedgerOrder.items?.map((it, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between bg-white dark:bg-neutral-900">
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-white">
                            {it.quantity}x {it.title}
                          </p>
                          {it.variations && it.variations.length > 0 && (
                            <p className="text-[10px] text-neutral-400">
                              {it.variations.join(', ')}
                            </p>
                          )}
                        </div>
                        <p className="font-black text-neutral-900 dark:text-white">
                          Rs. {(it.price * it.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Breakdown */}
                <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 space-y-1 text-xs">
                  {selectedLedgerOrder.deliveryCharge > 0 && (
                    <p className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Delivery Fee:</span>
                      <span>Rs. {selectedLedgerOrder.deliveryCharge}</span>
                    </p>
                  )}
                  <p className="flex justify-between text-sm font-black text-neutral-900 dark:text-white pt-1 border-t border-neutral-200 dark:border-neutral-700">
                    <span>Total Paid:</span>
                    <span className="text-[#741052] dark:text-rose-400">
                      Rs. {selectedLedgerOrder.totalAmount?.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                <Button
                  onClick={() => setSelectedLedgerOrder(null)}
                  className="bg-[#741052] hover:bg-[#8c1463] text-white rounded-xl text-xs font-bold"
                >
                  Close Inspection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Safe Purge Live Queue Modal (Feature A6) ───────────────────────── */}
      <AnimatePresence>
        {showPurgeModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden"
            >
              <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">Safe Purge Live Orders</h3>
                    <p className="text-[11px] text-rose-100">Zero-Loss Data Safety Guaranteed</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPurgeModal(false)}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 space-y-1.5 leading-relaxed">
                  <p className="font-bold">What happens during a Safe Purge?</p>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                    Completed, delivered, and cancelled orders are safely removed from the active Live Orders queue to keep the dashboard ultra-fast.
                  </p>
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    100% of these order records are permanently preserved in the Historical Order Ledger for analytics and exports.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[10px]">
                    Select Retention Period
                  </label>
                  <select
                    value={purgeDays}
                    onChange={(e) => setPurgeDays(Number(e.target.value))}
                    className="w-full h-10 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 font-semibold text-xs text-neutral-900 dark:text-white"
                  >
                    <option value={30}>Purge closed orders older than 30 days</option>
                    <option value={14}>Purge closed orders older than 14 days</option>
                    <option value={7}>Purge closed orders older than 7 days</option>
                    <option value={0}>Purge all completed & cancelled orders</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowPurgeModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExecutePurge}
                  disabled={purgeLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30"
                >
                  {purgeLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Execute Safe Purge
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyticsPage;
