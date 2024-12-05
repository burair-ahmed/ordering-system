'use client';

import { FC, useState, useEffect } from "react";

// Define interfaces for the data structures
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

const AnalyticsPage: FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [filter, setFilter] = useState<string>("today");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [tableDetails, setTableDetails] = useState<TableDetail[] | null>(null); // State for table details

  // Fetch analytics data based on the selected filter and optional date range
  const fetchAnalytics = async (filter: string, startDate?: string, endDate?: string) => {
    try {
      const query = new URLSearchParams();
      query.append("filter", filter);
      if (startDate && endDate) {
        query.append("startDate", startDate);
        query.append("endDate", endDate);
      }

      const response = await fetch(`/api/analytics?${query.toString()}`);
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    }
  };

  // Fetch details for a specific table
  const fetchTableDetails = async (tableNumber: string) => {
    try {
      const response = await fetch(`/api/analytics/details?tableNumber=${tableNumber}`);
      const data = await response.json();
      setTableDetails(data);
    } catch (error) {
      console.error("Failed to fetch table details", error);
    }
  };

  // Fetch data whenever filter or dates change
  useEffect(() => {
    fetchAnalytics(filter, startDate, endDate);
  }, [filter, startDate, endDate]);

  // Handle custom date filter
  const handleCustomDateFilter = () => {
    if (startDate && endDate) {
      setFilter("custom");
      fetchAnalytics("custom", startDate, endDate);
    }
  };

  // Handle table click to fetch specific table details
  const handleTableClick = (tableNumber: string) => {
    fetchTableDetails(tableNumber);
  };

  // Display loading state if analytics data is not available
  if (!analyticsData) return <div>Loading...</div>;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-8 text-center text-gray-800">Analytics</h1>

      {/* Filter Buttons */}
      <div className="flex justify-center gap-6 mb-8">
        {["today", "week", "last-week", "month", "last-month"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 
            ${filter === item ? "bg-[#741052] shadow-lg" : "bg-gray-500 hover:bg-[#741052]"}`}
          >
            {item === "last-week" ? "Last Week" : item === "last-month" ? "Last Month" : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {/* Custom Date Filter */}
      <div className="mb-8 text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Custom Date Range</h3>
        <div className="flex justify-center gap-6">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#741052] shadow-md transition-all duration-300 border-[#741052]"
          />
          <span className="text-2xl font-bold text-gray-600">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#741052] shadow-md transition-all duration-300 border-[#741052]"
          />
          <button
            onClick={handleCustomDateFilter}
            className="px-6 py-3 rounded-lg bg-[#741052] text-white font-semibold transition-all duration-300 hover:bg-[#741052]/90"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Total Revenue and Table Analytics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
          Total Revenue: <span className="text-[#741052]">Rs. {analyticsData.totalRevenueCombined.toFixed(2)}</span>
        </h2>

        <h3 className="text-lg font-semibold text-gray-700 text-center mb-4">Orders by Table</h3>
        <div className="overflow-x-auto rounded-lg shadow-lg bg-white p-4">
          <table className="min-w-full text-left table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Table Number</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Order Count</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.tableAnalytics.map((item: TableAnalytics) => (
                <tr
                  key={item.tableNumber}
                  className="hover:bg-gray-50 cursor-pointer transition-all duration-200"
                  onClick={() => handleTableClick(item.tableNumber)}
                >
                  <td className="px-6 py-4 text-sm text-gray-700">{item.tableNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.orderCount}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">Rs. {item.totalRevenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Display table details when clicked */}
      {tableDetails && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Table Details</h3>
          <div className="overflow-x-auto rounded-lg shadow-lg bg-white p-4">
            <table className="min-w-full text-left table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Item Name</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Quantity Ordered</th>
                </tr>
              </thead>
              <tbody>
                {tableDetails.map((item: TableDetail) => (
                  <tr key={item.itemName} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{item.itemName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.totalQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
