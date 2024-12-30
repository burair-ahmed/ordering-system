import { FC, useEffect, useRef, useState } from "react";

interface Item {
  id: string;
  title: string;
  quantity: number;
  price: number;
  variations?: { name: string; value: string }[] | string[]; // variations can be a string array or an object array
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const previousOrdersRef = useRef<Order[]>([]);

  useEffect(() => {
    const loadAudioBuffer = async () => {
      try {
        const audioContext = new AudioContext();
        const response = await fetch("/notification/notification.mp3");
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        audioContextRef.current = audioContext;
        audioBufferRef.current = audioBuffer;

        console.log("Audio loaded and decoded successfully.");
      } catch (error) {
        console.error("Error loading notification sound:", error);
      }
    };

    loadAudioBuffer();
  }, []);

  const playNotificationSound = () => {
    if (audioContextRef.current && audioBufferRef.current) {
      try {
        const audioContext = audioContextRef.current;
        const source = audioContext.createBufferSource();
        source.buffer = audioBufferRef.current;

        source.connect(audioContext.destination);
        source.start(0);

        console.log("Notification sound played successfully.");
      } catch (error) {
        console.error("Error playing notification sound:", error);
      }
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (response.ok) {
        const newOrders = data.orders || [];
        const previousOrders = previousOrdersRef.current;
        if (newOrders.length > previousOrders.length) {
          console.log("New order detected!");
          playNotificationSound();
        } else if (
          newOrders.some(
            (order: Order) =>
              !previousOrders.some(
                (prevOrder) => prevOrder.orderNumber === order.orderNumber
              )
          )
        ) {
          console.log("New order detected!");
          playNotificationSound();
        }

        setOrders(newOrders);
        previousOrdersRef.current = newOrders;
      } else {
        console.error("Failed to fetch orders:", data.message);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const updateOrderStatus = async (orderNumber: string, status: string) => {
    try {
      const response = await fetch("/api/updateorderstatus", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNumber, status }),
      });

      if (response.ok) {
        console.log("Order status updated successfully.");
        fetchOrders();
      } else {
        console.error("Failed to update order status:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {orders.length === 0 ? (
          <p className="text-xl text-gray-600 text-center">No orders yet.</p>
        ) : (
          orders.map((order: Order) => (
            <div
              key={order.orderNumber}
              className="border border-gray-300 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <h2 className="text-2xl font-semibold text-[#741052]">
                Order #{order.orderNumber}
              </h2>
              <div className="mt-4 space-y-2">
                <p>
                  <strong>Customer Name:</strong> {order.customerName}
                </p>
                <p>
                  <strong>Email:</strong> {order.email}
                </p>
                <p>
                  <strong>Table Number:</strong> {order.tableNumber}
                </p>
                <p>
                  <strong>Payment Method:</strong> {order.paymentMethod}
                </p>
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
                  <li
                    key={index}
                    className="flex justify-between items-center border-b pb-4"
                  >
                    <div>
                      <span className="block font-medium">{item.title}</span>
                      <span className="text-sm text-gray-500">
                        x{item.quantity} - Rs. {item.price * item.quantity}
                      </span>
                      {item.variations && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Choices:</strong>
                          <ul className="list-disc pl-5">
                          {Array.isArray(item.variations) && item.variations.length > 0 ? (
  item.variations.map((variation, idx) => (
    <li key={idx}>
      {typeof variation === "string" ? (
        variation // Directly render string variations
      ) : (
        `${variation.name}: ${variation.value}` // Render object variations
      )}
    </li>
  ))
) : (
  <li>No variations available</li>
)}

                          </ul>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 font-bold text-xl text-[#741052]">
                Total: Rs. {order.totalAmount}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersList;
