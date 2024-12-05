// /pages/analytics.tsx
'use client'


import { FC, useEffect, useState } from "react";

const AnalyticsPage: FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics");
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      }
    };

    fetchAnalytics();
  }, []);

  if (!analyticsData) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Daily Analytics</h1>
      
      <h2 className="text-xl font-semibold mb-4">Total Revenue: Rs. {analyticsData.totalRevenueCombined.toFixed(2)}</h2>

      <h3 className="text-lg font-semibold mb-4">Orders by Table</h3>
      <table className="table-auto w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2">Table Number</th>
            <th className="border px-4 py-2">Order Count</th>
            <th className="border px-4 py-2">Total Revenue</th>
          </tr>
        </thead>
        <tbody>
          {analyticsData.tableAnalytics.map((item: any) => (
            <tr key={item.tableNumber}>
              <td className="border px-4 py-2">{item.tableNumber}</td>
              <td className="border px-4 py-2">{item.orderCount}</td>
              <td className="border px-4 py-2">Rs. {item.totalRevenue.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnalyticsPage;
