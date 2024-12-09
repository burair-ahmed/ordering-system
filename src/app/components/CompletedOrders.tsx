'use client';

import { FC, useEffect, useState } from "react";

interface Order {
  orderNumber: string;
  customerName: string;
  email: string;
  totalAmount: number;
  completedAt: string;
}

const CompletedOrders: FC = () => {
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        const response = await fetch("/api/fetchCompletedOrders");
        const data = await response.json();
  
        console.log("API Response:", data);
  
        if (response.ok) {
          setCompletedOrders(data.orders);
        } else {
          console.error("Failed to fetch completed orders:", data);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
  
    fetchCompletedOrders();
  }, []);
  

  return (
    <div>
      {completedOrders.length === 0 ? (
        <p>No completed orders found.</p>
      ) : (
        <ul>
          {completedOrders.map((order) => (
            <li key={order.orderNumber} className="border p-4 mb-2 rounded">
              <p><strong>Order Number:</strong> {order.orderNumber}</p>
              <p><strong>Customer Name:</strong> {order.customerName}</p>
              <p><strong>Total Amount:</strong> Rs. {order.totalAmount}</p>
              <p><strong>Completed At:</strong> {new Date(order.completedAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CompletedOrders;
