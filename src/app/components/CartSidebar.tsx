import { useCart } from '../context/CartContext';

const CartSidebar = ({ closeSidebar }: { closeSidebar: () => void }) => {
  const { cartItems, removeFromCart, updateQuantity, totalAmount, clearCart } = useCart();

  return (
    <div className="fixed right-0 top-0 w-72 h-full bg-white shadow-lg p-4 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Cart</h2>
        <button
          onClick={closeSidebar}
          className="text-red-500 font-bold text-xl"
        >
          &times;
        </button>
      </div>
      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <div>
          <ul>
            {cartItems.map((item) => (
              <li key={item.id} className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p>Rs.{item.price} x {item.quantity}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="text-green-500"
                  >
                    +
                  </button>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="text-red-500"
                    disabled={item.quantity === 1}
                  >
                    -
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <p className="font-bold">Total: Rs.{totalAmount.toFixed(2)}</p>
            <button
              onClick={clearCart}
              className="bg-[#000] text-white px-4 py-2 rounded mt-2 w-full"
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartSidebar;
