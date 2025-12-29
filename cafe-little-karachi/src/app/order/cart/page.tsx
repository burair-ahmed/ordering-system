'use client';

import { useCart } from '../../context/CartContext'; // Assuming you have a CartContext

const CartPage = () => {
  const { cartItems, totalAmount, updateQuantity, removeFromCart } = useCart();

  const handleSubmitOrder = () => {
    console.log('Order Submitted');
    // Send the order to the backend
    // Example: fetch('/api/submit-order', { method: 'POST', body: JSON.stringify(cartItems) });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b py-4"
            >
              <div>
                <h3 className="text-lg font-medium">{item.title}</h3>
                <p className="text-gray-500">Price: ${item.price}</p>
                <p className="text-gray-500">Quantity: {item.quantity}</p>
                <p className="font-bold">
                  Total: ${item.price * item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Quantity Controls */}
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="bg-green-500 text-white px-2 py-1 rounded"
                >
                  +
                </button>
                <span className="text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  disabled={item.quantity === 1}
                >
                  -
                </button>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="bg-gray-300 px-3 py-1 rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="mt-6">
            <p className="text-lg font-bold">Total Amount: ${totalAmount.toFixed(2)}</p>
            <button
              onClick={handleSubmitOrder}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Submit Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
