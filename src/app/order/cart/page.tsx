'use client'

// src/app/order/cart/page.tsx
import { useState } from 'react';

const CartPage = () => {
  const [cart] = useState([
    { id: 1, name: 'Pizza', quantity: 1, price: 10 },
    { id: 1, name: 'Pizza', quantity: 1, price: 10 },
    { id: 1, name: 'Pizza', quantity: 1, price: 10 },
    { id: 1, name: 'Pizza', quantity: 1, price: 10 }
  ]);

  const handleSubmitOrder = () => {
    console.log('Order Submitted');
    // Yahan order ko backend ko bhejenge
  };

  return (
    <div>
      <h1>Your Cart</h1>
      {cart.map(item => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>Quantity: {item.quantity}</p>
          <p>Total: ${item.price * item.quantity}</p>
        </div>
      ))}
      <button onClick={handleSubmitOrder}>Submit Order</button>
    </div>
  );
};

export default CartPage;
