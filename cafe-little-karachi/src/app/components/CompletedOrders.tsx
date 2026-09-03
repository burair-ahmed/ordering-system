/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import { FC, useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  Mail,
  CreditCard,
  Hash,
  Trash2,
  Download,
  MapPin,
  Phone,
  UtensilsCrossed,
  Check,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Coins,
  FileSpreadsheet,
  Clock,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Item {
  id: string;
  title: string;
  quantity: number;
  price: number;
  variations?: { name: string; value: string }[] | string[];
}

export type OrderType = 'dinein' | 'pickup' | 'delivery';

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

interface SummaryStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  dineinCount: number;
  pickupCount: number;
  deliveryCount: number;
  ratios: {
    dinein: number;
    pickup: number;
    delivery: number;
  };
}

const CompletedOrders: FC = () => {
  const { toast } = useToast();
  
  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  
  // Pagination & Filtering
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Loader states
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);
  
  // Action tracking
  const [targetOrderNumber, setTargetOrderNumber] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page to 1 on new search query
    }, 450);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch summary metrics
  const fetchSummaryStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/analytics/archive-summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error loading analytics overview:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch completed orders list (respecting page, search query and active tab filters)
  const fetchOrders = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        status: 'completed',
        page: targetPage.toString(),
        limit: '12',
        searchTerm: debouncedSearch,
        ordertype: selectedType
      });
      
      const res = await fetch(`/api/fetchorders?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setPage(data.page || targetPage);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error('Failed response from completed orders gateway.');
      }
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Unable to retrieve completed order history.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedType, toast]);

  // Load baseline values
  useEffect(() => {
    fetchOrders(1);
    fetchSummaryStats();
  }, [fetchOrders]);

  // Single Delete trigger
  const handleDeleteOrder = (orderNumber: string) => {
    setTargetOrderNumber(orderNumber);
    setErrorMessage(null);
    setShowDeleteModal(true);
  };

  // Password confirmation gateway
  const confirmDelete = async () => {
    if (!targetOrderNumber || !password) {
      setErrorMessage('Verification credentials are required.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/deleteorder?orderNumber=${targetOrderNumber}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        toast({
          title: 'Order Deleted',
          description: `Order #${targetOrderNumber} has been permanently archived.`,
        });
        
        // Remove locally from state list
        setOrders((prev) => prev.filter((order) => order.orderNumber !== targetOrderNumber));
        setSelectedOrders((prev) => {
          const next = new Set(prev);
          next.delete(targetOrderNumber);
          return next;
        });
        
        setShowDeleteModal(false);
        setPassword('');
        setTargetOrderNumber(null);
        setErrorMessage(null);
        
        // Reload analytical statistics in card header
        fetchSummaryStats();
      } else {
        const data = await response.json();
        setErrorMessage(data.message || 'Verification credentials invalid.');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred during confirmation.');
    } finally {
      setLoading(false);
    }
  };

  // Selection managers
  const toggleSelect = (orderNumber: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderNumber)) next.delete(orderNumber);
      else next.add(orderNumber);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o) => o.orderNumber)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedOrders.size === 0) return;
    // Set first selection order as the deletion context note
    setTargetOrderNumber(Array.from(selectedOrders).join(', '));
    setErrorMessage(null);
    setShowDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    if (!password) {
      setErrorMessage('Verification credentials are required.');
      return;
    }
    setLoading(true);
    setIsBulkUpdating(true);
    try {
      const idsToDelete = Array.from(selectedOrders);
      let failedCount = 0;
      
      for (const orderNum of idsToDelete) {
        const res = await fetch(`/api/deleteorder?orderNumber=${orderNum}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        if (!res.ok) failedCount++;
      }

      if (failedCount === 0) {
        toast({
          title: 'Bulk Deletion Success',
          description: `Successfully deleted ${idsToDelete.length} matching order records.`,
        });
      } else {
        toast({
          title: 'Partial Archive Sync Complete',
          description: `Successfully updated ${idsToDelete.length - failedCount} records. (${failedCount} failed Verification checks).`,
          variant: 'destructive',
        });
      }

      setSelectedOrders(new Set());
      setShowDeleteModal(false);
      setPassword('');
      setTargetOrderNumber(null);
      setErrorMessage(null);
      
      // Sync list state
      fetchOrders(page);
      fetchSummaryStats();
    } catch (error) {
      setErrorMessage('Bulk action processing triggered a gateway error.');
    } finally {
      setLoading(false);
      setIsBulkUpdating(false);
    }
  };

  // CSV Export utility
  const exportCsv = () => {
    if (orders.length === 0) return;
    const headers = [
      "orderNumber",
      "customerName",
      "email",
      "ordertype",
      "status",
      "paymentMethod",
      "totalAmount",
      "area",
      "phone",
      "tableNumber",
      "createdAt",
    ];
    
    const rows = orders.map((o) =>
      headers
        .map((h) => {
          const val = (o as any)[h] ?? "";
          if (typeof val === "string" && val.includes(",")) return `"${val}"`;
          return val;
        })
        .join(",")
    );
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cafe-karachi-orders-page-${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'CSV Sheet Created',
      description: 'Order list parameters generated successfully.',
    });
  };

  // Format ordertype tags
  const formatOrderType = (type: OrderType) => {
    switch (type) {
      case 'dinein':
        return 'Dine In';
      case 'pickup':
        return 'Pickup';
      case 'delivery':
        return 'Delivery';
      default:
        return 'N/A';
    }
  };

  // Print Invoice utility
  const handlePrintInvoice = () => {
    window.print();
  };

  // Raw payload download utility
  const downloadRawJson = (order: Order) => {
    const blob = new Blob([JSON.stringify(order, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order.orderNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Payload Exported',
      description: `JSON payload for Order #${order.orderNumber} downloaded.`,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 🔒 INJECT RECIEPT PRINT STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide absolutely everything in standard layouts */
          body * {
            visibility: hidden;
            background: none !important;
          }
          /* Override visibility flags for print canvas blocks */
          #invoice-print-container, #invoice-print-container * {
            visibility: visible;
          }
          #invoice-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Modern Dashboard Stats Header */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border border-neutral-100 dark:border-neutral-800/80 bg-gradient-to-br from-white via-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-950/60 shadow-sm rounded-2xl relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Lifetime Orders</span>
            <Clock className="h-4 w-4 text-fuchsia-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loadingStats ? (
              <div className="h-8 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalOrders || 0}</div>
            )}
            <p className="text-[10px] text-neutral-500 mt-0.5">Fulfilled ticket checkout count</p>
          </CardContent>
        </Card>

        <Card className="border border-neutral-100 dark:border-neutral-800/80 bg-gradient-to-br from-white via-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-950/60 shadow-sm rounded-2xl relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Earnings</span>
            <Coins className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loadingStats ? (
              <div className="h-8 w-28 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                Rs. {summary?.totalRevenue.toLocaleString() || 0}
              </div>
            )}
            <p className="text-[10px] text-neutral-500 mt-0.5">Archive transaction volume sum</p>
          </CardContent>
        </Card>

        <Card className="border border-neutral-100 dark:border-neutral-800/80 bg-gradient-to-br from-white via-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-950/60 shadow-sm rounded-2xl relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Average ticket</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loadingStats ? (
              <div className="h-8 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Rs. {summary?.averageOrderValue.toLocaleString() || 0}
              </div>
            )}
            <p className="text-[10px] text-neutral-500 mt-0.5">AOV per active conversion</p>
          </CardContent>
        </Card>

        <Card className="border border-neutral-100 dark:border-neutral-800/80 bg-gradient-to-br from-white via-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-950/60 shadow-sm rounded-2xl relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Channel Ratios</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {loadingStats ? (
              <div className="space-y-1.5 pt-1">
                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="h-2 w-2/3 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-tight">
                  <span>Dine: {summary?.ratios.dinein || 0}%</span>
                  <span>Deliv: {summary?.ratios.delivery || 0}%</span>
                  <span>Pick: {summary?.ratios.pickup || 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                  <div className="bg-fuchsia-500 h-full" style={{ width: `${summary?.ratios.dinein || 0}%` }} />
                  <div className="bg-emerald-500 h-full" style={{ width: `${summary?.ratios.delivery || 0}%` }} />
                  <div className="bg-amber-500 h-full" style={{ width: `${summary?.ratios.pickup || 0}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main filter options and Search Header bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Archived Checkout History</h2>
          <p className="text-sm text-neutral-500">Search lifetime checkout items, audit sales statistics, export CSV, and print invoices.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* Order type pills */}
          <div className="flex bg-neutral-100/80 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200/20">
            {[
              { id: 'all', label: 'All orders' },
              { id: 'dinein', label: 'Dine-In' },
              { id: 'delivery', label: 'Delivery' },
              { id: 'pickup', label: 'Pickup' }
            ].map((tab) => {
              const active = selectedType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedType(tab.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    active 
                      ? 'bg-white dark:bg-neutral-700 text-[#741052] dark:text-white shadow-sm font-bold' 
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search container */}
          <div className="relative w-full sm:w-64 md:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search order #, customer name, phone..."
              className="h-10 pl-10 pr-4 rounded-xl border-neutral-200 focus-visible:ring-fuchsia-500"
            />
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              fetchOrders(page);
              fetchSummaryStats();
            }}
            className="h-10 w-10 border-neutral-200 rounded-xl"
            title="Refresh logs"
          >
            <RefreshCw className={`h-4 w-4 text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Select actions and utilities banner */}
      <div className="flex items-center justify-between px-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSelectAll}
          className="text-xs text-neutral-500 hover:text-neutral-900 gap-2 px-3 rounded-lg"
        >
          {selectedOrders.size === orders.length && orders.length > 0 ? (
            <Check className="h-4 w-4 text-fuchsia-600 animate-in zoom-in-50" />
          ) : (
            <div className="h-4 w-4 border border-neutral-400 rounded" />
          )}
          {selectedOrders.size === orders.length && orders.length > 0 ? 'Deselect All orders' : `Select All (${orders.length})`}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={exportCsv}
          disabled={orders.length === 0}
          className="text-xs text-neutral-500 hover:text-neutral-900 gap-2 px-3 rounded-lg border hover:border-neutral-200"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-400" />
          Export page CSV
        </Button>
      </div>

      {/* Completed Orders grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-neutral-150 shadow-sm bg-white dark:bg-neutral-900">
              <div className="p-4 border-b space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse" />
                </div>
                <div className="h-3.5 w-32 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
              </div>
              <div className="p-4 space-y-2">
                <div className="h-4 w-5/6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
              </div>
              <div className="p-4 border-t h-12 bg-neutral-50/50 dark:bg-neutral-900/50 animate-pulse" />
            </Card>
          ))
        ) : orders.length > 0 ? (
          orders.map((order) => {
            const isSelected = selectedOrders.has(order.orderNumber);
            const isExpanded = expandedOrder === order.orderNumber;
            return (
              <motion.div
                key={order.orderNumber}
                layoutId={`order-card-${order.orderNumber}`}
                className="group relative"
              >
                <Card 
                  className={`overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm bg-white/70 dark:bg-neutral-900/60 backdrop-blur-2xl ${
                    isSelected 
                      ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/10 dark:ring-fuchsia-500/20 shadow-md scale-[1.01]' 
                      : 'border-neutral-100 hover:border-fuchsia-200 hover:shadow-md dark:border-neutral-800'
                  }`}
                >
                  
                  {/* Select overlays Checkbox */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(order.orderNumber);
                    }}
                    className={`absolute top-4 right-4 z-30 h-7 w-7 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-fuchsia-600 text-white scale-100 shadow-sm shadow-fuchsia-500/25' 
                        : 'bg-black/40 text-white/70 hover:bg-black/60 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100'
                    }`}
                  >
                    {isSelected ? <Check className="h-4.5 w-4.5" /> : <div className="h-3.5 w-3.5 border border-white/70 rounded-sm" />}
                  </div>

                  {/* Header metadata */}
                  <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-start pr-12">
                    <div>
                      <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                        Order <span className="font-mono text-sm font-black">#{order.orderNumber}</span>
                      </h3>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Customer parameters list details */}
                  <div className="p-4 text-xs space-y-2.5">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-neutral-600 dark:text-neutral-300">
                      
                      <div className="flex items-center gap-2 overflow-hidden">
                        <User size={14} className="text-neutral-400 shrink-0" />
                        <span className="truncate font-semibold text-neutral-800 dark:text-neutral-200">{order.customerName}</span>
                      </div>

                      <div className="flex items-center gap-2 overflow-hidden">
                        <UtensilsCrossed size={14} className="text-neutral-400 shrink-0" />
                        <span className="truncate font-medium">{formatOrderType(order.ordertype)}</span>
                      </div>

                      {order.phone && (
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Phone size={14} className="text-neutral-400 shrink-0" />
                          <span className="truncate font-mono">{order.phone}</span>
                        </div>
                      )}

                      {order.tableNumber && (
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Hash size={14} className="text-neutral-400 shrink-0" />
                          <span className="truncate font-semibold text-neutral-800 dark:text-neutral-200">Table {order.tableNumber}</span>
                        </div>
                      )}

                      {order.area && (
                        <div className="flex items-center gap-2 overflow-hidden col-span-2">
                          <MapPin size={14} className="text-neutral-400 shrink-0" />
                          <span className="truncate">{order.area}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 overflow-hidden col-span-2">
                        <CreditCard size={14} className="text-neutral-400 shrink-0" />
                        <span className="truncate">{order.paymentMethod}</span>
                      </div>

                    </div>
                  </div>

                  {/* Expand Items accordion */}
                  <div className="border-t border-dashed border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10">
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.orderNumber)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-[#741052] dark:text-fuchsia-400 hover:bg-fuchsia-50/30 dark:hover:bg-neutral-800/30 transition-all flex items-center justify-between"
                    >
                      <span>{isExpanded ? 'Hide Item Summary' : 'View Itemized Items'}</span>
                      <span className="text-[10px] text-neutral-400 font-mono font-black uppercase">
                        {order.items.reduce((acc, current) => acc + current.quantity, 0)} Items
                      </span>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className="px-4 pb-4 pt-1 space-y-1.5"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-start bg-white dark:bg-neutral-800/80 border border-neutral-100 dark:border-neutral-800 px-3 py-2 rounded-xl text-xs"
                            >
                              <div className="space-y-0.5">
                                <p className="font-bold text-neutral-800 dark:text-neutral-200">
                                  {item.title} × {item.quantity}
                                </p>
                                {item.variations && item.variations.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.variations.map((v: any, j: number) => (
                                      <span
                                        key={j}
                                        className="bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                                      >
                                        {typeof v === 'object' ? `${v.name}: ${v.value}` : v}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="font-mono font-bold text-neutral-800 dark:text-neutral-100">
                                Rs. {item.price * item.quantity}
                              </p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex justify-between items-center gap-3 p-4 border-t border-neutral-100 dark:border-neutral-800 mt-0">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">Total Paid</span>
                      <span className="text-sm font-bold font-mono text-neutral-800 dark:text-neutral-100">
                        Rs. {order.totalAmount}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteOrder(order.orderNumber)}
                        className={
                          "text-neutral-600 dark:text-neutral-300 h-9 w-9 rounded-xl shrink-0 " +
                          "hover:text-rose-600 hover:bg-rose-500/10"
                        }
                        title="Delete permanently"
                      >
                        <Trash2 size={15} />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => downloadRawJson(order)}
                        className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-50 h-9 w-9 rounded-xl shrink-0"
                        title="Export JSON payload"
                      >
                        <Download size={15} />
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setActiveInvoice(order);
                          setShowInvoiceModal(true);
                        }}
                        className="h-9 gap-1.5 px-3 rounded-xl text-xs font-semibold hover:bg-fuchsia-50 hover:text-fuchsia-700 dark:hover:bg-neutral-800"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Invoice
                      </Button>
                    </div>
                  </div>

                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-neutral-500 bg-white dark:bg-neutral-900 border rounded-3xl">
            <Search className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">No completed orders found</p>
            <p className="text-xs text-neutral-400 mt-1">Try refining search parameters or active channels tabs.</p>
          </div>
        )}
      </div>

      {/* Modern pagination controller */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6 border-t border-neutral-100 dark:border-neutral-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(page - 1)}
            disabled={page === 1}
            className="rounded-xl gap-1 h-9"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          <span className="text-xs font-semibold text-neutral-500 px-3">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(page + 1)}
            disabled={page === totalPages}
            className="rounded-xl gap-1 h-9"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Floating bulk toolbar */}
      <AnimatePresence>
        {selectedOrders.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4"
          >
            <div className="flex items-center justify-between bg-neutral-900/95 dark:bg-black/95 backdrop-blur-xl border border-white/10 text-white p-3.5 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-3 pl-2">
                <div className="h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse" />
                <span className="text-sm font-semibold tracking-wide">
                  {selectedOrders.size} Selected
                </span>
                <span className="text-neutral-500">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrders(new Set())}
                  className="text-neutral-400 hover:text-white hover:bg-white/10 h-8 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={exportCsv}
                  className="h-9 px-3 gap-1.5 hover:bg-white/10 text-xs font-semibold text-white shrink-0 rounded-xl"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  Export csv
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkDelete}
                  className="h-9 px-3 gap-1.5 bg-[#741052] hover:bg-[#741052]/90 text-white text-xs font-semibold shrink-0 rounded-xl"
                >
                  <Trash2 className="h-4 w-4 text-rose-300" />
                  Delete selected
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔒 Deletion verification Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl backdrop-blur-2xl"
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Verify Admin Action</h2>
                  <p className="text-xs text-neutral-400 font-medium">Password required to delete order record(s)</p>
                </div>
              </div>
              
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
                You are about to delete order context matching: <strong className="font-mono text-rose-500 font-bold">{targetOrderNumber}</strong>. This deletion is absolute and cannot be undone.
              </p>

              <div className="space-y-3 mb-5">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator security password"
                  className="w-full h-11 rounded-xl border-neutral-200 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                />
                {errorMessage && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errorMessage}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPassword('');
                    setErrorMessage(null);
                  }}
                  className="rounded-xl h-10 px-4 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={selectedOrders.size > 0 && targetOrderNumber?.includes(',') ? confirmBulkDelete : confirmDelete}
                  disabled={loading}
                  className="rounded-xl h-10 px-4 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-rose-500/20 border-none"
                >
                  Confirm Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🧾 Invoice Printed Modal receipt */}
      <AnimatePresence>
        {showInvoiceModal && activeInvoice && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 px-4 overflow-y-auto pt-10 pb-10 no-print"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-neutral-900 border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              
              {/* Modal controls bar */}
              <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-900 px-5 py-3.5 border-b shrink-0">
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4 text-fuchsia-600 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Invoice Terminal</span>
                </div>
                <button
                  onClick={() => {
                    setShowInvoiceModal(false);
                    setActiveInvoice(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-700 h-8 w-8 hover:bg-neutral-100 rounded-lg flex items-center justify-center transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* PRINT CONTENT INVOICE FRAME */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white text-neutral-900" id="invoice-print-container">
                <div className="w-full text-center pb-6 border-b border-dashed border-neutral-200">
                  <h2 className="text-2xl font-black tracking-tight text-neutral-900">CAFE LITTLE KARACHI</h2>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-black mt-1">Authentic taste of Karachites</p>
                  <div className="mt-3 text-[10px] text-neutral-500 space-y-0.5">
                    <p>Scheme 33, Karachi, Pakistan</p>
                    <p>Phone: +92 312 786-0786</p>
                  </div>
                </div>

                <div className="py-4 space-y-1.5 text-xs text-neutral-600 border-b border-neutral-150">
                  <div className="flex justify-between">
                    <span className="font-semibold text-neutral-400">Order Reference:</span>
                    <span className="font-mono font-bold text-neutral-900">#{activeInvoice.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-neutral-400">Checkout Date:</span>
                    <span className="font-medium text-neutral-900">{new Date(activeInvoice.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-neutral-400">Channel / Type:</span>
                    <span className="font-bold text-neutral-900 uppercase">{formatOrderType(activeInvoice.ordertype)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-neutral-400">Payment Gateway:</span>
                    <span className="font-medium text-neutral-900">{activeInvoice.paymentMethod}</span>
                  </div>
                  
                  <div className="pt-2 border-t mt-2 text-neutral-600 text-[11px] space-y-1">
                    <p><strong className="font-semibold text-neutral-400">Customer:</strong> {activeInvoice.customerName}</p>
                    <p><strong className="font-semibold text-neutral-400">Contact:</strong> {activeInvoice.phone || 'N/A'}</p>
                    {activeInvoice.tableNumber && (
                      <p><strong className="font-semibold text-neutral-400">Dine-in Table:</strong> {activeInvoice.tableNumber}</p>
                    )}
                    {activeInvoice.area && (
                      <p><strong className="font-semibold text-neutral-400">Delivery Address:</strong> {activeInvoice.area}</p>
                    )}
                  </div>
                </div>

                {/* Products lines summary list */}
                <div className="py-4 space-y-3 border-b border-dashed border-neutral-200">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pb-1 flex justify-between">
                    <span>Menu Description</span>
                    <span>Subtotal</span>
                  </div>

                  {activeInvoice.items.map((line, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div>
                        <p className="font-bold text-neutral-900">{line.title} × {line.quantity}</p>
                        {line.variations && line.variations.length > 0 && (
                          <p className="text-[9px] text-neutral-400 mt-0.5">
                            {line.variations.map((v: any) => typeof v === 'object' ? `${v.name}: ${v.value}` : v).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-mono font-bold text-neutral-900">Rs. {line.price * line.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Grand summary math calculation */}
                <div className="pt-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-sm font-black text-neutral-900 pt-2">
                    <span className="uppercase tracking-wide">Grand Net Amount</span>
                    <span className="font-mono text-base">Rs. {activeInvoice.totalAmount}</span>
                  </div>
                </div>

                <div className="pt-8 text-center pb-4">
                  <p className="text-[10px] text-neutral-400 italic">Thank you for dining with Cafe Little Karachi!</p>
                  <p className="text-[9px] text-neutral-500 font-bold uppercase mt-1">Visit us again</p>
                </div>
              </div>

              {/* Action tools */}
              <div className="bg-neutral-50 dark:bg-neutral-900 px-5 py-4 border-t flex justify-end gap-2.5 shrink-0 no-print">
                <Button
                  variant="outline"
                  onClick={() => downloadRawJson(activeInvoice)}
                  className="rounded-xl h-10 px-4 text-xs font-semibold"
                >
                  Export payload
                </Button>
                <Button
                  onClick={handlePrintInvoice}
                  className="rounded-xl h-10 px-4 bg-gradient-to-r from-fuchsia-600 to-[#741052] text-white text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 border-none shadow-md shadow-fuchsia-500/10"
                >
                  <Printer className="h-4 w-4" /> Print Invoice / Receipt
                </Button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CompletedOrders;
