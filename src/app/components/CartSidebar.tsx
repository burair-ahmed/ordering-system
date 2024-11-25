import { useCart } from '../context/CartContext';

const CartSidebar = ({ closeSidebar }: { closeSidebar: () => void }) => {
  const { cartItems, removeFromCart, updateQuantity, totalAmount, clearCart } = useCart();

  return (
    <div className="fixed right-0 top-0 w-72 h-full bg-white shadow-lg p-4 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-2xl font-bold">Your Cart</h2>
        <button
          onClick={closeSidebar}
          className="text-red-500 font-bold text-xl"
        >
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
                  {/* <img
                    src={item.image || '/placeholder.png'}
                    alt={item.title}
                    className="w-full h-auto rounded"
                  /> */}
                </div>

                {/* Item Details */}
                <div className="w-2/3 pl-3">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-sm text-gray-500">Rs. {item.price}</p>

                  {/* Quantity Controls */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="bg-green-500 text-white w-7 h-7 rounded-full flex justify-center items-center text-lg"
                    >
                      +
                    </button>
                    <span className="text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="bg-red-500 text-white w-7 h-7 rounded-full flex justify-center items-center text-lg"
                      disabled={item.quantity === 1}
                    >
                      -
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 text-sm mt-2 underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {cartItems.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <p className="font-bold text-lg mb-2">Total: Rs. {totalAmount.toFixed(2)}</p>
          <button
            onClick={clearCart}
            className="bg-red-600 text-white px-4 py-2 rounded w-full"
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default CartSidebar;
