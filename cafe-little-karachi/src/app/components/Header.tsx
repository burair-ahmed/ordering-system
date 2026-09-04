/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import CartSidebar from './CartSidebar';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { ShoppingBag, Phone, MapPin, Menu, X, ArrowRight, Edit2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { isOpenAt } from '../lib/restaurantStatus';

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const {
    orderType,
    area,
    tableId,
    isLocationSet,
    setLocationModalOpen
  } = useOrder();
  
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
    setIsCartOpen((prev) => !prev);
  };

  if (!isClient) return null;

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Derive human-readable location tag
  const locationLabel = () => {
    if (orderType === "delivery" && area) return area;
    if (orderType === "dinein" && tableId) return `Table ${tableId}`;
    if (orderType === "pickup") return "Pickup";
    return null;
  };

  const activeLocation = locationLabel();

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
              <Link href="tel:+923331702706" className="group flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Phone size={14} className="text-[#ff9824]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Call Us</span>
                  <span className="text-xs font-semibold text-white">+92 333 1702706</span>
                </div>
              </Link>
            </div>

            {/* Mobile Actions: Hamburger Menu + WhatsApp */}
            <div className="flex lg:hidden items-center gap-2">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(true)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white"
                aria-label="Open mobile menu"
              >
                <Menu size={20} />
              </motion.button>
              <motion.a
                whileTap={{ scale: 0.9 }}
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923331702706'}?text=${encodeURIComponent('Hello Cafe Little Karachi! I have an inquiry.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#ff9824]"
                aria-label="Chat on WhatsApp"
              >
                <FaWhatsapp size={18} />
              </motion.a>
            </div>

            {/* Center: Brand Identity */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link href="/" className="group flex items-center justify-center relative">
                {/* Logo Halo Effect */}
                <div className="absolute inset-0 bg-[#ff9824]/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
                
                <motion.div
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  transition={{ 
                    scale: { type: "spring", stiffness: 300, damping: 15 },
                    rotate: { duration: 0.4, ease: "easeInOut" }
                  }}
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

            {/* Right: Location Selector & Cart */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Location Button — opens OrderTypeModal to change delivery area / table / pickup */}
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocationModalOpen(true)}
                className={`flex items-center gap-1.5 h-10 md:h-12 px-2.5 md:px-3.5 rounded-full border transition-all duration-300 ${
                  activeLocation 
                    ? "bg-white/10 hover:bg-white/15 border-white/20 text-white" 
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-[#ff9824]"
                }`}
                title="Update Location or Order Mode"
                aria-label="Update Location"
              >
                <MapPin size={16} className="text-[#ff9824] shrink-0" />
                {activeLocation ? (
                  <div className="hidden sm:flex flex-col text-left mr-1">
                    <span className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">Location</span>
                    <span className="text-xs font-bold text-white truncate max-w-[100px] md:max-w-[130px]">{activeLocation}</span>
                  </div>
                ) : (
                  <span className="hidden sm:inline text-xs font-semibold text-white/80">Location</span>
                )}
                <Edit2 size={12} className="text-white/40 hidden sm:inline" />
              </motion.button>

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
              <Image src="/butter-paper1.webp" alt="Logo" width={80} height={80} className="drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" />
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-8">
              {[
                { label: 'Menu Selection', href: '/' },
                { label: 'Change Location / Mode', onClick: () => { setMobileMenuOpen(false); setLocationModalOpen(true); } },
                { label: 'Find Us On Map', href: 'https://maps.app.goo.gl/VT5tV6Lm51pxRH7D8?g_st=aw', external: true },
                { label: 'Direct Call', href: 'tel:+923331702706' },
              ].map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {link.onClick ? (
                    <button
                      onClick={link.onClick}
                      className="flex w-full justify-between items-center group font-black text-2xl text-white uppercase tracking-tighter text-left"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="text-[#ff9824] opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                    </button>
                  ) : (
                    <Link 
                      href={link.href!} 
                      target={link.external ? '_blank' : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex justify-between items-center group font-black text-3xl text-white uppercase tracking-tighter"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="text-[#ff9824] opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                    </Link>
                  )}
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CART SIDEBAR COMPONENT */}
      {isCartOpen && <CartSidebar closeSidebar={() => setIsCartOpen(false)} />}
    </>
  );
}
