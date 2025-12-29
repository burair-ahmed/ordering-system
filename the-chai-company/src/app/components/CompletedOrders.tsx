/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import { FC, useEffect, useState } from 'react';
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
} from 'lucide-react';
import Preloader from './Preloader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

const CompletedOrders: FC = () => {
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchCompletedOrders = async (targetPage = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fetchorders?status=completed&page=${targetPage}&limit=12`);
      const data = await response.json();
      if (response.ok) {
        setCompletedOrders(data.orders || []);
        setPage(data.page || targetPage);
        setTotalPages(data.totalPages || 1);
      } else {
        alert('Failed to fetch completed orders.');
      }
    } catch (error) {
      console.error('Error fetching completed orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedOrders(1);
  }, []);

  const handleDeleteOrder = (orderNumber: string) => {
    setSelectedOrder(orderNumber);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrder || !password) {
      setErrorMessage('Password is required.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/deleteorder?orderNumber=${selectedOrder}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setCompletedOrders((prev) =>
          prev.filter((order) => order.orderNumber !== selectedOrder)
        );
        setErrorMessage(null);
      } else {
        const data = await response.json();
        setErrorMessage(data.message || 'Failed to delete order.');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      setErrorMessage('An error occurred while deleting the order.');
    } finally {
      setLoading(false);
      setShowModal(false);
      setPassword('');
      setSelectedOrder(null);
    }
  };

  const toggleSelect = (orderNumber: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderNumber)) next.delete(orderNumber);
      else next.add(orderNumber);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedOrders(new Set(completedOrders.map((o) => o.orderNumber)));
  };

  const clearSelection = () => setSelectedOrders(new Set());

  const filtered = completedOrders.filter((o) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      o.orderNumber.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      (o.phone || '').toLowerCase().includes(term)
    );
  });

  const bulkDelete = () => {
    if (selectedOrders.size === 0) return;
    setSelectedOrder(Array.from(selectedOrders)[0]);
    setShowModal(true);
  };

  const bulkExportCsv = () => {
    if (filtered.length === 0) return;
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
    const rows = filtered.map((o) =>
      headers
        .map((h) => {
          const val = (o as any)[h] ?? "";
          if (typeof val === "string" && val.includes(",")) return `"${val}"`;
          return val;
        })
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `completed-orders-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cancelDelete = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setPassword('');
    setErrorMessage(null);
  };

  const statusColors: Record<string, string> = {
    Completed: 'bg-green-100 text-green-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

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

  return (
    <>
      {loading && <Preloader />}

      {/* 🔒 Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-96 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-lg font-semibold mb-3 text-[#C46A47]">Confirm Deletion</h2>
              <p className="mb-4">Are you sure you want to delete Order #{selectedOrder}?</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border px-3 py-2 mb-3 focus:ring-2 focus:ring-[#C46A47] outline-none"
              />
              {errorMessage && <p className="text-red-500 mb-3">{errorMessage}</p>}
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white hover:scale-105 transition"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order #, name, phone"
            className="h-10"
          />
          <Button variant="outline" onClick={() => fetchCompletedOrders(1)}>
            Refresh
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Button variant="outline" size="sm" onClick={selectAllVisible}>
            Select all
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={bulkDelete} disabled={selectedOrders.size === 0}>
            Delete selected
          </Button>
          <Button variant="outline" size="sm" onClick={bulkExportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* 📦 Orders Grid */}
      <div className="max-h-[60vh] overflow-y-auto px-2">
        {filtered.length === 0 ? (
          <p className="text-xl text-gray-600 text-center py-10">
            No completed orders yet.
          </p>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {filtered.map((order) => (
              <motion.div
                key={order.orderNumber}
                className="rounded-2xl border border-[#C46A47]/20 bg-white dark:bg-neutral-800 shadow-md hover:shadow-xl hover:scale-[1.01] transition relative"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-neutral-700 flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.orderNumber)}
                      onChange={() => toggleSelect(order.orderNumber)}
                      className="accent-emerald-600"
                    />
                    <div>
                      <h2 className="text-lg font-bold text-[#C46A47]">
                        Order <span className="text-sm text-neutral-500">#{order.orderNumber}</span>
                      </h2>
                      <p className="text-xs text-neutral-500">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-full leading-none ${
                        statusColors[order.status] || "bg-gray-100 text-gray-700"
                      }`}
                      style={{ minHeight: "26px" }}
                    >
                      {order.status}
                    </span>
                    <p className="text-[#C46A47] font-bold text-base leading-none">
                      Rs. {order.totalAmount}
                    </p>
                  </div>
                </div>



                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-3 p-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <User size={16} />
                    <span className="truncate">{order.customerName}</span>
                  </div>
                  {order.tableNumber && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Hash size={16} />
                      <span>Table {order.tableNumber}</span>
                    </div>
                  )}
                  {order.area && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <MapPin size={16} />
                      <span>{order.area}</span>
                    </div>
                  )}
                  {order.phone && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Phone size={16} />
                      <span>{order.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Mail size={16} />
                    <span className="truncate">{order.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CreditCard size={16} />
                    <span>{order.paymentMethod}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 col-span-2">
                    <UtensilsCrossed size={16} />
                    <span>Order Type: {formatOrderType(order.ordertype)}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 col-span-2">
                    Placed on: {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Items Collapse */}
                <div className="border-t border-gray-100 dark:border-neutral-700">
                  <button
                    onClick={() =>
                      setExpanded((prev) =>
                        prev === order.orderNumber ? null : order.orderNumber
                      )
                    }
                    className="w-full text-left px-4 py-2 text-sm font-medium text-[#C46A47] hover:bg-[#C46A47]/5 transition"
                  >
                    {expanded === order.orderNumber ? 'Hide Items' : 'View Items'}
                  </button>
                  <AnimatePresence>
                    {expanded === order.orderNumber && (
                      <motion.div
                        className="px-4 pb-4 space-y-2"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        {order.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center bg-gray-50 dark:bg-neutral-700 px-3 py-2 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-100">
                                {item.title} × {item.quantity}
                              </p>
                              {item.variations && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.variations.map((v, j) => (
                                    <span
                                      key={j}
                                      className="bg-[#6B3F2A] text-white text-xs px-2 py-0.5 rounded-full"
                                    >
                                      {typeof v === 'object'
                                        ? `${v.name}: ${v.value}`
                                        : v}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              Rs. {item.price * item.quantity}
                            </p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center gap-3 p-4 border-t border-gray-100 dark:border-neutral-700">
                  <button
                    onClick={() => handleDeleteOrder(order.orderNumber)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium hover:scale-105 shadow transition"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob(
                        [
                          JSON.stringify(
                            {
                              orderNumber: order.orderNumber,
                              customerName: order.customerName,
                              email: order.email,
                              ordertype: order.ordertype,
                              status: order.status,
                              paymentMethod: order.paymentMethod,
                              totalAmount: order.totalAmount,
                              area: order.area,
                              phone: order.phone,
                              tableNumber: order.tableNumber,
                              items: order.items,
                              createdAt: order.createdAt,
                            },
                            null,
                            2
                          ),
                        ],
                        { type: 'application/json' }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `order-${order.orderNumber}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#C46A47] to-[#A65638] text-white text-sm font-medium hover:opacity-90 transition shadow"
                  >
                    <Download size={16} /> Invoice
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
};

export default CompletedOrders;
