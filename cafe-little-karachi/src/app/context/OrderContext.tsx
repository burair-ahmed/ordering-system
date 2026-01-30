"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";

type OrderType = "delivery" | "pickup" | "dinein" | "";

interface OrderState {
  orderType: OrderType;
  area?: string;
  tableId?: string;
  isCheckoutModalOpen?: boolean;
}

interface OrderContextValue extends OrderState {
  setOrder: (order: OrderState) => void;
  clearOrder: () => void;
  setCheckoutModalOpen: (isOpen: boolean) => void;
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
      // Don't persist isCheckoutModalOpen to localStorage as it's a transient UI state
      const { isCheckoutModalOpen, ...persistentState } = order;
      localStorage.setItem("order-context", JSON.stringify(persistentState));
    }
  }, [order]);

  const setOrder = useCallback((newOrder: OrderState) => {
    setOrderState(prev => ({ ...prev, ...newOrder }));
    
    // Don't persist isCheckoutModalOpen to localStorage
    const { isCheckoutModalOpen, ...persistentState } = newOrder;
    localStorage.setItem("order-context", JSON.stringify(persistentState)); 
  }, []);

  const setCheckoutModalOpen = useCallback((isOpen: boolean) => {
    setOrderState((prev) => {
      // Only update if value actually changes to avoid unnecessary re-renders
      if (prev.isCheckoutModalOpen === isOpen) return prev;
      return { ...prev, isCheckoutModalOpen: isOpen };
    });
  }, []);

  const clearOrder = useCallback(() => {
    setOrderState({ orderType: "" });
    localStorage.removeItem("order-context");
  }, []);

  const contextValue = useMemo(() => ({
    ...order,
    setOrder,
    clearOrder,
    setCheckoutModalOpen
  }), [order, setOrder, clearOrder, setCheckoutModalOpen]);

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used inside OrderProvider");
  return ctx;
}
