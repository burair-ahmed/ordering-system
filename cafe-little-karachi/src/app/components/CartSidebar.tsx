/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useOrder } from "../context/OrderContext";
import posthog from "posthog-js";
import { isOpenAt } from "../lib/restaurantStatus";
import { toast } from "sonner";
import { trackEvent } from "../lib/analytics";
import {
  ShoppingBag,
  X,
  Trash2,
  Minus,
  Plus,
  Calculator,
  Truck,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const BRAND_FROM = "#741052";
const BRAND_TO = "#d0269b";

interface CartSidebarProps {
  closeSidebar?: () => void;
  onClose?: () => void;
  isOpen?: boolean;
  tableId?: string;
}

export default function CartSidebar({
  closeSidebar,
  onClose,
}: CartSidebarProps) {
  const { orderType, area, tableId } = useOrder();
  const { cartItems, removeFromCart, updateQuantity, totalAmount, clearCart } =
    useCart();

  const [open, setOpen] = useState(false);
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [expandedAddons, setExpandedAddons] = useState<{
    [itemKey: string]: boolean;
  }>({});

  useEffect(() => {
    // Mount animation
    const t = setTimeout(() => setOpen(true), 20);
    trackEvent("journey_view_cart", {
      item_count: cartItems.reduce((s, it) => s + (it.quantity || 0), 0),
      total_amount: totalAmount,
      items: cartItems.map((it) => ({
        id: it.id,
        title: it.title,
        price: it.price,
        quantity: it.quantity,
      })),
    });

    // Fetch delivery areas for real-time delivery fee calculation in summary box
    let isMounted = true;
    fetch("/api/delivery-areas")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setDeliveryAreas(data);
        }
      })
      .catch(() => {});

    return () => {
      clearTimeout(t);
      isMounted = false;
    };
  }, []);

  // Item count
  const itemCount = useMemo(
    () => cartItems.reduce((s, it) => s + (it.quantity || 0), 0),
    [cartItems]
  );

  // Dynamic delivery fee calculation
  const deliveryFee = useMemo(() => {
    if (orderType !== "delivery") return 0;
    if (!area) return 150; // fallback standard delivery charge if area not yet selected
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = clean(area);
    const matched = deliveryAreas.find((a) => {
      const aClean = clean(a.name || "");
      return aClean === target || aClean.includes(target) || target.includes(aClean);
    });
    return matched ? Number(matched.charge || 0) : 150;
  }, [orderType, area, deliveryAreas]);

  const grandTotal = totalAmount + deliveryFee;

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      if (closeSidebar) closeSidebar();
      if (onClose) onClose();
    }, 280);
  };

  const toggleAddons = (key: string) => {
    setExpandedAddons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Motion variants
  const sidebarVariants: Variants = {
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
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
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    enter: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 260, damping: 20 },
    },
    exit: {
      opacity: 0,
      x: -25,
      scale: 0.96,
      transition: { duration: 0.2 },
    },
  };

  const checkoutUrl = "/checkout";

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={sidebarVariants}
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] lg:w-[440px] flex flex-col"
          aria-modal="true"
          role="dialog"
        >
          {/* Overlay (click to close) */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
            aria-hidden
          />

          {/* Main Slide-in Panel */}
          <motion.div
            className="relative ml-auto h-full w-full sm:w-[420px] lg:w-[440px] bg-[#fbf9fb] dark:bg-neutral-950 shadow-2xl overflow-hidden flex flex-col"
            style={{
              boxShadow:
                "0 20px 60px rgba(16,24,40,0.35), 0 0 40px rgba(116,16,82,0.06)",
            }}
          >
            {/* 1. HEADER (Bag Icon + Title left, Clear + Close right) */}
            <div className="bg-[#5c0d40] text-white px-5 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Your Cart
                </h2>
              </div>

              <div className="flex items-center gap-2.5">
                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-white/75 hover:text-white hover:underline transition-colors font-medium px-1.5 py-1"
                    title="Clear all items from cart"
                  >
                    Clear
                  </button>
                )}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleClose}
                  aria-label="Close cart"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Scrollable Content: Item Cards, Add More Items, Order Summary Box */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="min-h-[320px] flex flex-col items-center justify-center gap-4 text-center px-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="w-40 h-40 relative"
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
                  <h4 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                    Your cart is empty
                  </h4>
                  <p className="text-sm text-neutral-500 max-w-[240px]">
                    Browse our menu and add items to the cart. We’ll keep them
                    here until you checkout.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#741052] to-[#d0269b] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    Explore Menu
                  </button>
                </div>
              ) : (
                <>
                  {/* 2. CART ITEM CARDS */}
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {cartItems.map((item) => {
                        const itemKey = `${item.id}-${JSON.stringify(
                          item.variations || []
                        )}`;
                        const isExpanded = expandedAddons[itemKey] !== false; // expanded by default or toggled
                        const hasVariations =
                          item.variations && item.variations.length > 0;

                        return (
                          <motion.div
                            layout
                            initial="hidden"
                            animate="enter"
                            exit="exit"
                            variants={itemVariants}
                            key={itemKey}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-[#741052]/10 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow"
                          >
                            {/* Top row: Thumbnail, Name & Price, Grouped Quantity Pill */}
                            <div className="flex items-center gap-3">
                              {/* Left: Product Thumbnail */}
                              <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden relative bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50">
                                <Image
                                  src={item.image || "/placeholder.png"}
                                  alt={item.title}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              </div>

                              {/* Middle: Name & Strikethrough/Final Price */}
                              <div className="flex-1 min-w-0 pr-1">
                                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 truncate">
                                  {item.title}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {item.originalPrice &&
                                  item.originalPrice > item.price ? (
                                    <>
                                      <span className="text-xs text-neutral-400 line-through">
                                        Rs. {item.originalPrice.toLocaleString()}
                                      </span>
                                      <span className="font-bold text-sm text-[#741052] dark:text-[#f472b6]">
                                        Rs. {item.price.toLocaleString()}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="font-bold text-sm text-[#741052] dark:text-[#f472b6]">
                                      Rs. {item.price.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right: Single Grouped Quantity Control [ Trash/Minus | Qty | Plus ] */}
                              <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50/90 dark:bg-neutral-800/90 px-2 py-1 gap-2 flex-shrink-0 shadow-sm">
                                {item.quantity === 1 ? (
                                  <motion.button
                                    whileTap={{ scale: 0.88 }}
                                    onClick={() =>
                                      removeFromCart(item.id, item.variations)
                                    }
                                    aria-label={`Delete ${item.title}`}
                                    className="text-red-500 hover:text-red-600 transition-colors p-0.5 flex items-center justify-center"
                                    title="Delete item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </motion.button>
                                ) : (
                                  <motion.button
                                    whileTap={{ scale: 0.88 }}
                                    onClick={() =>
                                      updateQuantity(
                                        item.id,
                                        item.quantity - 1,
                                        item.variations
                                      )
                                    }
                                    aria-label="Decrease quantity"
                                    className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors p-0.5 flex items-center justify-center"
                                    title="Decrease quantity"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </motion.button>
                                )}

                                <span className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-100 min-w-[14px] text-center select-none">
                                  {item.quantity}
                                </span>

                                <motion.button
                                  whileTap={{ scale: 0.88 }}
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.quantity + 1,
                                      item.variations
                                    )
                                  }
                                  aria-label="Increase quantity"
                                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors p-0.5 flex items-center justify-center"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </motion.button>
                              </div>
                            </div>

                            {/* Add-ons & Variations Section (formatted to match reference) */}
                            {hasVariations && (
                              <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="space-y-1.5 overflow-hidden pl-1"
                                    >
                                      {item.variations!.map((variation, vIdx) => {
                                        const parts = variation.includes(":")
                                          ? variation.split(":")
                                          : [null, variation];
                                        const heading = parts[0]?.trim();
                                        const optionName = (
                                          parts[1] || parts[0]
                                        )?.trim();

                                        return (
                                          <div key={vIdx} className="text-xs">
                                            {heading ? (
                                              <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                                <span className="text-neutral-400 text-[10px]">
                                                  ●
                                                </span>
                                                <span>{heading}</span>
                                              </div>
                                            ) : (
                                              <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                                <span className="text-neutral-400 text-[10px]">
                                                  ●
                                                </span>
                                                <span>Customization</span>
                                              </div>
                                            )}
                                            <div className="mt-1 pl-4">
                                              <div className="inline-block bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-100 dark:border-neutral-700/60 rounded px-2 py-0.5 text-[11px] text-neutral-600 dark:text-neutral-300 font-medium">
                                                <span className="text-neutral-400 mr-1.5">
                                                  ▪
                                                </span>
                                                {optionName}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Expandable "View Add-ons" link with chevron */}
                                <button
                                  type="button"
                                  onClick={() => toggleAddons(itemKey)}
                                  className="mt-2 text-xs font-semibold text-neutral-500 hover:text-[#741052] dark:hover:text-[#d0269b] flex items-center gap-1 transition-colors select-none"
                                >
                                  <span>
                                    {isExpanded ? "Hide Add-ons" : "View Add-ons"}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* 3. ADD MORE ITEMS (Dashed border full-width button) */}
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    onClick={handleClose}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#741052] dark:hover:border-[#d0269b] hover:bg-[#741052]/5 dark:hover:bg-[#d0269b]/5 transition-all flex items-center justify-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-[#741052] dark:text-[#d0269b]" />
                    <span>Add more items</span>
                  </motion.button>

                  {/* 4. ORDER SUMMARY BOX */}
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-[#741052]/10 dark:border-neutral-800 shadow-sm space-y-3">
                    {/* Row 1: Total */}
                    <div className="flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
                      <div className="flex items-center gap-2.5">
                        <Calculator className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                        <span className="font-medium">Total</span>
                      </div>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        Rs. {totalAmount.toLocaleString()}
                      </span>
                    </div>

                    {/* Row 2: Delivery Fee */}
                    <div className="flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
                      <div className="flex items-center gap-2.5">
                        <Truck className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                        <span className="font-medium">Delivery Fee</span>
                      </div>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {orderType === "delivery"
                          ? `Rs. ${deliveryFee.toLocaleString()}`
                          : "Free"}
                      </span>
                    </div>

                    {/* Divider Rule */}
                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2" />

                    {/* Row 3: Grand Total */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                        Grand Total
                      </span>
                      <span className="font-extrabold text-lg text-[#741052] dark:text-[#f472b6]">
                        Rs. {grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 5. CHECKOUT CTA (Single full-width primary button pinned at bottom) */}
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-neutral-200/70 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md flex-shrink-0">
                {isOpenAt() ? (
                  <Link
                    href={checkoutUrl}
                    onClick={() => {
                      posthog.capture("journey_start_checkout", {
                        cart_value: totalAmount,
                        item_count: itemCount,
                        order_type: orderType,
                      });
                      handleClose();
                    }}
                    className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-base shadow-lg shadow-[#741052]/20 bg-gradient-to-r from-[#741052] to-[#d0269b] hover:from-[#5c0d40] hover:to-[#b81f88] flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99]"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <button
                    onClick={() =>
                      toast.error(
                        "Cafe Little Karachi is currently closed. Ordering opens at 6:30 PM!"
                      )
                    }
                    className="w-full py-3.5 px-6 rounded-xl bg-slate-600 text-gray-200 font-bold text-base shadow cursor-not-allowed opacity-85 flex items-center justify-center gap-2"
                  >
                    <span>Closed (Opens 6:30 PM)</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
