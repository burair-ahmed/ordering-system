/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FaTrashAlt } from "react-icons/fa";
import { useCart } from "../context/CartContext"; // keep your existing context
import { X } from "lucide-react";
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
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 lg:w-[420px] flex flex-col"
          aria-modal="true"
          role="dialog"
        >
          {/* overlay (click to close) */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden
          />

          {/* main panel */}
          <motion.div
            className={`relative ml-auto h-full w-full sm:w-96 lg:w-[420px] 
              bg-[#FAF3E6] rounded-l-[32px]
              border-l border-[#E3D6C6] shadow-2xl overflow-hidden flex flex-col`}
            style={{
              boxShadow: "-20px 0 50px rgba(46,28,20,0.1)",
            }}
          >
            {/* Header */}
            <div className="px-8 pt-10 pb-6 flex items-center justify-between gap-4">
              <div>
                <h3
                  className="text-2xl font-extrabold text-[#6B3F2A] tracking-tight"
                >
                  Your Cart
                </h3>
                <div className="mt-2">
                  <div
                    className="h-1 w-20 rounded-full bg-[#C46A47]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* progress tiny indicator */}
                <div className="hidden sm:flex flex-col items-end text-right">
                  <div className="text-xs text-gray-500">Progress</div>
                  <div className="text-sm font-semibold">
                    Rs. {totalAmount.toFixed(2)}
                  </div>
                </div>

                {/* close button */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleClose}
                  aria-label="Close cart"
                  className="p-2 rounded-full border border-gray-200 hover:shadow-md transition
                    bg-white/60"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* progress bar (top) */}
            <div className="px-6">
              <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full"
                  style={{
                    background: `linear-gradient(90deg, ${BRAND_FROM}, ${BRAND_TO})`,
                  }}
                />
              </div>
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {cartItems.length === 0 ? (
                <div className="min-h-[240px] flex flex-col items-center justify-center gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, type: "spring" }}
                    className="w-48 h-48 relative"
                    aria-hidden
                  >
                    <Image
                      src="/empty-cart.png"
                      alt="Empty cart"
                      fill
                      className="object-contain"
                      priority
                    />
                  </motion.div>
                  <motion.h4
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="text-lg font-semibold text-gray-600"
                  >
                    Your cart is empty
                  </motion.h4>
                  <p className="text-sm text-gray-500 text-center max-w-[220px]">
                    Browse our menu and add items to the cart. We’ll keep them
                    here until you check out.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence>
                    {cartItems.map((item) => {
                      const itemKey = `${item.id}-${JSON.stringify(
                        item.variations || []
                      )}`;
                      return (
                        <motion.li
                          layout
                          initial="hidden"
                          animate="enter"
                          exit="exit"
                          variants={itemVariants}
                          key={itemKey}
                          className="bg-white border border-[#E3D6C6] rounded-2xl p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-all"
                        >
                          {/* Image */}
                          <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden relative">
                            <Image
                              src={item.image || "/placeholder.png"}
                              alt={item.title}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-sm truncate">
                                  {item.title}
                                </div>

                                {/* variations as pills */}
                                {item.variations &&
                                  item.variations.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {item.variations.map((v, i) => (
                                        <span
                                          key={i}
                                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                                        >
                                          {v}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                <div
                                  className="mt-2 text-sm font-bold text-[#C46A47]"
                                >
                                  Rs. {item.price.toFixed(0)}
                                </div>
                              </div>

                              {/* remove button */}
                              <motion.button
                                whileTap={{ scale: 0.92 }}
                                onClick={() =>
                                  removeFromCart(item.id, item.variations)
                                }
                                className="text-[#6F5A4A] hover:text-[#8B2E2E] p-2 rounded-full transition"
                                aria-label={`Remove ${item.title}`}
                              >
                                <FaTrashAlt />
                              </motion.button>
                            </div>

                            {/* quantity control */}
                            <div className="mt-3 flex items-center gap-3">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    Math.max(1, item.quantity - 1),
                                    item.variations
                                  )
                                }
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-[#6B3F2A] hover:bg-[#C46A47] transition-colors shadow-sm"
                                aria-label="Decrease quantity"
                              >
                                -
                              </motion.button>

                              <div className="px-3 py-1 text-sm font-bold text-[#2E1C14] bg-white rounded-full border border-[#E3D6C6]">
                                {item.quantity}
                              </div>

                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.quantity + 1,
                                    item.variations
                                  )
                                }
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-[#6B3F2A] hover:bg-[#C46A47] transition-colors shadow-sm"
                                aria-label="Increase quantity"
                              >
                                +
                              </motion.button>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer (sticky) */}
            <div className="border-t border-[#E3D6C6] p-6 bg-white/50 backdrop-blur-sm">
              <div className="max-w-[100%] mx-auto flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full text-center sm:text-left">
                  <div className="text-xs uppercase tracking-wider font-bold text-[#6F5A4A] mb-1">Total Amount</div>
                  <motion.div
                    key={totalAmount} // trigger animation when total changes
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-3xl font-black text-[#C46A47]"
                  >
                    Rs. {totalAmount.toFixed(0)}
                  </motion.div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      clearCart();
                    }}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[#8B2E2E] font-bold border-2 border-[#8B2E2E]/10 hover:bg-[#8B2E2E]/5 transition-all"
                  >
                    Clear
                  </motion.button>

                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex-1 sm:flex-none"
                  >
                    <Link
                      href={checkoutUrl}
                      className={`w-full inline-flex items-center justify-center gap-3 px-8 py-3 rounded-2xl text-white font-bold shadow-lg ${BRAND_GRADIENT} hover:scale-[1.02] active:scale-95 transition-all hover:text-white hover:no-underline`}
                      onClick={handleClose}
                    >
                      <span>Checkout</span>
                      <span className="text-xs bg-black/20 px-2 py-1 rounded-lg">
                        {itemCount}
                      </span>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
