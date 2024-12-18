'use client';

import { FC, useEffect, useState } from "react";

interface Item {
  id: string;
  title: string;
  quantity: number;
  price: number;
  variations?: { name: string; value: string }[] | string[];  // Adjust based on how variations are structured
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
  completedAt: string;
}

const CompletedOrders: FC = () => {
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      const response = await fetch("/api/fetchCompletedOrders");
      const data = await response.json();
      if (response.ok) {
        setCompletedOrders(data.orders);
      } else {
        alert("Failed to fetch completed orders.");
      }
    };

    fetchCompletedOrders();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {completedOrders.length === 0 ? (
        <p className="text-xl text-gray-600 text-center">No completed orders yet.</p>
      ) : (
        completedOrders.map((order) => (
          <div
            key={order.orderNumber}
            className="max-w-full border border-gray-300 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
          >
            <h2 className="text-2xl font-semibold text-[#741052]">Order #{order.orderNumber}</h2>
            <div className="mt-4 space-y-2">
              <p><strong className="font-medium text-gray-700">Customer Name:</strong> {order.customerName}</p>
              <p><strong className="font-medium text-gray-700">Email:</strong> {order.email}</p>
              <p><strong className="font-medium text-gray-700">Table Number:</strong> {order.tableNumber}</p>
              <p><strong className="font-medium text-gray-700">Payment Method:</strong> {order.paymentMethod}</p>
              <p><strong className="font-medium text-gray-700">Completed At:</strong> {new Date(order.completedAt).toLocaleString()}</p>
              <p>
                <strong className="font-medium text-gray-700">Status:</strong>
                <span className="ml-2 text-green-500">{order.status}</span>
              </p>
            </div>
            <h3 className="text-xl font-bold mt-4 text-gray-800">Items:</h3>
            <ul className="space-y-4">
              {order.items.map((item, index) => (
                <li key={`${item.id}-${index}`} className="flex justify-between items-center border-b pb-4">
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{item.title}</span> x{item.quantity}
                    <span className="text-sm text-gray-600"> - Rs. {item.price * item.quantity}</span>
                  </div>
                  {item.variations && item.variations.length > 0 && (
                    <div className="text-sm text-gray-500 mt-2 ml-4">
                      <strong>Variations:</strong>
                      <ul className="list-disc pl-5">
                        {item.variations.map((variation, i) => (
                          <li key={i}>
                            {typeof variation === "object"
                              ? `${variation.name}: ${variation.value}`
                              : variation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 font-bold text-xl text-[#741052]">Total: Rs. {order.totalAmount}</div>
          </div>
        ))
      )}
    </div>
  );
};

export default CompletedOrders;
