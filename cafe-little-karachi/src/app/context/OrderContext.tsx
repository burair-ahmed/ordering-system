"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type OrderType = "delivery" | "pickup" | "dinein" | "";

interface OrderState {
  orderType: OrderType;
  area?: string;
  tableId?: string;
}

interface OrderContextValue extends OrderState {
  setOrder: (order: OrderState) => void;
  clearOrder: () => void;
}

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [order, setOrderState] = useState<OrderState>({ orderType: "" });

  // 🔹 Load saved order from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("order-context");
      if (saved) {
        setOrderState(JSON.parse(saved));
      }
    } catch (err) {
      console.warn("Failed to load saved order:", err);
    }
  }, []);

  // 🔹 Save order to localStorage whenever it changes
  useEffect(() => {
    if (order.orderType) {
      localStorage.setItem("order-context", JSON.stringify(order));
    }
  }, [order]);

  const setOrder = (newOrder: OrderState) => {
    setOrderState(newOrder);
    localStorage.setItem("order-context", JSON.stringify(newOrder)); // immediate persist
  };

  const clearOrder = () => {
    setOrderState({ orderType: "" });
    localStorage.removeItem("order-context");
  };

  return (
    <OrderContext.Provider value={{ ...order, setOrder, clearOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used inside OrderProvider");
  return ctx;
}
