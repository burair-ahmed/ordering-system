/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FaTrashAlt } from "react-icons/fa";
import { useCart } from "../context/CartContext"; // keep your existing context
import { X, ShoppingBag } from "lucide-react";
import { useOrder } from "../context/OrderContext";

const BRAND_FROM = "#C46A47";
const BRAND_TO = "#A65638";
const BRAND_DARK = "#6B3F2A";
const BRAND_GRADIENT = `bg-gradient-to-r from-[${BRAND_FROM}] to-[${BRAND_TO}]`;

/**
 * Props:
 *  - closeSidebar: () => void
 *  - tableId: string
 */
export default function CartSidebar({
  closeSidebar,
}: {
  closeSidebar: () => void;
  tableId: string;
}) 
{

    const { orderType, area, tableId } = useOrder();

  const { cartItems, removeFromCart, updateQuantity, totalAmount, clearCart } =
    useCart();

  const [open, setOpen] = useState(false);
  // used to trigger checkout button pulse when cart updates
  const [lastTotal, setLastTotal] = useState<number>(totalAmount);

  useEffect(() => {
    // mount animation
    const t = setTimeout(() => setOpen(true), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (lastTotal !== totalAmount) {
      // pulse checkout button by toggling a CSS class / using motion key
      setLastTotal(totalAmount);
      // (we rely on Framer Motion key changing through `checkoutKey` below)
    }
  }, [totalAmount, lastTotal]);

  // item count
  const itemCount = useMemo(
    () => cartItems.reduce((s, it) => s + (it.quantity || 0), 0),
    [cartItems]
  );

  // progress bar percentage (optional threshold logic: for example, reward at 1000)
  const progressPercent = Math.min(100, Math.round((totalAmount / 1000) * 100));

  const handleClose = () => {
    setOpen(false);
    // allow exit animation before actually closing parent
    setTimeout(closeSidebar, 320);
  };

  // Motion variants
  const sidebarVariants: Variants = {
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const, // ✅ force literal type
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: { duration: 0.22 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: 20, scale: 0.995 },
    enter: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 260, damping: 20 }, // ✅ also add type
    },
    exit: {
      opacity: 0,
      x: -40,
      scale: 0.98,
      transition: { duration: 0.28 },
    },
  };





const checkoutUrl =
  orderType === "delivery"
    ? `/checkout?type=delivery&area=${encodeURIComponent(area || "")}`
    : orderType === "pickup"
    ? `/checkout?type=pickup`
    : orderType === "dinein"
    ? `/checkout?type=dinein&tableId=${encodeURIComponent(tableId? tableId : "")}`
    : "/"; // fallback

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={sidebarVariants}
          className="fixed inset-y-0 right-0 z-[110] w-full sm:w-[450px] flex flex-col"
          aria-modal="true"
          role="dialog"
        >
          {/* Overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleClose}
            aria-hidden
          />

          {/* Main Sidebar Panel */}
          <motion.div
            className="relative ml-auto h-full w-full sm:w-[450px] bg-[#FAF3E6] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Sidebar Glow Header */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C46A47]/10 rounded-full blur-[80px] -translate-y-32 translate-x-32 pointer-events-none" />

            {/* Header Area */}
            <div className="relative px-8 pt-12 pb-8 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-[#C46A47] mb-2 block">
                  Your Order
                </span>
                <h3 className="text-4xl font-black text-[#6B3F2A] tracking-tighter leading-none">
                  Cart
                </h3>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="w-12 h-12 rounded-full border border-[#E3D6C6] bg-white/40 flex items-center justify-center text-[#6B3F2A] transition-all hover:bg-white"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Content Section */}
            <div className="flex-1 overflow-y-auto px-8 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center pb-20">
                    <div className="w-32 h-32 rounded-full bg-[#E3D6C6]/20 flex items-center justify-center mb-8">
                       <ShoppingBag size={48} className="text-[#C46A47] opacity-20" />
                    </div>
                    <h4 className="text-2xl font-black text-[#6B3F2A] mb-4">Cart is Empty</h4>
                    <p className="text-[#6F5A4A] font-light max-w-[240px] leading-relaxed">
                        Start your journey by exploring our menu and adding your favorites.
                    </p>
                    <button 
                         onClick={handleClose}
                         className="mt-8 text-sm font-black text-[#C46A47] uppercase tracking-widest border-b-2 border-[#C46A47]/20 pb-1 hover:border-[#C46A47] transition-all"
                    >
                        Explore Menu
                    </button>
                </div>
              ) : (
                <ul className="space-y-8 pb-12">
                  <AnimatePresence mode="popLayout">
                    {cartItems.map((item) => {
                      const itemKey = `${item.id}-${JSON.stringify(item.variations || [])}`;
                      return (
                        <motion.li
                          layout
                          initial="hidden"
                          animate="enter"
                          exit="exit"
                          variants={itemVariants}
                          key={itemKey}
                          className="group relative flex gap-6"
                        >
                          {/* Item Image */}
                          <div className="relative w-24 h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-[#C46A47]/10 transition-shadow">
                            <Image
                              src={item.image || "/placeholder.png"}
                              alt={item.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/5" />
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 flex flex-col justify-between py-1">
                             <div>
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-lg font-black text-[#6B3F2A] leading-tight group-hover:text-[#C46A47] transition-colors">{item.title}</h4>
                                    <motion.button
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => removeFromCart(item.id, item.variations)}
                                        className="text-[#6F5A4A]/40 hover:text-[#8B2E2E] transition-colors"
                                    >
                                        <FaTrashAlt size={14} />
                                    </motion.button>
                                </div>
                                {item.variations && item.variations.length > 0 && (
                                    <p className="text-xs text-[#6F5A4A]/60 mt-1 font-medium">{item.variations.join(' • ')}</p>
                                )}
                             </div>

                             <div className="flex items-center justify-between mt-4">
                                {/* Quantity Controls */}
                                <div className="flex items-center bg-white/40 rounded-xl border border-[#E3D6C6]/50 p-1">
                                    <button 
                                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.variations)}
                                        className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center transition-all text-[#6B3F2A]"
                                    >
                                        -
                                    </button>
                                    <span className="w-10 text-center text-sm font-black text-[#6B3F2A]">{item.quantity}</span>
                                    <button 
                                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.variations)}
                                        className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center transition-all text-[#6B3F2A]"
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="font-black text-lg text-[#C46A47]">Rs. {item.price.toFixed(0)}</p>
                             </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer Totals */}
            <div className="bg-white p-10 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.05)] border-t border-[#E3D6C6]/50 relative z-10 transition-all">
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-[#6F5A4A]/60 uppercase tracking-widest">Subtotal</span>
                        <span className="text-sm font-bold text-[#6B3F2A]">Rs. {totalAmount.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-dashed border-[#E3D6C6]">
                        <span className="text-sm font-medium text-[#6F5A4A]/60 uppercase tracking-widest">Tax / VAT</span>
                        <span className="text-sm font-bold text-[#6B3F2A]">Included</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-black text-[#6B3F2A]">Total Amount</span>
                        <span className="text-3xl font-black text-[#C46A47] tracking-tighter">Rs. {totalAmount.toFixed(0)}</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={clearCart}
                        disabled={cartItems.length === 0}
                        className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-[#8B2E2E]/10 text-[#8B2E2E] hover:bg-[#8B2E2E]/5 transition-all disabled:opacity-30"
                    >
                        <FaTrashAlt size={20} />
                    </motion.button>
                    <Link
                        href={checkoutUrl}
                        className={`flex-1 h-16 inline-flex items-center justify-center rounded-2xl bg-[#C46A47] text-white font-black text-xl shadow-[0_20px_40px_-10px_rgba(196,106,71,0.4)] hover:bg-[#fff] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 ${cartItems.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
                        onClick={handleClose}
                    >
                        Checkout
                    </Link>
                </div>
            </div>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
