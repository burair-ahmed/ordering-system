import { FC, useEffect, useRef, useState } from "react";

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
  const [lastFetched, setLastFetched] = useState<number>(Date.now()); // Tracks when orders were last fetched
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Load and decode audio buffer on mount
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

  // Function to fetch orders from the server
  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
        setLastFetched(Date.now()); // Update last fetched time
        playNotificationSound(); // Play sound when orders are fetched
      } else {
        console.error("Failed to fetch orders:", data.message);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Polling for orders periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(); // Check for new orders every 5 seconds
    }, 5000);

    // Cleanup polling interval
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Check if new orders should be added by validating the order list every minute
  useEffect(() => {
    const validationInterval = setInterval(() => {
      const timeSinceLastFetch = Date.now() - lastFetched;

      if (timeSinceLastFetch > 60000) {
        console.log("Re-validating orders...");
        fetchOrders(); // Trigger a fetch again if no update in the last minute
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(validationInterval);
    };
  }, [lastFetched]);

  // Play notification sound when a new order is added
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

  // Update order status when changed
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
            order.orderNumber === orderNumber
              ? { ...order, status: newStatus }
              : order
          )
        );
      } else {
        console.error("Failed to update order status:", data.message);
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
          orders.map((order) => (
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
                    onChange={(e) =>
                      updateOrderStatus(order.orderNumber, e.target.value)
                    }
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
                    <span>
                      {item.title} x{item.quantity} - Rs.{" "}
                      {item.price * item.quantity}
                    </span>
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
