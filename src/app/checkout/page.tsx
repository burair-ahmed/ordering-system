/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

"use client";

import React, {
  FC,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import Preloader from "../components/Preloader"; // your existing spinner
// icons (react-icons used for quick icons)
import { FiChevronLeft, FiCheck, FiX } from "react-icons/fi";
// import DineInForm from "./forms/DineInForm";
// import PickupForm from "./forms/PickupForm";
// import DeliveryForm from "./forms/DeliveryForm";
import { toast } from "sonner";
import { useOrder } from "../context/OrderContext";
import { Banknote, CreditCard, Currency } from "lucide-react";

const BRAND_FROM = "#741052";
const BRAND_TO = "#d0269b";
const BRAND_TO1 = "#ff03afff";
const BRAND_GRADIENT_CSS = `linear-gradient(105deg, ${BRAND_FROM}, ${BRAND_TO}, ${BRAND_TO1}, ${BRAND_TO}, ${BRAND_FROM})`;

/**
 * Helper small spinner used inside buttons if you don't have Preloader
 */
const ButtonSpinner: FC = () => (
  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
    />
    <path
      className="opacity-75"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      fill="currentColor"
    />
  </svg>
);

const CheckoutPageContent: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cartItems, totalAmount, clearCart, updateQuantity, removeFromCart } =
    useCart();

  // form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    tableNumber: "",
    area: "",
    phone: "",
    paymentMethod: "cash",
    ordertype: "dinein",
  });

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [detectedArea, setDetectedArea] = useState("");
  const [showOnlineInfo, setShowOnlineInfo] = useState(false);

  // refs for GSAP timeline (optional)
  const formRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const { orderType, area, tableId } = useOrder();
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // remove non-digits

    // Force start with 03
    if (!value.startsWith("03")) {
      value = "03" + value.replace(/^03*/, "");
    }

    // Limit to 11 digits
    value = value.slice(0, 11);

    setFormData((prev) => ({ ...prev, phone: value }));
  };

  // preserve tableId from query or local storage
  useEffect(() => {
    setMounted(true);
    if (!searchParams) return;
    const typeParam = searchParams.get("type");
    if (typeParam) {
      setFormData((s) => ({ ...s, ordertype: typeParam }));
    }

    const tableId = searchParams.get("tableId");
    if (tableId) {
      setFormData((s) => ({ ...s, tableNumber: tableId }));
      // store locally as well
      try {
        localStorage.setItem("tableId", tableId);
      } catch {}
    } else {
      // fallback to local storage if exists
      try {
        const t = localStorage.getItem("tableId");
        if (t) setFormData((s) => ({ ...s, tableNumber: t }));
      } catch {}
    }
  }, [searchParams]);
  useEffect(() => {
    if (!searchParams) return;

    const encodedArea = searchParams.get("area");
    if (encodedArea) {
      const decodedArea = decodeURIComponent(encodedArea);
      setDetectedArea(decodedArea); // ONLY STORE HERE
    }
  }, [searchParams]);

  // GSAP timeline on mount (optional). Dynamically import so build won't fail if gsap is missing.
  useEffect(() => {
    let gsapTimeline: any = null;
    let gsap: any = null;
    let ctxCleanup: (() => void) | undefined;
    (async () => {
      try {
        const pkg = await import("gsap");
        gsap = pkg.default || pkg;
        if (gsap && (formRef.current || cartRef.current)) {
          gsapTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
          // small stagger reveal
          if (formRef.current) {
            gsapTimeline.from(
              formRef.current.querySelectorAll(".field-stagger"),
              {
                y: 18,
                opacity: 0,
                stagger: 0.08,
                duration: 0.45,
              }
            );
          }
          if (cartRef.current) {
            gsapTimeline.from(
              cartRef.current.querySelectorAll(".cart-item-stagger"),
              {
                x: 18,
                opacity: 0,
                stagger: 0.06,
                duration: 0.38,
              },
              "-=0.35"
            );
          }
        }
      } catch (e) {
        // gsap not installed, that's fine — Framer Motion still provides good animations
      }
    })();

    return () => {
      if (gsapTimeline) {
        gsapTimeline.kill();
      }
      if (ctxCleanup) ctxCleanup();
    };
  }, []);

  // keyboard handler for modal (Esc to close)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    if (isModalOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isModalOpen]);

  // helper: update form fields
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handlePaymentChange = (method: "cash" | "online") => {
    setFormData((s) => ({ ...s, paymentMethod: method }));
  };

  // your original checkout handler (opens confirmation modal)
  const handleCheckout = () => {
    if (!formData.name) {
      toast.error("Please enter your name.", {
        description: "Full name is required to proceed.",
      });
      return;
    }

    if (formData.ordertype === "dinein" && !formData.tableNumber) {
      toast.error("Table number missing.", {
        description: "Please enter your table number to continue.",
      });
      return;
    }

    if (formData.ordertype === "delivery" && !formData.area) {
      toast.error("Delivery address missing.", {
        description: "Please provide your delivery address or area.",
      });
      return;
    }
    if (formData.ordertype === "delivery" && !formData.phone) {
      toast.error("Phone Number missing.", {
        description: "Please provide your Contact Number.",
      });
      return;
    }

    setIsModalOpen(true);
    toast.success("All details verified!", {
      description: "Please confirm your order in the next step.",
    });
  };
  const DELIVERY_CHARGES: Record<string, number> = {
    "Gulistan-e-Johar (All Blocks)": 150,
    "Johor Block 7": 200,
    "Johor Block 8": 200,
    "Johor Block 9": 200,
    "Johor Block 10": 200,
    "Dalmia Road": 200,
    "Askari 4": 200,
    "NHS Phase 1": 250,
    "NHS Phase 2": 250,
    "NHS Phase 3": 350,
    "NHS Phase 4": 350,
    "Scheme 33": 280,
    "Saadi Town (All Areas)": 350,
    "Malir Checkpost 5": 350,
    "Malir Checkpost 6": 350,
    "Malir (All Areas)": 450,
    "Gulshan-e-Iqbal Block 1": 200,
    "Gulshan-e-Iqbal Block 2": 200,
    "Gulshan-e-Iqbal Block 3": 200,
    "Gulshan-e-Iqbal Block 4": 200,
    "Gulshan-e-Iqbal Block 5": 200,
    "Gulshan-e-Iqbal Block 6": 200,
    "Gulshan-e-Iqbal Block 7": 200,
    "Gulshan-e-Iqbal Block 10": 200,
    "Gulshan-e-Iqbal Block 11": 200,
    "Gulshan-e-Iqbal Block 8": 250,
    "Gulshan-e-Iqbal Block 9": 250,
    "Gulshan-e-Iqbal Block 13": 250,
    "Gulshan-e-Iqbal Block 14": 250,
    "Gulshan-e-Iqbal Block 15": 250,
    "Gulshan-e-Iqbal Block 16": 250,
    "Gulshan-e-Iqbal Block 17": 250,
    "Gulshan-e-Iqbal Block 18": 250,
    "Gulshan-e-Iqbal Block 19": 250,
    "FB Area (All Blocks)": 350,
    "Shah Faisal Colony": 450,
    "Bahadurabad (All Areas)": 450,
    "Shahrah-e-Faisal (On Demand)": 0, // or handle manually
  };

  // Define delivery charge at the top of the component
  const deliveryCharge =
    formData.ordertype === "delivery" ? DELIVERY_CHARGES[detectedArea] || 0 : 0;

  const finalAmount = totalAmount + deliveryCharge;

  // Inside the component, before return:

  // preserves your existing order placement logic
  const handlePlaceOrder = async (): Promise<void> => {
    setIsProcessing(true);

    const newOrder = {
      customerName: formData.name,
      email: formData.email || "",
      phone: formData.phone || "",
      area: formData.area || "",
      tableNumber: formData.tableNumber,
      ordertype: formData.ordertype,
      deliveryCharge: deliveryCharge,
      paymentMethod: formData.paymentMethod,
      items: cartItems.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        variations: item.variations || [],
      })),
      totalAmount: finalAmount,
      status: "Received",
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      if (res.ok) {
        const json = await res.json();
        const orderNumber = json.orderNumber || json.id || "N/A";
        const orderType = json.ordertype;

        // send WhatsApp notification
        await sendWhatsAppNotification({ ...newOrder, orderNumber });
        clearCart();
        setIsModalOpen(false);

        // Redirect dynamically based on order type
        if (orderType === "dinein") {
          router.push(`/thank-you?type=dinein&tableId=${formData.tableNumber}`);
        } else if (orderType === "pickup") {
          router.push(`/thank-you?type=pickup&order=${orderNumber}`);
        } else if (orderType === "delivery") {
          router.push(
            `/thank-you?type=delivery&order=${orderNumber}&phone=${
              formData.phone
            }&area=${encodeURIComponent(formData.area)}`
          );
        }
      } else {
        toast.error("Order failed", {
          description: "Could not save your order. Please try again.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong", {
        description: "Unable to connect to the server. Try again later.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // keep your WhatsApp sender intact
  const sendWhatsAppNotification = async (order: {
    orderNumber: string;
    customerName: string;
    email: string;
    tableNumber: string;
    paymentMethod: string;
    items: {
      id: string;
      title: string;
      quantity: number;
      price: number;
      variations: string[];
    }[];
    totalAmount: number;
  }) => {
    const {
      customerName,
      tableNumber,
      paymentMethod,
      items,
      totalAmount,
      orderNumber,
    } = order;

    const message = `
New Order Received:
- Order Number: ${orderNumber}
- Customer Name: ${customerName}
- Table Number: ${tableNumber}
- Payment Method: ${paymentMethod}
- Total Amount: Rs. ${totalAmount.toFixed(2)}
- Items:
${items
  .map(
    (it, idx) =>
      `  ${idx + 1}. ${it.title} x${it.quantity} (Rs. ${
        it.price * it.quantity
      })`
  )
  .join("\n")}
`;

    try {
      await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
    } catch (err) {
      console.error("WhatsApp send failed", err);
    }
  };

  // formatted cart items & totals
  const formattedItems = useMemo(() => cartItems || [], [cartItems]);

  // small motion variants
  const containerFade = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
  };
  // put near other motion variants in the file
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, when: "beforeChildren" as const },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 16, scale: 0.995 },
    show: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 28 },
    },
    exit: {
      opacity: 0,
      x: -28,
      transition: { duration: 0.24 },
    },
  };
  useEffect(() => {
    if (formData.paymentMethod === "online") {
      setShowOnlineInfo(true);
    } else {
      setShowOnlineInfo(false);
    }
  }, [formData.paymentMethod]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-wide text-gray-900">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-gray-600 -300 max-w-2xl">
          Review your order, choose payment method and confirm. We’ll notify you
          shortly.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Checkout form */}
        <motion.section
          className="lg:col-span-7 bg-white/70  backdrop-blur-md rounded-2xl p-6 shadow"
          initial="hidden"
          animate="show"
          variants={containerFade}
          ref={formRef}
          aria-labelledby="checkout-form-title"
        >
          <div className="mb-4">
            <h2
              id="checkout-form-title"
              className="text-xl font-semibold"
              style={{
                background: BRAND_GRADIENT_CSS,
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Customer & Payment
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Enter details to complete your order
            </p>
          </div>

          {/* form fields */}
          {/* Dynamic Unified Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="field-stagger">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name ?? ""}
                onChange={handleInputChange}
                required
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 rounded-lg border border-neutral-200  
                 bg-white/80 focus:outline-none focus:ring-2 
                 focus:ring-[#741052] transition"
              />
            </div>

            {/* Email */}
            <div className="field-stagger">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                name="email"
                type="email"
                value={formData.email ?? ""}
                onChange={handleInputChange}
                placeholder="you@domain.com"
                className="w-full px-4 py-3 rounded-lg border border-neutral-200  
                 bg-white/80 focus:outline-none focus:ring-2 
                 focus:ring-[#741052] transition"
              />
            </div>

            {/* Dine-In specific field */}
            {formData.ordertype === "dinein" && (
              <div className="field-stagger sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number
                </label>
                <input
                  name="tableNumber"
                  value={formData.tableNumber ?? ""}
                  onChange={handleInputChange}
                  placeholder="Enter table number"
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200  
                   bg-neutral-100/60 text-gray-600 
                   cursor-not-allowed"
                />
              </div>
            )}

            {/* Delivery specific fields */}
            {formData.ordertype === "delivery" && (
              <>
                {/* Delivery Address / Area */}
                <div className="field-stagger sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address / {area}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="area"
                    type="address"
                    value={`${formData.area}`}
                    onChange={handleInputChange}
                    required
                    placeholder={`Enter delivery address or area ${area}`}
                    className="w-full px-4 py-3 rounded-lg border border-neutral-200  
                     bg-white/80 focus:outline-none focus:ring-2 
                     focus:ring-[#741052] transition"
                  />
                </div>

                {/* Phone Number */}
                <div className="field-stagger sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone ?? ""}
                    onChange={handlePhoneChange}
                    required
                    placeholder="03XXXXXXXXX"
                    className="w-full px-4 py-3 rounded-lg border border-neutral-200  
             bg-white/80 focus:outline-none focus:ring-2 
             focus:ring-[#741052] transition"
                  />
                </div>
              </>
            )}
          </div>

          {/* payment method segmented buttons */}
          <div className="mt-6 field-stagger">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="inline-flex bg-neutral-100/60 rounded-full p-1 gap-2">
              <button
                onClick={() => handlePaymentChange("cash")}
                className={`flex items-center gap-1 px-4 py-2 rounded-full font-medium transition focus:outline-none ${
                  formData.paymentMethod === "cash"
                    ? "text-white"
                    : "text-gray-700"
                }`}
                style={
                  formData.paymentMethod === "cash"
                    ? {
                        background: BRAND_GRADIENT_CSS,
                        boxShadow: "0 8px 30px rgba(116,16,82,0.14)",
                      }
                    : {}
                }
                aria-pressed={formData.paymentMethod === "cash"}
              >
                <Banknote size={20} />
                Cash
              </button>
              <div
                onClick={() => {
                  toast.error("Online payment is disabled for now");
                }}
                className="inline-block"
              >
                <button
                  onClick={() => {
                    handlePaymentChange("online");
                    setShowOnlineInfo(true);
                    // toggle open/close
                  }}
                  className={`flex items-center gap-1 px-4 py-2 rounded-full font-medium transition focus:outline-none ${
                    formData.paymentMethod === "online"
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                  style={
                    formData.paymentMethod === "online"
                      ? {
                          background: BRAND_GRADIENT_CSS,
                          boxShadow: "0 8px 30px rgba(116,16,82,0.14)",
                        }
                      : {}
                  }
                  aria-pressed={formData.paymentMethod === "online"}
                  disabled={false}
                >
                  <CreditCard size={20} />
                  Online
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Choose the preferred payment method.
            </p>
          </div>

          {/* Place order CTA */}
          <div className="mt-6">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 font-semibold rounded-full text-white"
              style={{
                background: BRAND_GRADIENT_CSS,
                boxShadow: "0 12px 40px rgba(116,16,82,0.12)",
              }}
              aria-label="Proceed to payment"
            >
              {/* spinner if processing - but processing handled in modal on place order */}
              <span>Proceed to Payment</span>
            </motion.button>

            <div className="mt-3 text-xs text-gray-500">
              By proceeding, you confirm your order and agree to our terms.
            </div>
          </div>
        </motion.section>

        {/* RIGHT: Cart summary (sticky on desktop) */}
        <motion.aside
          className="lg:col-span-5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          ref={cartRef}
        >
          <div
            className="sticky top-20 flex flex-col lg:flex-col-reverse
"
          >
            <AnimatePresence>
              {showOnlineInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 p-4 rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <h3 className="text-sm font-semibold mb-3">
                    Online Payment Details
                  </h3>

                  <div className="space-y-4 text-sm">
                    {/* BANK TRANSFER */}
                    <div className="flex gap-3">
                      <Image
                        src="/meezan-bank-logo.png"
                        alt="Bank Transfer"
                        width={36}
                        height={36}
                        className="rounded-md object-contain"
                      />
                      <div>
                        <p className="font-medium text-gray-800">
                          Bank Transfer
                        </p>
                        <p className="text-gray-600">Bank: Meezan Bank</p>
                        <p className="text-gray-600">
                          Account Title: Your Business
                        </p>
                        <p className="text-gray-600">Account No: 0123456789</p>
                      </div>
                    </div>

                    <hr />

                    {/* EASYPAISA */}
                    <div className="flex gap-3">
                      <Image
                        src="/Easypaisa-logo.png"
                        alt="Easypaisa"
                        width={36}
                        height={36}
                        className="rounded-md object-contain"
                      />
                      <div>
                        <p className="font-medium text-gray-800">Easypaisa</p>
                        <p className="text-gray-600">Number: 03XX-XXXXXXX</p>
                        <p className="text-gray-600">Name: Your Name</p>
                      </div>
                    </div>

                    <hr />

                    {/* JAZZCASH */}
                    <div className="flex gap-3">
                      <Image
                        src="/JazzCash-2025-Logo-PNG-Vector2.png"
                        alt="JazzCash"
                        width={36}
                        height={36}
                        className="rounded-md object-contain"
                      />
                      <div>
                        <p className="font-medium text-gray-800">JazzCash</p>
                        <p className="text-gray-600">Number: 03XX-XXXXXXX</p>
                        <p className="text-gray-600">Name: Your Name</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Cart Summary</h3>
                <div className="text-sm text-gray-500">
                  {formattedItems.length} items
                </div>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="sync">
                  {formattedItems.map((it, idx) => (
                    <motion.div
                      key={`${it.id}-${idx}`}
                      layout
                      variants={itemVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 28,
                      }}
                    >
                      <div
                        key={idx}
                        className="cart-item-stagger bg-white/60 backdrop-blur-sm rounded-xl p-3 flex gap-3 items-center shadow hover:shadow-md "
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden relative flex-shrink-0">
                          <Image
                            src={it.image || "/placeholder.png"}
                            alt={it.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate">
                                {it.title}
                              </div>
                              {it.variations && (
                                <div className="text-xs text-rose-800 mt-1">
                                  {Array.isArray(it.variations)
                                    ? it.variations.join(", ")
                                    : String(it.variations)}
                                </div>
                              )}
                            </div>
                            <div
                              className="text-sm font-bold"
                              style={{
                                background: BRAND_GRADIENT_CSS,
                                WebkitBackgroundClip: "text",
                                color: "transparent",
                              }}
                            >
                              Rs. {(it.price * it.quantity).toFixed(2)}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  it.id,
                                  Math.max(1, it.quantity - 1),
                                  it.variations
                                )
                              }
                              aria-label="Decrease"
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                              style={{ background: BRAND_GRADIENT_CSS }}
                            >
                              -
                            </button>
                            <div className="px-3 py-1 bg-white/70 rounded-full border border-gray-100 text-sm font-medium">
                              {it.quantity}
                            </div>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  it.id,
                                  it.quantity + 1,
                                  it.variations
                                )
                              }
                              aria-label="Increase"
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                              style={{ background: BRAND_GRADIENT_CSS }}
                            >
                              +
                            </button>
                            <button
                              onClick={() =>
                                removeFromCart(it.id, it.variations)
                              }
                              aria-label="Remove"
                              className="ml-auto text-sm text-rose-600 hover:text-rose-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Subtotal</div>
                  <div className="text-sm font-semibold">
                    Rs. {totalAmount.toFixed(2)}
                  </div>
                </div>
                <div className="mt-3">
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(116,16,82,0.06), rgba(208,38,155,0.02))",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500">Total</div>
                        <div
                          className="text-2xl font-bold"
                          style={{
                            background: BRAND_GRADIENT_CSS,
                            WebkitBackgroundClip: "text",
                            color: "transparent",
                          }}
                        >
                          Rs. {totalAmount.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={handleCheckout}
                          className="px-4 py-2 rounded-full text-white font-semibold shadow"
                          style={{ background: BRAND_GRADIENT_CSS }}
                        >
                          Checkout
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Taxes included where applicable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              ref={modalRef}
              className="relative w-full max-w-3xl rounded-2xl overflow-hidden"
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 12, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 lg:p-8">
                {/* HEADER */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className="text-2xl font-semibold"
                      style={{
                        background: BRAND_GRADIENT_CSS,
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      Confirm Order
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Review your details and place the order.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-full border border-neutral-200 hover:shadow transition bg-white/60"
                    aria-label="Close confirm dialog"
                  >
                    <FiX />
                  </button>
                </div>

                {/* CONTENT GRID */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT PANEL — DETAILS */}
                  <div>
                    <div className="text-sm text-gray-700 space-y-1.5">
                      <div>
                        <strong>Name:</strong> {formData.name}
                      </div>
                      <div>
                        <strong>Email:</strong> {formData.email || "N/A"}
                      </div>

                      {/* Conditional fields */}
                      {formData.ordertype === "dinein" && (
                        <div>
                          <strong>Table:</strong> {formData.tableNumber || "—"}
                        </div>
                      )}

                      {formData.ordertype === "pickup" && (
                        <div>
                          <strong>Pickup Type:</strong> Self Pickup
                        </div>
                      )}

                      {formData.ordertype === "delivery" && (
                        <div className="">
                          <strong>Delivery Area:</strong> {formData.area || "—"}
                        </div>
                      )}
                      {formData.ordertype === "delivery" && (
                        <div className="">
                          <strong>Phone Number:</strong> {formData.phone || "—"}
                        </div>
                      )}

                      <div>
                        <strong>Payment:</strong> {formData.paymentMethod}
                      </div>
                    </div>

                    {/* ITEMS */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700">
                        Items
                      </h4>
                      <ul className="mt-2 space-y-2 max-h-44 overflow-auto pr-2">
                        {formattedItems.map((it, idx) => (
                          <li
                            key={`${it.id}-${idx}`}
                            className="text-sm text-gray-700"
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="font-medium truncate">
                                  {it.title}
                                </div>
                                {it.variations && (
                                  <div className="text-xs text-gray-500">
                                    {Array.isArray(it.variations)
                                      ? it.variations.join(", ")
                                      : String(it.variations)}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-semibold">
                                Rs. {(it.price * it.quantity).toFixed(2)}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* RIGHT PANEL — TOTAL + CONFIRM */}
                  <div>
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(116,16,82,0.06), rgba(208,38,155,0.02))",
                      }}
                    >
                      {/* Total Summary Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">Subtotal</div>
                          <div className="text-base font-semibold">
                            Rs. {totalAmount.toFixed(2)}
                          </div>
                        </div>

                        {formData.ordertype === "delivery" && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              Delivery Charges
                            </div>
                            <div className="text-base font-semibold">
                              Rs. {deliveryCharge}
                            </div>
                          </div>
                        )}

                        <hr className="my-2 border-neutral-300" />

                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-700">
                            Total Payable
                          </div>
                          <div
                            className="text-2xl font-bold"
                            style={{
                              background: BRAND_GRADIENT_CSS,
                              WebkitBackgroundClip: "text",
                              color: "transparent",
                            }}
                          >
                            Rs. {finalAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Confirmation */}
                      <div className="mt-4 flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="confirmOrder"
                          checked={confirmChecked}
                          onChange={(e) => setConfirmChecked(e.target.checked)}
                          className="h-5 w-5 accent-[#741052]"
                        />
                        <label
                          htmlFor="confirmOrder"
                          className="text-sm text-gray-700"
                        >
                          I confirm the details above are correct
                        </label>
                      </div>

                      {/* Buttons */}
                      <div className="mt-4 grid grid-cols-1 gap-3">
                        <button
                          onClick={handlePlaceOrder}
                          disabled={!confirmChecked || isProcessing}
                          className={`w-full px-4 py-3 rounded-full font-semibold text-white inline-flex items-center justify-center gap-2 ${
                            !confirmChecked || isProcessing
                              ? "opacity-70 cursor-not-allowed"
                              : ""
                          }`}
                          style={{
                            background: BRAND_GRADIENT_CSS,
                            boxShadow: "0 14px 40px rgba(116,16,82,0.12)",
                          }}
                        >
                          {isProcessing ? <ButtonSpinner /> : <FiCheck />}
                          <span>
                            {isProcessing ? "Placing order..." : "Place Order"}
                          </span>
                        </button>
                        <button
                          onClick={() => setIsModalOpen(false)}
                          className="w-full px-4 py-3 rounded-full border border-neutral-200 text-gray-700 bg-white/60"
                        >
                          Back
                        </button>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="mt-4 text-sm text-gray-600">
                      <h5 className="font-medium mb-2">Order Timeline</h5>
                      <ol className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#741052] text-white flex items-center justify-center text-xs">
                            1
                          </div>
                          <div>
                            <strong className="block">Customer</strong>
                            <span className="text-xs text-gray-500">
                              {" "}
                              {formData.name || "—"}
                            </span>
                          </div>
                        </li>

                        {formData.ordertype === "dinein" && (
                          <li className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#741052] text-white flex items-center justify-center text-xs">
                              2
                            </div>
                            <div>
                              <strong className="block">Table</strong>
                              <span className="text-xs text-gray-500">
                                {" "}
                                {formData.tableNumber || "—"}
                              </span>
                            </div>
                          </li>
                        )}

                        {formData.ordertype === "pickup" && (
                          <li className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#741052] text-white flex items-center justify-center text-xs">
                              2
                            </div>
                            <div>
                              <strong className="block">Pickup</strong>
                              <span className="text-xs text-gray-500">
                                {" "}
                                Ready at counter
                              </span>
                            </div>
                          </li>
                        )}

                        {formData.ordertype === "delivery" && (
                          <li className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#741052] text-white flex items-center justify-center text-xs">
                              2
                            </div>
                            <div>
                              <strong className="block">Delivery</strong>
                              <span className="text-xs text-gray-500">
                                {" "}
                                {formData.area || "—"}
                              </span>
                            </div>
                          </li>
                        )}

                        <li className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#741052] text-white flex items-center justify-center text-xs">
                            3
                          </div>
                          <div>
                            <strong className="block">Payment</strong>
                            <span className="text-xs text-gray-500">
                              {" "}
                              {formData.paymentMethod}
                            </span>
                          </div>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CheckoutPage: FC = () => (
  <Suspense fallback={<div className="p-8">Loading checkout…</div>}>
    <CheckoutPageContent />
  </Suspense>
);

export default CheckoutPage;
