'use client'

import { useCart } from "../context/CartContext";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import { useEffect, useState } from "react";

const CartSidebar = ({ closeSidebar, tableId }: { closeSidebar: () => void; tableId: string }) => {
  const { cartItems, removeFromCart, updateQuantity, totalAmount, clearCart } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      closeSidebar();
    }, 300);
  };

  return (
    <div
      className={`fixed top-0 h-full bg-white shadow-lg p-2 z-50 flex flex-col transform ${
        isVisible && !isExiting ? "translate-x-0" : "translate-x-full"
      } transition-transform duration-300 ease-in-out right-0 w-full sm:w-72 border-l-4 border-[#741052]`}
    >
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#f8ad3c]">
        <h2 className="text-xl font-bold text-[#741052]">Your Cart</h2>
        <button
          onClick={handleClose}
          className="text-[#741052] font-bold text-2xl hover:text-[#f8ad3c]"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="flex flex-col justify-center items-center mx-auto text-center">
            <Image
              className="mb-4"
              src="/empty-cart.png"
              alt="Empty cart"
              width={200}
              height={200}
            />
            <p className="text-gray-600">Your cart is empty</p>
          </div>
        ) : (
          <ul>
            {cartItems.map((item) => (
              <li
                key={`${item.id}-${JSON.stringify(item.variations)}`}
                className="mb-4 pb-4 border-b border-gray-200 bg-[#741052] text-white rounded-lg p-2"
              >
                <div className="flex items-center">
                  <div className="w-1/4 sm:w-1/5">
                    <Image
                      src={item.image || "/placeholder.png"}
                      alt={item.title}
                      width={200}
                      height={60}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  <div className="w-3/4 sm:w-3/5 pl-4">
                    <p className="font-medium text-sm">
                      {item.title}
                      {item.variations && item.variations.length > 0 && (
                        <span className="text-xs text-gray-300">
                          {" "}
                          ({item.variations.join(", ")})
                        </span>
                      )}
                    </p>
                    <p className="text-sm">Rs. {item.price}</p>

                    <div className="flex gap-2 mt-2">
                      <div className="mt-2 flex items-center justify-between bg-gray-100 border border-gray-200 rounded-full px-2 py-1 shadow-sm w-fit">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.variations)}
                          className="bg-[#f8ad3c] text-white text-sm w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#d28f32] transition"
                        >
                          -
                        </button>
                        <span className="text-sm text-black font-medium mx-1">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.variations)}
                          className="bg-[#f8ad3c] text-white text-sm w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#d28f32] transition"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id, item.variations)}
                        className="text-white text-sm mt-2 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {item.variations && item.variations.length > 0 && (
                  <div className="mt-2 text-sm text-gray-300">
                    <strong>Choices:</strong>
                    <ul>
                      {item.variations.map((variation, idx) => {
                        const [heading, choice] = variation.split(": ");
                        return (
                          <li key={idx}>
                            <span className="font-bold">{heading}:</span> {choice}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="border-t border-[#f8ad3c] pt-4">
          <div className="flex justify-between mb-4">
            <span className="font-bold text-black">Total:</span>
            <span className="font-bold text-black">Rs. {totalAmount.toFixed(2)}</span>
          </div>

          <button
            onClick={clearCart}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full py-2 w-full mb-2 shadow-md transition"
          >
            Clear Cart
          </button>

          <Link href={`/checkout?tableId=${tableId}`} passHref>
            <button
              onClick={handleClose}
              className="flex items-center justify-center bg-[#741052] hover:bg-[#5e0d41] text-white rounded-full py-2 w-full shadow-md transition"
            >
              <span className="flex items-center">
                Checkout
                <FaArrowRight className="ml-2" />
              </span>
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default CartSidebar;
