// CartSidebar.tsx
import { useCart } from '../context/CartContext';

const CartSidebar = ({ closeSidebar }: { closeSidebar: () => void }) => {
  const { cartItems, removeFromCart, updateQuantity, totalAmount, clearCart } = useCart();

  return (
    <div className="fixed right-0 top-0 w-72 h-full bg-white shadow-lg p-4 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-2xl font-bold">Your Cart</h2>
        <button onClick={closeSidebar} className="text-red-500 font-bold text-xl">
          &times;
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {cartItems.length === 0 ? (
          <p className="text-center mt-4">Your cart is empty</p>
        ) : (
          <ul>
            {cartItems.map((item) => (
              <li key={item.id} className="flex items-start mb-4 border-b pb-4">
                {/* Image */}
                <div className="w-1/3">
                  <img
                    src={item.image || '/placeholder.png'}
                    alt={item.title}
                    className="w-full h-auto rounded"
                  />
                </div>

                {/* Item Details */}
                <div className="w-2/3 pl-3">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-sm text-gray-500">Rs. {item.price}</p>

                  {/* Quantity Controls */}
                  <div className="mt-2 flex items-center gap-2 p-2 border rounded-lg shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="bg-gray-200 text-sm px-2 py-1 rounded-md"
                    >
                      +
                    </button>
                    <span className="text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="bg-gray-200 text-sm px-2 py-1 rounded-md"
                    >
                      -
                    </button>
                  </div>

                  {/* Remove from Cart */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 text-sm mt-2"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Total */}
      {cartItems.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between">
            <span className="font-bold">Total:</span>
            <span className="font-bold">Rs. {totalAmount.toFixed(2)}</span>
          </div>
          <button
            onClick={clearCart}
            className="bg-red-500 text-white rounded-full py-2 mt-4 w-full"
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default CartSidebar;
