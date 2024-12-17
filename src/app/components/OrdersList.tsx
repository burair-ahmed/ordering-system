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
  const previousOrdersRef = useRef<Order[]>([]); // To track previous orders

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

  // Function to play the notification sound
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

  // Function to fetch orders from the server
  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (response.ok) {
        const newOrders = data.orders || [];

        // Check if there are new orders by comparing lengths or order numbers
        const previousOrders = previousOrdersRef.current;
        if (newOrders.length > previousOrders.length) {
          console.log("New order detected!");
          playNotificationSound(); // Play sound if a new order is fetched
        } else if (
          newOrders.some(
            (order: any) =>
              !previousOrders.some(
                (prevOrder) => prevOrder.orderNumber === order.orderNumber
              )
          )
        ) {
          console.log("New order detected!");
          playNotificationSound();
        }

        setOrders(newOrders);
        previousOrdersRef.current = newOrders; // Update previous orders
        setLastFetched(Date.now()); // Update last fetched time
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
                    onChange={(e) =>
                      console.log("Status update not implemented yet")
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
