'use client';

import { createContext, useContext, useEffect, useMemo, useState, useRef, ReactNode, Suspense } from "react";
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
  const isLoaded = useRef(false);

  // Compute total amount derived directly from cart items
  const totalAmount = useMemo(
    () => cartItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0),
    [cartItems]
  );

  // 1. Load persisted cart on mount (supports current clk_cart key and legacy cart-* keys)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      let saved = localStorage.getItem("clk_cart");
      if (!saved) {
        // Fallback check for legacy keys e.g. cart-pickup-default, cart-dinein-*
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("cart-")) {
            const legacyVal = localStorage.getItem(key);
            if (legacyVal) {
              saved = legacyVal;
              break;
            }
          }
        }
      }

      if (saved) {
        const parsed: CartItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      isLoaded.current = true;
    }
  }, []);

  // 2. Persist cart items to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded.current) return;

    try {
      if (cartItems.length > 0) {
        localStorage.setItem("clk_cart", JSON.stringify(cartItems));
      } else {
        localStorage.removeItem("clk_cart");
      }
    } catch (err) {
      console.error("Failed to save cart:", err);
    }
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (ci) =>
          ci.id === item.id &&
          JSON.stringify(ci.variations || []) === JSON.stringify(item.variations || [])
      );

      if (existingIndex >= 0) {
        return prevItems.map((ci, i) =>
          i === existingIndex ? { ...ci, quantity: ci.quantity + (item.quantity || 1) } : ci
        );
      } else {
        return [...prevItems, { ...item, quantity: item.quantity || 1 }];
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

