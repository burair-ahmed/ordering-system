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
      <header className="w-full bg-gradient-to-b from-[#6B3F2A] via-[#A65638] to-[#FAF3E6] shadow-md border-b border-[#E3D6C6]">
        <div
          className="hidden lg:block h-[60px] bg-repeat-x opacity-10"
          style={{
            backgroundImage: 'url(/Group426.png)',
            backgroundSize: '360px 65px',
            backgroundPosition: 'center',
          }}
        />

        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-3 items-center w-11/12 mx-auto py-4">
          {/* Left: Contact + Location */}
          <div className="flex gap-4">
            <Link href="tel:+923331702704" aria-label="Contact">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all shadow-sm border border-white/10 backdrop-blur-sm">
                <Image src="/contact.svg" alt="Contact" width={18} height={18} />
                <span>Contact Us</span>
              </button>
            </Link>
            <Link
              target="_blank"
              href="https://www.google.com/maps/place/The+Chai+Company"
              aria-label="Location"
            >
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all shadow-sm border border-white/10 backdrop-blur-sm">
                <Image src="/location.svg" alt="Location" width={18} height={18} />
                <span>Find Us</span>
              </button>
            </Link>
          </div>

          {/* Center: Logo */}
          <div className="flex justify-center">
            <Link href={tableId ? `/order?tableId=${tableId}` : '/'}>
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Image src="/logo.webp" alt="Logo" width={120} height={120} className="drop-shadow-lg" />
              </motion.div>
            </Link>
          </div>

          {/* Right: Cart */}
          <div className="flex gap-4 justify-end items-center">
            <button
              onClick={toggleCartSidebar}
              className="relative flex items-center gap-2 px-6 py-2.5 rounded-[14px] bg-[#C46A47] hover:bg-[#A65638] text-white font-semibold text-sm transition-all shadow-[0_8px_20px_rgba(196,106,71,0.25)]"
              aria-label="Cart"
            >
              <Image src="/Cart-icon.png" alt="Cart" width={20} height={20} />
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#8B2E2E] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex lg:hidden justify-between items-center px-4 py-3 bg-gradient-to-b from-[#6B3F2A] to-[#A65638]">
          <Link href={tableId ? `/order?tableId=${tableId}` : '/'}>
            <Image src="/logo.webp" alt="Logo" width={65} height={65} className="drop-shadow-md" />
          </Link>
          <div className="flex gap-3">
            <button
              onClick={toggleCartSidebar}
              className="relative p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-white"
              aria-label="Cart"
            >
              <Image src="/Cart-icon.png" alt="Cart" width={22} height={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8B2E2E] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              className="p-3 rounded-full bg-[#2E1C14]/30 hover:bg-[#2E1C14]/50 border border-white/10 transition-all text-white"
              aria-label="Menu"
            >
              <Image src="/sidebar.svg" alt="Menu" width={22} height={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-[#FAF3E6] border-t border-[#E3D6C6] text-[#2E1C14] py-4 flex justify-between items-center px-6 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] lg:hidden">
        <div>
          <p className="text-sm font-bold text-[#6B3F2A]">Rs. {totalAmount.toFixed(2)}</p>
          <p className="text-xs text-[#6F5A4A]">{totalItems} items</p>
        </div>
        <button
          className="bg-[#C46A47] text-white rounded-[14px] px-8 py-2.5 font-bold shadow-[0_8px_20px_rgba(196,106,71,0.25)] hover:bg-[#A65638] active:scale-95 transition-all text-sm"
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
