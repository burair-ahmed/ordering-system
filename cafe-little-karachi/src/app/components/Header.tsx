/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import CartSidebar from './CartSidebar';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { ShoppingBag, Phone, MapPin, Menu, X, ArrowRight } from 'lucide-react';

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartItems, totalAmount } = useCart();
  const { orderType, tableId, isCheckoutModalOpen } = useOrder();
  
  const { scrollY } = useScroll();
  
  // Floating Island Animations
  const islandWidth = useTransform(scrollY, [0, 100], ['95%', '90%']);
  const islandY = useTransform(scrollY, [0, 100], [20, 10]);
  const islandShadow = useTransform(
    scrollY, 
    [0, 100], 
    ['0 4px 20px rgba(0,0,0,0.2)', '0 10px 40px rgba(0,0,0,0.4)']
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleCartSidebar = () => {
    if (['dinein', 'delivery', 'pickup'].includes(orderType)) {
      setIsCartOpen((prev) => !prev);
    } else {
      console.warn('No valid order type found in context');
    }
  };

  if (!isClient) return null;

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      {/* 
        PREMIUM FLOATING ISLAND HEADER
        - High contrast backdrop to solve "white on white" issues.
        - Floating pill design for modern aesthetics.
      */}
      <div className="fixed top-0 left-0 w-full z-50 pointer-events-none flex justify-center">
        <motion.header
          style={{ 
            width: islandWidth,
            y: islandY,
            boxShadow: islandShadow
          }}
          className="pointer-events-auto h-16 md:h-20 bg-[#5c0d40]/90 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[2rem] flex items-center px-4 md:px-8 transition-all duration-500 overflow-hidden"
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="w-full flex items-center justify-between relative">
            
            {/* Left: Contact Info (Desktop) */}
            <div className="hidden lg:flex items-center gap-6">
              <Link href="tel:+923331702704" className="group flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Phone size={14} className="text-[#ff9824]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Call Us</span>
                  <span className="text-xs font-semibold text-white">+92 333 1702704</span>
                </div>
              </Link>
            </div>

            {/* Mobile Menu Trigger */}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white"
            >
              <Menu size={20} />
            </motion.button>

            {/* Center: Brand Identity */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link href={tableId ? `/order?tableId=${tableId}` : '/'} className="group flex items-center justify-center relative">
                {/* Logo Halo Effect */}
                <div className="absolute inset-0 bg-[#ff9824]/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
                
                <motion.div
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Image 
                    src="/butter-paper1.webp" 
                    alt="Logo" 
                    width={60} 
                    height={60} 
                    className="drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] md:w-[80px] md:h-[80px] relative z-10"
                  />
                </motion.div>
              </Link>
            </div>

            {/* Right: Cart and Actions */}
            <div className="flex items-center gap-2 md:gap-4">
               {/* Location Icon (Desktop) */}
               <Link 
                target="_blank" 
                href="https://www.google.com/maps/place/Cafe+Little+Karachi"
                className="hidden md:flex w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center group hover:bg-white/10 transition-colors"
                title="Find Us"
              >
                <MapPin size={16} className="text-[#ff9824]" />
              </Link>

              {/* Premium Cart Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleCartSidebar}
                className="group relative flex items-center h-10 md:h-12 px-2 md:pl-5 md:pr-2 rounded-full bg-[#ff9824] hover:bg-[#ff7b00] text-white transition-all duration-300"
              >
                <span className="hidden md:block text-[10px] font-black uppercase tracking-widest mr-3">My Order</span>
                <div className="w-8 h-8 md:w-9 md:h-9 bg-black/20 rounded-full flex items-center justify-center relative">
                  <ShoppingBag size={16} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-[#ff7b00] text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
                      {totalItems}
                    </span>
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        </motion.header>
      </div>

      {/* MOBILE FULLSCREEN MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[100] bg-[#5c0d40] p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <Image src="/logo.webp" alt="Logo" width={80} height={80} />
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-8">
              {[
                { label: 'Menu Selection', href: tableId ? `/order?tableId=${tableId}` : '/order' },
                { label: 'Our Location', href: 'https://www.google.com/maps/place/Cafe+Little+Karachi', external: true },
                { label: 'Direct Call', href: 'tel:+923331702704' },
              ].map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link 
                    href={link.href} 
                    target={link.external ? '_blank' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex justify-between items-center group font-black text-3xl text-white uppercase tracking-tighter"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="text-[#ff9824] opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="mt-auto p-8 rounded-[2rem] bg-white/5 border border-white/10 text-center">
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Developed By</p>
              <p className="text-white font-black">AA TECH SOLUTIONS</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacing for Fixed Header */}
      <div className="h-24 md:h-32" />

      {/* MOBILE BOTTOM CHECKOUT BAR (Refined) */}
      <AnimatePresence>
        {cartItems.length > 0 && !isCheckoutModalOpen && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-0 w-full px-4 z-40 lg:hidden"
          >
            <div className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Subtotal</span>
                <span className="text-lg font-black text-white">Rs. {totalAmount.toLocaleString()}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleCartSidebar}
                className="bg-[#ff9824] hover:bg-[#ff7b00] text-white rounded-xl px-8 py-3 font-black text-sm uppercase flex items-center gap-2"
              >
                <span>Checkout</span>
                <ArrowRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar Implementation remains safe and functional */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
              onClick={toggleCartSidebar}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <div className="z-[120] fixed inset-y-0 right-0">
               <CartSidebar closeSidebar={toggleCartSidebar} tableId={tableId ?? ''} />
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
