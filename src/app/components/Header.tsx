/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import CartSidebar from './CartSidebar';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext'; 

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  // const [tableId, setTableId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const { cartItems, totalAmount } = useCart();
  const { orderType, tableId, area } = useOrder(); 

  useEffect(() => {
    setIsClient(true);
  }, []);

 const toggleCartSidebar = () => {
    // Allow sidebar for any valid order type
    if (orderType === 'dinein' || orderType === 'delivery' || orderType === 'pickup') {
      setIsCartOpen((prev) => !prev);
    } else {
      console.warn('No valid order type found in context');
    }
  };


  if (!isClient) return null;

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      {/* Sticky Top Navbar */}
      <header className="w-full bg-gradient-to-b from-[#5c0d40] via-[#741052] to-white shadow-md">
        <div
          className="hidden lg:block h-[80px] bg-repeat-x"
          style={{
            backgroundImage: 'url(/Group426.png)',
            backgroundSize: '360px 65px',
            backgroundPosition: 'center',
          }}
        />

        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-3 items-center w-11/12 mx-auto py-3">
          {/* Left: Contact + Location */}
          <div className="flex gap-4">
            <Link href="tel:+923331702704" aria-label="Contact">
              <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition shadow">
                <Image src="/contact.svg" alt="Contact" width={18} height={18} />
                <span>+92 333 1702704</span>
              </button>
            </Link>
            <Link
              target="_blank"
              href="https://www.google.com/maps/place/Cafe+Little+Karachi"
              aria-label="Location"
            >
              <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition shadow">
                <Image src="/location.svg" alt="Location" width={18} height={18} />
                <span>Find Us</span>
              </button>
            </Link>
          </div>

          {/* Center: Logo */}
          <div className="flex justify-center">
            <Link href={tableId ? `/order?tableId=${tableId}` : '/'}>
              <Image src="/logo.webp" alt="Logo" width={110} height={110} />
            </Link>
          </div>

          {/* Right: Cart + Sidebar */}
          <div className="flex gap-4 justify-end items-center">
            <button
              onClick={toggleCartSidebar}
              className="relative flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition shadow"
              aria-label="Cart"
            >
              <Image src="/Cart-icon.png" alt="Cart" width={20} height={20} />
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              className="p-3 rounded-full bg-black/40 hover:bg-black/60 transition shadow"
              aria-label="Menu"
            >
              <Image src="/sidebar.svg" alt="Menu" width={20} height={20} />
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex lg:hidden justify-between items-center px-4 py-2 bg-gradient-to-b from-[#5c0d40] via-[#741052] to-white">

          <Link href={tableId ? `/order?tableId=${tableId}` : '/'}>
            <Image src="/logo.webp" alt="Logo" width={70} height={70} />
          </Link>
          <div className="flex gap-3">
            <button
              onClick={toggleCartSidebar}
              className="relative p-3 rounded-full bg-white/20 hover:bg-white/30 transition"
              aria-label="Cart"
            >
              <Image src="/cart-icon.png" alt="Cart" width={22} height={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              className="p-3 rounded-full bg-black/40 hover:bg-black/60 transition"
              aria-label="Menu"
            >
              <Image src="/sidebar.svg" alt="Menu" width={22} height={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-[#741052] to-black text-white py-3 flex justify-between items-center px-6 z-30 shadow-lg lg:hidden">
        <div>
          <p className="text-sm font-semibold">Rs. {totalAmount.toFixed(2)}</p>
          <p className="text-xs opacity-80">{totalItems} items</p>
        </div>
        <button
          className="bg-gradient-to-r from-[#ff9824] to-[#ff7b00] text-white rounded-full px-6 py-2 font-bold shadow hover:scale-105 transition"
          onClick={toggleCartSidebar}
        >
          View Cart
        </button>
      </div>

      {/* Cart Sidebar + Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={toggleCartSidebar}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Sidebar */}
        <CartSidebar closeSidebar={toggleCartSidebar} tableId={tableId ?? ''} />

          </>
        )}
      </AnimatePresence>
    </>
  );
}
