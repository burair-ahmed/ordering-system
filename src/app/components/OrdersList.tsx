'use client';

import { FC, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Item {
  id: string;
  title: string;
  quantity: number;
  price: number;
  variations?: { name: string; value: string }[] | string[];
}

interface Order {
  orderNumber: string;
  customerName: string;
  email: string;
  tableNumber: string;
  status: string;
  paymentMethod: string;
  items: Item[];
  totalAmount: number;
}

const OrdersList: FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch initial orders
  useEffect(() => {
    const fetchOrders = async () => {
      const response = await fetch("/api/orders"); // Fetch orders from the backend
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        console.error("Failed to fetch orders:", data.message);
      }
    };

    fetchOrders();
  }, []);

  // Set up Socket.IO connection for real-time updates
  useEffect(() => {
    const socketInstance = io("/", { path: "/api/socket" });
    setSocket(socketInstance);

    // Log to check if connection is established
    socketInstance.on("connect", () => {
      console.log("Socket connected with ID:", socketInstance.id);
    });

    // Listen for new orders
    socketInstance.on("newOrder", (newOrder: Order) => {
      console.log("New order received:", newOrder); // This log should show the received new order

      setOrders((prevOrders) => [newOrder, ...prevOrders]); // Add the new order to the top

      // Play the notification sound
      try {
        const notificationSound = new Audio("/notification/notification.mp3");
        notificationSound.play()
          .then(() => {
            console.log("Notification sound played successfully");
          })
          .catch((error) => {
            console.error("Error playing notification sound:", error);
          });
      } catch (error) {
        console.error("Error setting up the notification sound:", error);
      }
    });

    return () => {
      socketInstance.disconnect(); // Clean up the connection
    };
  }, []);

  const updateOrderStatus = async (orderNumber: string, newStatus: string) => {
    try {
      const response = await fetch("/api/updateorderstatus", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNumber, status: newStatus }),
      });

      const data = await response.json();
      if (response.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.orderNumber === orderNumber ? { ...order, status: newStatus } : order
          )
        );
      } else {
        console.error("Failed to update order status:", data.message);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Test Button for playing the notification sound
  const testNotificationSound = () => {
    const notificationSound = new Audio("/notification/notification.mp3");
    notificationSound.play()
      .then(() => {
        console.log("Notification sound played successfully");
      })
      .catch((error) => {
        console.error("Error playing notification sound:", error);
      });
  };

  return (
    <div>
      {/* Test Button to play the notification sound */}
      <button
        onClick={testNotificationSound}
        className="p-2 bg-blue-500 text-white rounded"
      >
        Test Notification Sound
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {orders.length === 0 ? (
          <p className="text-xl text-gray-600 text-center">No orders yet.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.orderNumber}
              className="max-w-full border border-gray-300 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <h2 className="text-2xl font-semibold text-[#741052]">Order #{order.orderNumber}</h2>
              <div className="mt-4 space-y-2">
                <p><strong>Customer Name:</strong> {order.customerName}</p>
                <p><strong>Email:</strong> {order.email}</p>
                <p><strong>Table Number:</strong> {order.tableNumber}</p>
                <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                <p>
                  <strong>Status:</strong>
                  <select
                    className="ml-2 p-1 border rounded"
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.orderNumber, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </p>
              </div>
              <h3 className="text-xl font-bold mt-4 text-gray-800">Items:</h3>
              <ul className="space-y-4">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between items-center border-b pb-4">
                    <span>
                      {item.title} x{item.quantity} - Rs. {item.price * item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 font-bold text-xl text-[#741052]">Total: Rs. {order.totalAmount}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersList;
