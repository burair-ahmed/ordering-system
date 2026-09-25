'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';

export default function FloatingCartButton() {
  const pathname = usePathname();
  const { cartItems, isCartOpen, openCart } = useCart();
  const { isProductModalOpen } = useOrder();
  const [isVisible, setIsVisible] = useState(false);

  // Total quantity of items in cart
  const totalItems = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);

  // Check if any product popup is active (state or direct product URL)
  const isProductPopupActive = isProductModalOpen || pathname?.startsWith('/item/') || pathname?.startsWith('/platter/');

  // Show floating button only after scrolling down a bit
  useEffect(() => {
    const handleScroll = () => {
      // Reveal after user scrolls down 80px
      if (window.scrollY > 80) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Initial check on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Suppress on administrative routes
  if (pathname?.startsWith('/admin')) return null;

  return (
    <AnimatePresence>
      {isVisible && !isCartOpen && !isProductPopupActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: -15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: -15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed top-[10%] right-4 sm:right-6 md:right-8 z-50 select-none"
        >
          <div className="relative flex items-center justify-center">
            {/* 
              LOW-OPACITY RADAR / SONAR PULSE RING EFFECT
              - Sits visually behind the button (pointer-events: none, z-0)
              - Softly pings from 100% to ~175% scale while fading to 0 opacity
              - Only rendered when the cart has 1 or more items (totalItems > 0)
            */}
            {totalItems > 0 && (
              <>
                <span
                  className="absolute inset-0 rounded-full bg-[#741052] opacity-45 pointer-events-none animate-cart-radar-ping z-0"
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-0 rounded-full bg-[#741052] opacity-45 pointer-events-none animate-cart-radar-ping-delayed z-0"
                  aria-hidden="true"
                />
              </>
            )}

            {/* FLOATING CIRCULAR CART BUTTON */}
            <motion.button
              type="button"
              onClick={openCart}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label={`View Shopping Cart (${totalItems} items)`}
              title="View Shopping Cart"
              className="relative z-10 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#5c0d40] hover:bg-[#741052] text-white border border-white/20 shadow-[0_8px_25px_rgba(92,13,64,0.45),0_4px_12px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_32px_rgba(116,16,82,0.6)] backdrop-blur-md transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9824]"
            >
              {/* Subtle Radial Sheen Overlay */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-transparent to-black/25 pointer-events-none" />

              {/* White Shopping Bag / Cart Icon */}
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-transform duration-200" />

              {/* Red Accent Cart Counter Badge */}
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-[20px] h-5 sm:min-w-[22px] sm:h-[22px] px-1 rounded-full bg-[#ff3b30] text-white text-[11px] sm:text-xs font-black flex items-center justify-center shadow-[0_2px_8px_rgba(255,59,48,0.6)] border-2 border-[#5c0d40] pointer-events-none"
                >
                  {totalItems}
                </motion.span>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
