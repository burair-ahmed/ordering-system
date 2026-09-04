'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode, Suspense } from "react";
import Preloader from "../components/Preloader";
import { trackEvent } from "../lib/analytics";
import { useOrder } from "./OrderContext";

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  variations?: string[];
}

type OrderType = "dinein" | "delivery" | "pickup";

interface CartContextType {
  cartItems: CartItem[];
  totalAmount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, variations?: string[]) => void;
  updateQuantity: (id: string, quantity: number, variations?: string[]) => void;
  clearCart: () => void;
  orderType: OrderType;
  orderIdentifier: string;
  setOrderContext: (type: OrderType, identifier?: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

function CartProviderInner({ children }: CartProviderProps) {
  // ✅ Derive order context from OrderContext (single source of truth — no URL params needed)
  const { orderType: ctxOrderType, area: ctxArea, tableId: ctxTableId } = useOrder();

  const orderType: OrderType = (ctxOrderType as OrderType) || "pickup";
  const orderIdentifier = useMemo(() => {
    if (orderType === "dinein") return ctxTableId ?? "default";
    if (orderType === "delivery") return ctxArea ?? "default";
    return "default";
  }, [orderType, ctxTableId, ctxArea]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const storageKey = useMemo(() => {
    const safeId = orderIdentifier ? orderIdentifier.replace(/\s+/g, "_") : "default";
    return `cart-${orderType}-${safeId}`;
  }, [orderType, orderIdentifier]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: CartItem[] = JSON.parse(saved);
        setCartItems(parsed);
        const total = parsed.reduce((sum, it) => sum + it.price * it.quantity, 0);
        setTotalAmount(total);
      } else {
        setCartItems([]);
        setTotalAmount(0);
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
      setCartItems([]);
      setTotalAmount(0);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (cartItems.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(cartItems));
      } else {
        localStorage.removeItem(storageKey);
      }
      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setTotalAmount(total);
    } catch (err) {
      console.error("Failed to save cart:", err);
    }
  }, [cartItems, storageKey]);

  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (ci) =>
          ci.id === item.id &&
          JSON.stringify(ci.variations || []) === JSON.stringify(item.variations || [])
      );

      if (existingIndex >= 0) {
        return prevItems.map((ci, i) =>
          i === existingIndex ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id: string, variations?: string[]) => {
    const itemToRemove = cartItems.find(
      (item) =>
        item.id === id &&
        JSON.stringify(item.variations || []) === JSON.stringify(variations || [])
    );
    if (itemToRemove) {
      trackEvent('journey_cart_remove', {
        item_id: id,
        item_name: itemToRemove.title,
        price: itemToRemove.price,
        quantity: itemToRemove.quantity,
        variations: itemToRemove.variations || []
      });
    }

    setCartItems((prevItems) =>
      prevItems.filter(
        (item) =>
          item.id !== id ||
          JSON.stringify(item.variations || []) !== JSON.stringify(variations || [])
      )
    );
  };

  const updateQuantity = (id: string, quantity: number, variations?: string[]) => {
    const itemToUpdate = cartItems.find(
      (item) =>
        item.id === id &&
        (!variations ||
          JSON.stringify(item.variations || []) === JSON.stringify(variations || []))
    );
    if (itemToUpdate) {
      const isIncrement = quantity > itemToUpdate.quantity;
      trackEvent(isIncrement ? 'journey_cart_increment' : 'journey_cart_decrement', {
        item_id: id,
        item_name: itemToUpdate.title,
        price: itemToUpdate.price,
        old_quantity: itemToUpdate.quantity,
        new_quantity: quantity,
        variations: itemToUpdate.variations || []
      });
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id &&
        (!variations ||
          JSON.stringify(item.variations || []) === JSON.stringify(variations || []))
          ? { ...item, quantity: Math.max(quantity, 1) }
          : item
      )
    );
  };

  const clearCart = () => {
    trackEvent('journey_cart_clear', {
      item_count: cartItems.length,
      total_amount: totalAmount
    });
    setCartItems([]);
  };

  // setOrderContext is now a no-op shim kept for compatibility — location is managed by OrderContext
  const setOrderContext = (_type: OrderType, _identifier?: string) => {
    // Location state is managed exclusively by OrderContext now
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalAmount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        orderType,
        orderIdentifier,
        setOrderContext,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const CartProvider = ({ children }: CartProviderProps) => (
  <Suspense fallback={<Preloader />}>
    <CartProviderInner>{children}</CartProviderInner>
  </Suspense>
);

