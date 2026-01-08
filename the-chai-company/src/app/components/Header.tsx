/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ShoppingBag, Phone, MapPin, Menu as MenuIcon, X, Search, User } from 'lucide-react';
import CartSidebar from './CartSidebar';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const { cartItems, totalAmount } = useCart();
  const { orderType, tableId } = useOrder();
  const { scrollY } = useScroll();

  // Scroll animations for desktop
  const headerHeight = useTransform(scrollY, [0, 100], ['100px', '70px']);
  const headerBgAlpha = useTransform(scrollY, [0, 100], [0.8, 0.95]);
  const headerBlur = useTransform(scrollY, [0, 100], [8, 16]);

  useEffect(() => {
    setIsClient(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleCartSidebar = () => {
    if (orderType === 'dinein' || orderType === 'delivery' || orderType === 'pickup') {
      setIsCartOpen((prev) => !prev);
    }
  };

  if (!isClient) return null;

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <motion.header
        style={{ 
          height: headerHeight,
          backgroundColor: `rgba(250, 243, 230, ${isScrolled ? 0.95 : 0.85})`,
        }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 backdrop-blur-xl border-b 
          ${isScrolled ? 'border-[#E3D6C6] shadow-lg' : 'border-transparent'}`}
      >
        <div className="container mx-auto h-full px-4 lg:px-8 flex items-center justify-between">
          
          {/* Left: Quick Actions (Desktop) */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="tel:+923331702704" className="group flex items-center gap-2 text-[#6B3F2A] font-medium transition-colors hover:text-[#C46A47]">
              <div className="p-2 rounded-full bg-[#FAF3E6] group-hover:bg-[#C46A47]/10 border border-[#E3D6C6] transition-all">
                <Phone size={16} className="text-[#C46A47]" />
              </div>
              <span className="text-sm">Call Us</span>
            </Link>
            <Link 
              target="_blank"
              href="https://www.google.com/maps/place/The+Chai+Company"
              className="group flex items-center gap-2 text-[#6B3F2A] font-medium transition-colors hover:text-[#C46A47]"
            >
              <div className="p-2 rounded-full bg-[#FAF3E6] group-hover:bg-[#C46A47]/10 border border-[#E3D6C6] transition-all">
                <MapPin size={16} className="text-[#C46A47]" />
              </div>
              <span className="text-sm">Visit Us</span>
            </Link>
          </div>

          {/* Left: Menu Trigger (Mobile) */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-[#6B3F2A]/5 text-[#6B3F2A] hover:bg-[#6B3F2A]/10 transition-colors"
          >
            <MenuIcon size={24} />
          </button>

          {/* Center: Brand Identity */}
          <Link href={tableId ? `/order?tableId=${tableId}` : '/'} className="absolute left-1/2 -translate-x-1/2">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
              className="relative w-20 h-20 lg:w-28 lg:h-28 flex items-center justify-center pt-2"
            >
              <Image 
                src="/logo.webp" 
                alt="The Chai Company Logo" 
                width={120} 
                height={120} 
                className="object-contain drop-shadow-xl filter brightness-110 contrast-110" 
              />
            </motion.div>
          </Link>

          {/* Right: Functional Icons */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Search (Modern Touch) */}
            <button className="hidden sm:flex p-2.5 rounded-full hover:bg-black/5 text-[#6B3F2A] transition-colors">
              <Search size={20} />
            </button>
            
            <button className="hidden sm:flex p-2.5 rounded-full hover:bg-black/5 text-[#6B3F2A] transition-colors">
              <User size={20} />
            </button>

            {/* Premium Cart Button */}
            <button
              onClick={toggleCartSidebar}
              className="group relative flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#C46A47] hover:bg-[#A65638] text-white font-semibold transition-all shadow-[0_10px_20px_-5px_rgba(196,106,71,0.4)] hover:shadow-[0_15px_25px_-5px_rgba(196,106,71,0.5)] active:scale-95"
            >
              <div className="relative">
                <ShoppingBag size={20} className="group-hover:bounce" />
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#C46A47] text-[10px] font-bold shadow-lg border border-[#C46A47]/20"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </div>
              <span className="hidden md:inline text-sm">Cart &bull; Rs. {totalAmount.toFixed(0)}</span>
              <span className="md:hidden text-xs">Rs. {totalAmount.toFixed(0)}</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Spacer to push content below fixed header */}
      <div className="h-[100px] lg:h-[120px]" />

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-[85%] max-w-sm h-full bg-[#FAF3E6] shadow-2xl p-8 flex flex-col pt-16"
            >
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-[#6B3F2A]/5 text-[#6B3F2A]"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col gap-8 mt-12">
                <Link href="/" className="text-3xl font-bold text-[#6B3F2A] hover:text-[#C46A47] transition-colors">Menu</Link>
                <Link href="/orders" className="text-3xl font-bold text-[#6B3F2A] hover:text-[#C46A47] transition-colors">My Orders</Link>
                <Link href="/about" className="text-3xl font-bold text-[#6B3F2A] hover:text-[#C46A47] transition-colors">Our Story</Link>
                <Link href="/contact" className="text-3xl font-bold text-[#6B3F2A] hover:text-[#C46A47] transition-colors">Contact</Link>
              </div>

              <div className="mt-auto pt-8 border-t border-[#E3D6C6] space-y-4">
                <div className="flex items-center gap-4 text-[#6B3F2A]">
                  <Phone size={20} className="text-[#C46A47]" />
                  <span className="font-medium">+92 333 1702704</span>
                </div>
                <div className="flex items-center gap-4 text-[#6B3F2A]">
                  <MapPin size={20} className="text-[#C46A47]" />
                  <span className="font-medium">The Chai Company, Karachi</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar Implementation */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70]"
              onClick={toggleCartSidebar}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <CartSidebar closeSidebar={toggleCartSidebar} tableId={tableId ?? ''} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
