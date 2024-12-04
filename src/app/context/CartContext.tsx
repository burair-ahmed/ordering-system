"use client"; // Mark this file as a client-side component

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  variations?: string[];
}

interface CartContextType {
  cartItems: CartItem[];
  totalAmount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, variations?: string[]) => void;
  updateQuantity: (id: string, quantity: number, variations?: string[]) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [tableId, setTableId] = useState<string | null>(null);

  // Access the router only in the client environment
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("tableId");
      setTableId(id);
    }
  }, []);

  // Helper function to calculate total amount
  const updateTotalAmount = (items: CartItem[]) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalAmount(total);
  };

  // Load cart from localStorage when tableId changes
  useEffect(() => {
    if (tableId) {
      const savedCartItems = localStorage.getItem(`cart-${tableId}`);
      if (savedCartItems) {
        const parsedCartItems: CartItem[] = JSON.parse(savedCartItems);
        setCartItems(parsedCartItems);
        updateTotalAmount(parsedCartItems);
      } else {
        setCartItems([]);
        setTotalAmount(0);
      }
    }
  }, [tableId]);

  // Save cart to localStorage and update total amount whenever cartItems change
  useEffect(() => {
    if (tableId) {
      if (cartItems.length > 0) {
        localStorage.setItem(`cart-${tableId}`, JSON.stringify(cartItems));
      } else {
        localStorage.removeItem(`cart-${tableId}`);
      }
      updateTotalAmount(cartItems);
    }
  }, [cartItems, tableId]);

  // Add item to cart
  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (cartItem) =>
          cartItem.id === item.id &&
          JSON.stringify(cartItem.variations) === JSON.stringify(item.variations)
      );

      if (existingItemIndex >= 0) {
        return prevItems.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (id: string, variations?: string[]) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => item.id !== id || JSON.stringify(item.variations) !== JSON.stringify(variations)
      )
    );
  };

  // Update item quantity
  const updateQuantity = (id: string, quantity: number, variations?: string[]) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id &&
        (!variations || JSON.stringify(item.variations) === JSON.stringify(variations))
          ? { ...item, quantity: Math.max(quantity, 1) }
          : item
      )
    );
  };

  // Clear the entire cart
  const clearCart = () => {
    setCartItems([]);
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
