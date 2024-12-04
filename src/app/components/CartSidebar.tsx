import { useCart } from "../context/CartContext";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";
import Link from "next/link";

const CartSidebar = ({ closeSidebar, tableId }: { closeSidebar: () => void, tableId: string }) => {
  const { cartItems, removeFromCart, updateQuantity, totalAmount, clearCart } = useCart();

  // Debugging: Check if tableId is being passed correctly
  console.log("Table ID in CartSidebar:", tableId);

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
          <div className="flex flex-col justify-center items-center mx-auto">
            <Image
              className="mb-4"
              src="/empty-cart.png"
              alt="Empty cart"
              width={200}
              height={200}
            />
            <p className="text-center mt-4">Your cart is empty</p>
          </div>
        ) : (
          <ul>
            {cartItems.map((item) => (
              <li
                key={`${item.id}-${JSON.stringify(item.variations)}`}
                className="flex items-start mb-4 border-b pb-4"
              >
                {/* Image */}
                <div className="w-1/3">
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.title}
                    className="w-full h-auto rounded"
                  />
                </div>

                {/* Item Details */}
                <div className="w-2/3 pl-3">
                  <p className="font-medium text-sm">
                    {item.title}
                    {item.variations &&
                      item.variations.length > 0 &&
                      ` (${item.variations.join(", ")})`}
                  </p>
                  <p className="text-sm text-gray-500">Rs. {item.price}</p>

                  {/* Quantity Controls */}
                  <div className="mt-2 flex items-center gap-2 p-2 border rounded-lg shadow-sm">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1, item.variations)
                      }
                      className="bg-gray-200 text-sm px-2 py-1 rounded-md"
                    >
                      +
                    </button>
                    <span className="text-sm">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1, item.variations)
                      }
                      className="bg-gray-200 text-sm px-2 py-1 rounded-md"
                    >
                      -
                    </button>
                  </div>

                  {/* Remove from Cart */}
                  <button
                    onClick={() => removeFromCart(item.id, item.variations)}
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

          {/* Clear Cart Button */}
          <button
            onClick={clearCart} // Fixed: clearCart should be called without arguments
            className="bg-red-500 text-white rounded-full py-2 mt-4 w-full"
          >
            Clear Cart
          </button>

          {/* Proceed to Checkout Button */}
          <button className="flex items-center justify-center bg-blue-500 text-white rounded-full py-2 mt-4 w-full">
            {/* Ensure the `tableId` is passed correctly */}
            <Link href={`/checkout?tableId=${tableId}`} passHref>
              <span className="flex items-center">
                Checkout
                <FaArrowRight className="ml-2" />
              </span>
            </Link>
          </button>
        </div>
      )}
    </div>
  );
};

export default CartSidebar;
