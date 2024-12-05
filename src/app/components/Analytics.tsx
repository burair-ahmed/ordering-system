import { FC, useState, useEffect } from "react";

const AnalyticsPage: FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [filter, setFilter] = useState<string>("today");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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

  useEffect(() => {
    fetchAnalytics(filter, startDate, endDate);
  }, [filter, startDate, endDate]);

  const handleCustomDateFilter = () => {
    if (startDate && endDate) {
      setFilter("custom");
      fetchAnalytics("custom", startDate, endDate);
    }
  };

  if (!analyticsData) return <div>Loading...</div>;

  return (
    <div className="admin-container bg-gray-50 min-h-screen p-8">
      <h1 className="text-3xl font-semibold mb-6 text-center text-[#741052]">Analytics Dashboard</h1>

      <div className="mb-8 flex justify-center gap-6 flex-wrap">
        <button
          onClick={() => setFilter("today")}
          className="bg-[#741052] text-white px-6 py-2 rounded-md hover:bg-[#5f1843] transition"
        >
          Today
        </button>
        <button
          onClick={() => setFilter("week")}
          className="bg-[#741052] text-white px-6 py-2 rounded-md hover:bg-[#5f1843] transition"
        >
          This Week
        </button>
        <button
          onClick={() => setFilter("last-week")}
          className="bg-[#741052] text-white px-6 py-2 rounded-md hover:bg-[#5f1843] transition"
        >
          Last Week
        </button>
        <button
          onClick={() => setFilter("month")}
          className="bg-[#741052] text-white px-6 py-2 rounded-md hover:bg-[#5f1843] transition"
        >
          This Month
        </button>
        <button
          onClick={() => setFilter("last-month")}
          className="bg-[#741052] text-white px-6 py-2 rounded-md hover:bg-[#5f1843] transition"
        >
          Last Month
        </button>
      </div>

      <div className="mb-8 text-center">
        <h3 className="text-lg font-medium text-[#741052]">Custom Date Range</h3>
        <div className="flex justify-center gap-4 mt-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-[#741052] px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#741052] transition"
          />
          <span className="text-xl font-semibold text-[#741052]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-[#741052] px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#741052] transition"
          />
          <button
            onClick={handleCustomDateFilter}
            className="bg-[#741052] text-white px-6 py-2 rounded-md hover:bg-[#5f1843] transition"
          >
            Apply
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-6 text-center text-[#741052]">
        Total Revenue: Rs. {analyticsData.totalRevenueCombined.toFixed(2)}
      </h2>

      <h3 className="text-lg font-semibold mb-6 text-[#741052]">Orders by Table</h3>
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4">
        <table className="table-auto w-full text-left border-collapse">
          <thead className="bg-[#741052] text-white">
            <tr>
              <th className="border px-4 py-2">Table Number</th>
              <th className="border px-4 py-2">Order Count</th>
              <th className="border px-4 py-2">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {analyticsData.tableAnalytics.map((item: any) => (
              <tr key={item.tableNumber} className="hover:bg-gray-100">
                <td className="border px-4 py-2">{item.tableNumber}</td>
                <td className="border px-4 py-2">{item.orderCount}</td>
                <td className="border px-4 py-2">Rs. {item.totalRevenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsPage;
