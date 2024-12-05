import { FC, useState, useEffect } from "react";

const AnalyticsPage: FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [filter, setFilter] = useState<string>("today");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [tableDetails, setTableDetails] = useState<any>(null); // State for table details

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

  const fetchTableDetails = async (tableNumber: string) => {
    try {
      const response = await fetch(`/api/analytics/details?tableNumber=${tableNumber}`);
      const data = await response.json();
      setTableDetails(data);
    } catch (error) {
      console.error("Failed to fetch table details", error);
    }
  };

  useEffect(() => {
    fetchAnalytics(filter, startDate, endDate);
  }, [filter, startDate, endDate]);

  const handleCustomDateFilter = () => {
    if (startDate && endDate) {
      setFilter("custom");
      fetchAnalytics("custom", startDate, endDate);
    }
  };

  const handleTableClick = (tableNumber: string) => {
    fetchTableDetails(tableNumber); // Fetch details for the clicked table
  };

  if (!analyticsData) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Analytics</h1>

      <div className="mb-4 flex justify-center gap-4">
        <button
          onClick={() => setFilter("today")}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Today
        </button>
        <button
          onClick={() => setFilter("week")}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          This Week
        </button>
        <button
          onClick={() => setFilter("last-week")}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
        >
          Last Week
        </button>
        <button
          onClick={() => setFilter("month")}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition"
        >
          This Month
        </button>
        <button
          onClick={() => setFilter("last-month")}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Last Month
        </button>
      </div>

      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold">Custom Date Range</h3>
        <div className="flex justify-center gap-4 mt-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-4 py-2 rounded"
          />
          <span className="text-xl font-semibold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-4 py-2 rounded"
          />
          <button
            onClick={handleCustomDateFilter}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition"
          >
            Apply
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-center">
        Total Revenue: Rs. {analyticsData.totalRevenueCombined.toFixed(2)}
      </h2>

      <h3 className="text-lg font-semibold mb-4">Orders by Table</h3>
      <div className="overflow-x-auto">
        <table className="table-auto w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">Table Number</th>
              <th className="border px-4 py-2">Order Count</th>
              <th className="border px-4 py-2">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {analyticsData.tableAnalytics.map((item: any) => (
              <tr
                key={item.tableNumber}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleTableClick(item.tableNumber)}
              >
                <td className="border px-4 py-2">{item.tableNumber}</td>
                <td className="border px-4 py-2">{item.orderCount}</td>
                <td className="border px-4 py-2">Rs. {item.totalRevenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Display table details when clicked */}
      {tableDetails && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Table Details</h3>
          <table className="table-auto w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Item Name</th>
                <th className="border px-4 py-2">Quantity Ordered</th>
              </tr>
            </thead>
            <tbody>
              {tableDetails.map((item: any) => (
                <tr key={item.itemName}>
                  <td className="border px-4 py-2">{item.itemName}</td>
                  <td className="border px-4 py-2">{item.totalQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
