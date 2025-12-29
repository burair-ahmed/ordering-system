'use client';

import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Interfaces
interface TableAnalytics {
  tableNumber: string;
  orderCount: number;
  totalRevenue: number;
}
interface AnalyticsData {
  totalRevenueCombined: number;
  tableAnalytics: TableAnalytics[];
}
interface TableDetail {
  itemName: string;
  totalQuantity: number;
}

const COLORS = ["#741052", "#d0269b", "#1f1f1f", "#f9f9f9"];

const AnalyticsPage: FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [filter, setFilter] = useState<string>("today");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [tableDetails, setTableDetails] = useState<TableDetail[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch analytics
  const fetchAnalytics = async (filter: string, startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.append("filter", filter);
      if (startDate && endDate) {
        query.append("startDate", startDate);
        query.append("endDate", endDate);
      }
      const res = await fetch(`/api/analytics?${query.toString()}`);
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableDetails = async (tableNumber: string) => {
    try {
      const res = await fetch(`/api/analytics/details?tableNumber=${tableNumber}`);
      const data = await res.json();
      setTableDetails(data);
    } catch (err) {
      console.error("Failed to fetch details", err);
    }
  };

  useEffect(() => {
    fetchAnalytics(filter, startDate, endDate);
  }, [filter, startDate, endDate]);

  const handleCustomDate = () => {
    if (startDate && endDate) {
      setFilter("custom");
      fetchAnalytics("custom", startDate, endDate);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#f9f9f9] max-h-[500px] overflow-y-auto">
      {/* Header */}
      <h1 className="text-3xl font-bold text-[#1f1f1f] text-center">Analytics Dashboard</h1>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-3">
        {["today", "week", "last-week", "month", "last-month"].map((item) => (
          <Button
            key={item}
            onClick={() => setFilter(item)}
            className={`${
              filter === item
                ? "bg-[#741052] hover:bg-[#d0269b] text-white"
                : "bg-gray-200 text-[#1f1f1f] hover:bg-gray-300"
            }`}
          >
            {item === "last-week" ? "Last Week" : item === "last-month" ? "Last Month" : item.charAt(0).toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>

      {/* Custom Date Range */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-center">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span className="font-semibold">to</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button className="bg-[#741052] hover:bg-[#d0269b] text-white" onClick={handleCustomDate}>
            Apply
          </Button>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold text-[#741052]">
                  Rs. {analyticsData?.totalRevenueCombined.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Example: add more metric cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold text-[#741052]">
                  {analyticsData?.tableAnalytics.reduce((acc, t) => acc + t.orderCount, 0)}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData?.tableAnalytics}>
                    <Line type="monotone" dataKey="totalRevenue" stroke="#741052" strokeWidth={3} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tableNumber" />
                    <YAxis />
                    <Tooltip />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Orders by Table</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.tableAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tableNumber" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orderCount" fill="#d0269b" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pie Chart */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Revenue Share by Table</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData?.tableAnalytics}
                    dataKey="totalRevenue"
                    nameKey="tableNumber"
                    innerRadius={60}
                    outerRadius={100}
                    label
                  >
                    {analyticsData?.tableAnalytics.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Table Analytics with slide-in details */}
      <Card>
        <CardHeader>
          <CardTitle>Table Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData?.tableAnalytics.map((t) => (
                  <TableRow
                    key={t.tableNumber}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => fetchTableDetails(t.tableNumber)}
                  >
                    <TableCell>{t.tableNumber}</TableCell>
                    <TableCell>{t.orderCount}</TableCell>
                    <TableCell>Rs. {t.totalRevenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Slide-in panel */}
      <AnimatePresence>
        {tableDetails && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 right-0 w-full sm:w-1/3 h-full bg-white shadow-lg p-6 overflow-y-auto z-50"
          >
            <h2 className="text-xl font-bold text-[#741052] mb-4">Table Details</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableDetails.map((d) => (
                  <TableRow key={d.itemName}>
                    <TableCell>{d.itemName}</TableCell>
                    <TableCell>{d.totalQuantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              className="mt-6 bg-[#741052] hover:bg-[#d0269b] text-white"
              onClick={() => setTableDetails(null)}
            >
              Close
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyticsPage;
