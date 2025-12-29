'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams(); // ✅ Safe inside Suspense boundary

  const [orderType, setOrderType] = useState<OrderType>("dinein");
  const [orderIdentifier, setOrderIdentifier] = useState<string>("default");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const storageKey = useMemo(() => {
    const safeId = orderIdentifier ? orderIdentifier.replace(/\s+/g, "_") : "default";
    return `cart-${orderType}-${safeId}`;
  }, [orderType, orderIdentifier]);

  useEffect(() => {
    const typeParam = searchParams?.get("type");
    const tableParam = searchParams?.get("tableId") ?? searchParams?.get("tableid");
    const areaParam = searchParams?.get("area");

    const inferType = (): OrderType => {
      if (typeParam === "delivery") return "delivery";
      if (typeParam === "pickup") return "pickup";
      if (typeParam === "dinein") return "dinein";
      if (tableParam) return "dinein";
      if (areaParam) return "delivery";
      return "pickup";
    };

    const resolvedType = inferType();
    setOrderType(resolvedType);

    if (resolvedType === "dinein") setOrderIdentifier(tableParam ?? "default");
    else if (resolvedType === "delivery") setOrderIdentifier(areaParam ?? "default");
    else setOrderIdentifier("default");
  }, [searchParams]);

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
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) =>
          item.id !== id ||
          JSON.stringify(item.variations || []) !== JSON.stringify(variations || [])
      )
    );
  };

  const updateQuantity = (id: string, quantity: number, variations?: string[]) => {
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

  const clearCart = () => setCartItems([]);

  const setOrderContext = (type: OrderType, identifier?: string) => {
    setOrderType(type);
    if (type === "dinein") setOrderIdentifier(identifier ?? "default");
    else if (type === "delivery") setOrderIdentifier(identifier ?? "default");
    else setOrderIdentifier("default");
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
  <Suspense fallback={<div>Loading cart...</div>}>
    <CartProviderInner>{children}</CartProviderInner>
  </Suspense>
);
