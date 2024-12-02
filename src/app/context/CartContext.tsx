"use client"; // Add this line

// CartContext.tsx
import React, { createContext, useContext, useState } from 'react';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  variations?: string[];
  image: string; // Add image property to store image URL
}


interface CartContextType {
  cartItems: CartItem[];
  totalAmount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (i) => i.id === item.id && JSON.stringify(i.variations) === JSON.stringify(item.variations) // Check variations as well
      );
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id && JSON.stringify(i.variations) === JSON.stringify(item.variations)
            ? { ...i, quantity: i.quantity + 1 } // If variations match, increment quantity
            : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };
  

  const removeFromCart = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return; // Don't allow negative quantity
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, totalAmount, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
