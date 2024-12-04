"use client"; // Mark this file as a client-side component

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  removeFromCart: (id: string, variations?: string[]) => void; // Updated
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

  // Only access localStorage on the client side (inside useEffect)
  useEffect(() => {
    const savedCartItems = localStorage.getItem("cartItems");
    if (savedCartItems) {
      const parsedCartItems: CartItem[] = JSON.parse(savedCartItems);
      setCartItems(parsedCartItems);
      setTotalAmount(
        parsedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      );
    }
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } else {
      localStorage.removeItem("cartItems");
    }
    setTotalAmount(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      // Check if the item exists already in the cart
      const existingItemIndex = prevItems.findIndex((cartItem) => {
        // Check if the item ID and variation combination already exists in the cart
        return cartItem.id === item.id && JSON.stringify(cartItem.variations) === JSON.stringify(item.variations);
      });
  
      if (existingItemIndex >= 0) {
        // If the item with the same variations already exists, increase the quantity of that item
        const updatedCartItems = [...prevItems];
        updatedCartItems[existingItemIndex].quantity += 1;
        return updatedCartItems;
      } else {
        // If the item doesn't exist, add it to the cart with quantity 1
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };
  

  const removeFromCart = (id: string, variations?: string[]) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => item.id !== id || JSON.stringify(item.variations) !== JSON.stringify(variations)
      )
    );
  };
  
  

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
  

  const clearCart = () => {
    setCartItems([]);
  };

  return (
<CartContext.Provider
  value={{
    cartItems,
    totalAmount,
    addToCart,
    removeFromCart, // Updated to match the new signature
    updateQuantity,
    clearCart,
  }}
>
  {children}
</CartContext.Provider>


  );
};
