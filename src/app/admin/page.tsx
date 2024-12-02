'use client';

import { FC, useEffect, useState } from "react";

const AdminOrdersPage: FC = () => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const response = await fetch("/api/orders");
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders); // Assuming the API sends the orders in an array
      } else {
        alert("Failed to fetch orders.");
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.orderNumber} className="border p-4 rounded shadow-md">
              <h2 className="text-lg font-bold">{order.orderNumber}</h2>
              <p><strong>Name:</strong> {order.customerName}</p>
              <p><strong>Email:</strong> {order.email}</p>
              <p><strong>Table Number:</strong> {order.tableNumber}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
              <h3 className="font-bold mt-2">Items:</h3>
              <ul className="space-y-2">
                {order.items?.map((item: any, index: number) => (
                  <li key={`${item.id}-${index}`}>
                    <span>{item.title} x{item.quantity} - Rs. {item.price * item.quantity}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 font-bold">Total: Rs. {order.totalAmount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
