/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import CartSidebar from './CartSidebar';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { ShoppingBag, Phone, MapPin, Menu, X, ArrowRight, Edit2, Utensils, Navigation } from 'lucide-react';
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
          className="pointer-events-auto h-16 md:h-20 bg-[#5c0d40]/90 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[2rem] flex items-center px-4 md:px-8 transition-all duration-500 relative"
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-[2rem]" />
          
          <div className="w-full flex items-center justify-between relative">
            
            {/* Left: Location & Contact Us (Desktop) + Location/WhatsApp (Mobile) */}
            <div className="flex items-center gap-2 md:gap-2.5">
              {/* Location Button — Desktop & Mobile */}
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
                  <div className="flex flex-col text-left mr-1">
                    <span className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">Location</span>
                    <span className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[110px] md:max-w-[130px]">{activeLocation}</span>
                  </div>
                ) : (
                  <div className="hidden sm:flex flex-col text-left mr-1">
                    <span className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">Location</span>
                    <span className="text-xs font-bold text-white truncate">Select Area</span>
                  </div>
                )}
                <Edit2 size={12} className="text-white/40 hidden sm:inline" />
              </motion.button>

              {/* Call Us Button — Desktop (Right next to Location Pill) */}
              <motion.a
                href="tel:+923331702706"
                whileTap={{ scale: 0.95 }}
                className="hidden lg:flex items-center gap-1.5 h-10 md:h-12 px-2.5 md:px-3.5 rounded-full border transition-all duration-300 bg-white/10 hover:bg-white/15 border-white/20 text-white"
                title="Call Us: +92 333 1702706"
                aria-label="Call Us"
              >
                <Phone size={16} className="text-[#ff9824] shrink-0" />
                <div className="flex flex-col text-left mr-1">
                  <span className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">Call Us</span>
                  <span className="text-xs font-bold text-white truncate">+92 333 1702706</span>
                </div>
              </motion.a>

              {/* WhatsApp Quick Link — Mobile only */}
              <motion.a
                whileTap={{ scale: 0.9 }}
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923331702706'}?text=${encodeURIComponent('Hello Cafe Little Karachi! I have an inquiry.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex lg:hidden w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center text-[#ff9824]"
                aria-label="Chat on WhatsApp"
              >
                <FaWhatsapp size={18} />
              </motion.a>
            </div>

            {/* Center: Brand Identity with Over-sized Circular Badge (Bigger than Header Bar) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20">
              <Link href="/" className="group flex items-center justify-center relative">
                {/* Ambient Halo Glow */}
                <div className="absolute inset-0 bg-[#ff9824]/20 blur-2xl rounded-full scale-90 group-hover:scale-130 transition-transform duration-500 pointer-events-none" />
                
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ 
                    scale: { type: "spring", stiffness: 300, damping: 18 }
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-[#5c0d40] border-2 md:border-[3px] border-white/25 shadow-[0_10px_35px_rgba(0,0,0,0.55),0_0_20px_rgba(255,152,36,0.15)] flex items-center justify-center relative overflow-hidden backdrop-blur-2xl"
                >
                  {/* Subtle radial sheen */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/30 rounded-full pointer-events-none" />
                  
                  <Image 
                    src="/hd-logo.webp" 
                    alt="Cafe Little Karachi Logo" 
                    width={130} 
                    height={130} 
                    priority
                    className="w-[82%] h-[82%] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] relative z-10 transition-transform duration-300 group-hover:scale-105"
                  />
                </motion.div>
              </Link>
            </div>

            {/* Right: Cart & Menu Sidebar Hamburger Button */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Premium Cart Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleCartSidebar}
                className="group relative flex items-center h-10 md:h-12 px-2 md:pl-5 md:pr-2 rounded-full bg-[#ff9824] hover:bg-[#ff7b00] text-white transition-all duration-300 shadow-md"
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

              {/* Menu Sidebar Hamburger Icon (Desktop & Mobile) */}
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(true)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 flex items-center justify-center text-white transition-all duration-300 shadow-md"
                aria-label="Open Menu Sidebar"
                title="Menu"
              >
                <Menu size={20} />
              </motion.button>
            </div>
          </div>
        </motion.header>
      </div>

      {/* MENU SIDEBAR DRAWER (Desktop & Mobile) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative z-10 w-full sm:w-[380px] md:w-[420px] h-full bg-[#5c0d40] text-white p-6 sm:p-8 flex flex-col justify-between shadow-2xl border-l border-white/15 overflow-y-auto"
            >
              <div>
                {/* Header with Logo and Close Button */}
                <div className="flex justify-between items-center mb-10 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Image 
                      src="/hd-logo.webp" 
                      alt="Logo" 
                      width={50} 
                      height={50} 
                      className="drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] object-contain" 
                    />
                    <div>
                      <h3 className="font-bold text-lg text-white">Cafe Little Karachi</h3>
                      <p className="text-[11px] text-white/60">Premium Dining Experience</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-3.5">
                  {[
                    { 
                      label: 'Menu Catalog', 
                      href: '/',
                      icon: Utensils
                    },
                    { 
                      label: 'Change Location / Dining Mode', 
                      onClick: () => { 
                        setMobileMenuOpen(false); 
                        setLocationModalOpen(true); 
                      },
                      icon: MapPin
                    },
                    { 
                      label: 'Find Us On Map', 
                      href: 'https://maps.app.goo.gl/VT5tV6Lm51pxRH7D8?g_st=aw', 
                      external: true,
                      icon: Navigation
                    },
                    { 
                      label: 'WhatsApp Support', 
                      href: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923331702706'}?text=${encodeURIComponent('Hello Cafe Little Karachi! I have an inquiry.')}`,
                      external: true,
                      isWhatsApp: true
                    },
                    { 
                      label: 'Direct Call (+92 333 1702706)', 
                      href: 'tel:+923331702706',
                      icon: Phone
                    },
                  ].map((link, i) => (
                    <motion.div
                      key={link.label}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {link.onClick ? (
                        <button
                          onClick={link.onClick}
                          className="flex w-full items-center justify-between group py-3 px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-[#ff9824]/60 text-white font-bold text-sm sm:text-base uppercase tracking-tight text-left transition-all duration-200 shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-[#ff9824] group-hover:bg-[#ff9824] group-hover:text-slate-950 transition-colors">
                              {link.icon && <link.icon size={18} />}
                            </div>
                            <span className="text-white group-hover:text-amber-200 transition-colors truncate">{link.label}</span>
                          </div>
                          <ArrowRight className="text-[#ff9824] shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-2" size={18} />
                        </button>
                      ) : (
                        <Link 
                          href={link.href!} 
                          target={link.external ? '_blank' : undefined}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex w-full items-center justify-between group py-3 px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-[#ff9824]/60 text-white font-bold text-sm sm:text-base uppercase tracking-tight transition-all duration-200 shadow-sm no-underline hover:no-underline"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-[#ff9824] group-hover:bg-[#ff9824] group-hover:text-slate-950 transition-colors">
                              {link.isWhatsApp ? <FaWhatsapp size={18} className="text-[#25D366] group-hover:text-slate-950" /> : (link.icon && <link.icon size={18} />)}
                            </div>
                            <span className="text-white group-hover:text-amber-200 transition-colors truncate">{link.label}</span>
                          </div>
                          <ArrowRight className="text-[#ff9824] shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-2" size={18} />
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </nav>
              </div>

              {/* Footer Info */}
              <div className="pt-6 mt-8 border-t border-white/10 space-y-3 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Open Daily: 6:30 PM – Late Night</span>
                </div>
                <p>Taste the Authenticity of Karachi in Every Bite.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CART SIDEBAR COMPONENT */}
      {isCartOpen && <CartSidebar closeSidebar={() => setIsCartOpen(false)} />}
    </>
  );
}
