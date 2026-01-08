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
import Preloader from "../components/Preloader";
import { toast } from "sonner";
import { useOrder } from "../context/OrderContext";
import {
  Banknote,
  CreditCard,
  User,
  Phone,
  MapPin,
  Truck,
  Utensils,
  ShoppingCart,
  CheckCircle,
  X,
  Plus,
  Minus,
  Trash2,
  Copy,
  ArrowRight,
  DollarSign,
  Calculator,
  Mail,
  ShoppingBag,
  ShieldCheck,
  Shield,
  Zap,
  Heart,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BRAND_FROM = "#C46A47"; // Chai Clay
const BRAND_TO = "#A65638"; // Cream Milk
const BRAND_TO1 = "#6B3F2A"; // Masala Brown
const BRAND_GRADIENT_CSS = `linear-gradient(105deg, ${BRAND_FROM}, ${BRAND_TO}, ${BRAND_TO1}, ${BRAND_TO}, ${BRAND_FROM})`;

// Centralized delivery charge calculation
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
  "Shahrah-e-Faisal (On Demand)": 0,
};

// Helper function to calculate delivery charge
const calculateDeliveryCharge = (area: string, orderType: string): number => {
  if (orderType !== "delivery") return 0;
  return DELIVERY_CHARGES[area] || 0;
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 25): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

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
  const [tipAmount, setTipAmount] = useState<string>("");
  const [cashPreference, setCashPreference] = useState<
    "none" | "exact" | "need-change"
  >("none");

  // refs for GSAP timeline (optional)
  const formRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const areaInputRef = useRef<HTMLInputElement | null>(null);
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

  const focusAreaInput = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      areaInputRef.current?.focus();
      areaInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`, { description: text });
    } catch (e) {
      toast.error("Copy failed", { description: "Please copy manually." });
    }
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
  // Calculate delivery charge using centralized function
  const deliveryCharge = useMemo(() =>
    calculateDeliveryCharge(detectedArea, formData.ordertype),
    [detectedArea, formData.ordertype]
  );

  const finalAmount = useMemo(() =>
    totalAmount + deliveryCharge,
    [totalAmount, deliveryCharge]
  );

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
    <div className="min-h-screen bg-[#FAF3E6] relative overflow-hidden font-['Poppins'] selection:bg-[#C46A47]/20">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#C46A47]/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E3D6C6]/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header - Architectural */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 md:mb-20 text-center relative"
          >
            <div className="inline-block relative">
              <span className="inline-block text-[#C46A47] text-xs md:text-sm font-black uppercase tracking-[0.4em] mb-4">
                Fill in your details
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-[#2E1C14] tracking-tighter leading-none mb-6">
                Checkout<span className="text-[#C46A47]">.</span>
              </h1>
              <div className="h-1.5 w-24 bg-[#C46A47] mx-auto rounded-full" />
            </div>
            <p className="mt-8 text-[#6F5A4A] text-lg md:text-xl font-light opacity-80 max-w-2xl mx-auto leading-relaxed">
              Curating your perfect tea experience. Review your order details below.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-10 items-start">
            {/* Main Form Section - Glassmorphic */}
            <div className="lg:col-span-7 space-y-10">
              {/* Customer Information */}
              <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-8 md:p-12 border border-white/20 shadow-[0_32px_64px_-16px_rgba(107,63,42,0.08)]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-[#6B3F2A] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#6B3F2A]/20">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#2E1C14] tracking-tight">Personal Details</h2>
                    <p className="text-[#6F5A4A] text-sm font-medium">How shall we address you?</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C46A47] ml-1">Full Name</label>
                    <div className="relative group">
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Amaan Ahmed"
                        className="h-16 bg-white/60 border-[#E3D6C6] focus:border-[#C46A47] focus:ring-0 rounded-2xl px-6 placeholder:text-[#6F5A4A]/30 text-[#6B3F2A] font-medium transition-all group-hover:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C46A47] ml-1">Email (Optional)</label>
                    <div className="relative group">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="hello@choice.com"
                        className="h-16 bg-white/60 border-[#E3D6C6] focus:border-[#C46A47] focus:ring-0 rounded-2xl px-6 placeholder:text-[#6F5A4A]/30 text-[#6B3F2A] font-medium transition-all group-hover:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Order Type Specific Fields */}
                <AnimatePresence mode="wait">
                  {formData.ordertype === "dinein" && (
                    <motion.div
                      key="dinein"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-8 space-y-3 pt-8 border-t border-[#E3D6C6]/30"
                    >
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C46A47] ml-1 flex items-center gap-2">
                        <Utensils size={14} /> Table Number
                      </label>
                      <Input
                        name="tableNumber"
                        value={formData.tableNumber}
                        onChange={handleInputChange}
                        className="h-16 bg-[#E3D6C6]/20 border-transparent rounded-2xl px-6 text-[#6B3F2A] font-black text-xl cursor-not-allowed"
                        disabled
                      />
                      <p className="text-[10px] text-[#6F5A4A] opacity-50 ml-1 italic font-medium">Table detected automatically.</p>
                    </motion.div>
                  )}

                  {formData.ordertype === "delivery" && (
                    <motion.div
                      key="delivery"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-8 grid md:grid-cols-2 gap-8 pt-8 border-t border-[#E3D6C6]/30"
                    >
                      <div className="space-y-3">
                        <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C46A47] ml-1 flex items-center gap-2">
                          <Phone size={14} /> Phone Number
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          placeholder="03XXXXXXXXX"
                          className="h-16 bg-white/60 border-[#E3D6C6] focus:border-[#C46A47] focus:ring-0 rounded-2xl px-6 text-[#6B3F2A] font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <label htmlFor="area" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C46A47] ml-1 flex items-center gap-2">
                          <MapPin size={14} /> Delivery Address
                        </label>
                        <Input
                          ref={areaInputRef}
                          id="area"
                          name="area"
                          type="text"
                          value={formData.area}
                          onChange={handleInputChange}
                          placeholder="Complete address here"
                          className="h-16 bg-white/60 border-[#E3D6C6] focus:border-[#C46A47] focus:ring-0 rounded-2xl px-6 text-[#6B3F2A] font-medium"
                          required
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Payment Method - Modern Selector */}
              <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-8 md:p-12 border border-white/20 shadow-[0_32px_64px_-16px_rgba(107,63,42,0.08)]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-[#C46A47] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#C46A47]/20">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#2E1C14] tracking-tight">Payment Method</h2>
                    <p className="text-[#6F5A4A] text-sm font-medium">Secure transactions, always.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <button
                    type="button"
                    onClick={() => handlePaymentChange("cash")}
                    className={`group relative h-24 flex flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-300 ${
                      formData.paymentMethod === "cash"
                        ? "bg-[#6B3F2A] text-white shadow-2xl shadow-[#6B3F2A]/20 -translate-y-1"
                        : "bg-white/40 text-[#6B3F2A] border border-[#E3D6C6] hover:border-[#6B3F2A]/30"
                    }`}
                  >
                    <Banknote size={24} className={formData.paymentMethod === "cash" ? "text-[#C46A47]" : "opacity-40"} />
                    <span className="text-xs font-black uppercase tracking-widest">Cash on Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                        handlePaymentChange("online");
                        toast.error("Online payment is coming soon!", {
                            style: { background: '#6B3F2A', color: '#FAF3E6', borderRadius: '16px' }
                        });
                    }}
                    className="group relative h-24 flex flex-col items-center justify-center gap-2 rounded-2xl opacity-50 bg-white/20 border border-dashed border-[#E3D6C6] cursor-not-allowed transition-all"
                    disabled
                  >
                    <div className="flex items-center gap-2">
                         <CreditCard size={24} className="opacity-40" />
                         <span className="text-[10px] bg-[#C46A47] text-white px-2 py-0.5 rounded-full font-bold">SOON</span>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Online Payment</span>
                  </button>
                </div>

                {/* Cash Preference */}
                <AnimatePresence>
                    {formData.paymentMethod === "cash" && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-10 overflow-hidden"
                        >
                            <div className="p-8 rounded-3xl bg-[#6B3F2A]/5 border border-[#6B3F2A]/10">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C46A47] mb-6 flex items-center gap-2">
                                    <Calculator size={14} /> Change Required?
                                </h4>
                                
                                <div className="flex flex-wrap gap-4 mb-8">
                                    {[
                                        { id: "none", label: "Standard" },
                                        { id: "exact", label: "Exact Cash" },
                                        { id: "need-change", label: "Need Change" }
                                    ].map((pref) => (
                                        <button
                                            key={pref.id}
                                            type="button"
                                            onClick={() => setCashPreference(pref.id as any)}
                                            className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${
                                                cashPreference === pref.id
                                                    ? "bg-[#6B3F2A] text-white shadow-lg"
                                                    : "bg-white text-[#6B3F2A] hover:bg-[#E3D6C6]/50"
                                            }`}
                                        >
                                            {pref.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="tip" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B3F2A] ml-1">Add a Tip</label>
                                    <Input
                                        id="tip"
                                        type="number"
                                        value={tipAmount}
                                        onChange={(e) => setTipAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="h-14 bg-white border-transparent focus:border-[#C46A47] rounded-xl px-6 text-[#6B3F2A] font-bold"
                                    />
                                    <p className="text-[10px] text-[#2E1C14] font-medium ml-1 italic">Tipping is optional but appreciated.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
              </div>
            </div>

            {/* Order Summary Sidebar - Deep Craft Summary */}
            <div className="lg:col-span-5 sticky top-8">
              <div className="bg-[#6B3F2A] rounded-[40px] p-8 md:p-10 text-[#FAF3E6] shadow-2xl relative overflow-hidden">
                {/* Texture Overlay */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-10 pb-6 border-b border-[#FAF3E6]/10">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white">Order Summary.</h2>
                      <p className="text-[#FAF3E6] text-[10px] uppercase font-black tracking-[0.2em] mt-1">Your Items</p>
                    </div>
                    <div className="w-12 h-12 bg-[#FAF3E6]/10 rounded-2xl flex items-center justify-center">
                      <ShoppingBag size={20} className="text-[#C46A47]" />
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 -mr-2">
                    <AnimatePresence mode="popLayout">
                      {formattedItems.map((item, index) => (
                        <motion.div
                          key={`${item.id}-${index}`}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex gap-4 group"
                        >
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#FAF3E6]/5 flex-shrink-0 border border-[#FAF3E6]/10 group-hover:border-[#C46A47]/30 transition-colors">
                            <Image
                              src={item.image || "/placeholder.png"}
                              alt={item.title}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-bold text-sm truncate pr-4 text-white">{item.title}</h3>
                              <span className="font-black text-[#C46A47] text-sm whitespace-nowrap">Rs. {item.price}</span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3 bg-[#FAF3E6]/5 px-3 py-1.5 rounded-xl border border-[#FAF3E6]/5">
                                    <button 
                                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.variations)}
                                        className="hover:text-[#C46A47] transition-colors"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="text-xs font-black min-w-[12px] text-center">{item.quantity}</span>
                                    <button 
                                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.variations)}
                                        className="hover:text-[#C46A47] transition-colors"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => removeFromCart(item.id, item.variations)}
                                    className="p-2 hover:bg-[#C46A47]/10 rounded-lg text-[#C46A47] transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {item.variations && (
                              <p className="text-[9px] text-[#C46A47] font-black uppercase tracking-wider mt-2 opacity-80">
                                {Array.isArray(item.variations) ? item.variations.join(" • ") : String(item.variations)}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="mt-10 pt-8 border-t border-[#fff]/10 space-y-4">
                    <div className="flex justify-between items-center group">
                      <span className="text-[#fff] text-[11px] font-black uppercase tracking-widest">Subtotal</span>
                      <span className="font-bold">Rs. {totalAmount.toFixed(2)}</span>
                    </div>
                    
                    {formData.ordertype === "delivery" && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-[#fff] uppercase tracking-widest">Delivery Charge</span>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                             <span className="font-bold">Rs. {deliveryCharge.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {Number(tipAmount) > 0 && (
                      <div className="flex justify-between items-center text-[#C46A47]">
                        <span className="text-[11px] font-black uppercase tracking-widest">Tip</span>
                        <span className="font-bold">+ Rs. {Number(tipAmount).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-6 mt-2 border-t border-dashed border-[#fff]/20">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                             <p className="text-[#fff] text-[10px] font-black uppercase tracking-widest">Total</p>
                             <p className="text-3xl font-black text-white tracking-tight">Total.<span className="text-[#C46A47]">_</span></p>
                        </div>
                        <div className="text-right">
                             <p className="text-4xl font-black text-[#C46A47]">Rs. {(finalAmount + Number(tipAmount || 0)).toFixed(0)}</p>
                             <p className="text-[10px] text-[#fff] font-medium">Incl. all taxes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Action */}
                  <motion.div
                    className="mt-10"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={handleCheckout}
                      className="w-full h-20 bg-[#C46A47] text-white rounded-[24px] font-black text-lg tracking-wider uppercase transition-all shadow-[0_20px_40px_-10px_rgba(196,106,71,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(196,106,71,0.5)] flex items-center justify-center gap-3 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                      Place Order
                    </button>
                    <p className="text-center text-[10px] text-[#FAF3E6]/30 font-black uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
                        <ShieldCheck size={12} className="text-[#C46A47]" /> Secure Checkout
                    </p>
                  </motion.div>
                </div>

                {/* Trust Badges */}
                <div className="mt-10 grid grid-cols-3 gap-4 pt-10 border-t border-[#FAF3E6]/5">
                    {[
                        { icon: Shield, label: "Secure" },
                        { icon: Zap, label: "Fast" },
                        { icon: Heart, label: "Fresh" }
                    ].map((badge, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                            <badge.icon size={16} />
                            <span className="text-[8px] font-black uppercase tracking-widest">{badge.label}</span>
                        </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Signature Order Confirmation Modal */}
          <AnimatePresence>
            {isModalOpen && (
              <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-[#6B3F2A]/80 backdrop-blur-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setIsModalOpen(false)}
                />

                <motion.div
                  className="relative w-full max-w-5xl bg-[#FAF3E6] rounded-[48px] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col md:flex-row h-full max-h-[80vh] border border-white/20"
                  initial={{ scale: 0.9, opacity: 0, y: 40 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 40 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                >
                  {/* Left Side: Receipt Aesthetic */}
                  <div className="w-full md:w-[40%] bg-[#2E1C14] p-8 md:p-12 text-[#FAF3E6] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#C46A47] blur-[120px] opacity-10 -mr-32 -mt-32"></div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-12">
                        <div className="w-16 h-16 bg-[#FAF3E6]/10 rounded-3xl flex items-center justify-center mb-6 border border-[#FAF3E6]/10">
                            <ShoppingBag className="text-[#C46A47]" size={32} />
                        </div>
                        <h2 className="text-4xl font-black tracking-tight leading-none text-white">Order<br/>Summary.</h2>
                        <div className="w-12 h-1.5 bg-[#C46A47] mt-6 rounded-full"></div>
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar-light pr-4">
                        <div className="space-y-8">
                          {formattedItems.map((item, index) => (
                            <div key={index} className="space-y-2 group cursor-default">
                                <div className="flex justify-between items-start gap-4">
                                    <span className="text-[#FAF3E6]/40 text-[10px] font-black uppercase tracking-widest leading-none mt-1">0{index + 1}</span>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg leading-tight group-hover:text-[#C46A47] transition-colors">{item.title}</h3>
                                        <p className="text-[10px] text-[#FAF3E6] font-black uppercase tracking-widest mt-1">
                                            Qty: {item.quantity} • Rs. {item.price}
                                        </p>
                                    </div>
                                    <span className="font-black text-sm">Rs. {item.price * item.quantity}</span>
                                </div>
                                {item.variations && (
                                    <p className="text-[9px] text-[#C46A47] font-black uppercase tracking-[0.15em] ml-6">
                                        {Array.isArray(item.variations) ? item.variations.join(" / ") : String(item.variations)}
                                    </p>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-12 pt-8 border-t border-[#FAF3E6]/10 space-y-4">
                        <div className="flex justify-between text-xs font-black text-[#fff]">
                            <span>Subtotal</span>
                            <span>Rs. {totalAmount.toFixed(0)}</span>
                        </div>
                        {formData.ordertype === "delivery" && (
                             <div className="flex justify-between text-xs font-black text-[#fff]">
                                <span>Logistics</span>
                                <span>Rs. {deliveryCharge}</span>
                             </div>
                        )}
                         {Number(tipAmount) > 0 && (
                             <div className="flex justify-between text-xs font-black text-[#fff]">
                                <span>Tip</span>
                                <span>Rs. {tipAmount}</span>
                             </div>
                        )}
                        <div className="flex justify-between items-end pt-4 border-t border-[#fff]/20">
                            <span className="text-2xl font-black text-white">Total</span>
                            <span className="text-3xl font-black text-[#C46A47]">Rs. {(finalAmount + Number(tipAmount || 0)).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Form & Confirmation */}
                  <div className="flex-1 p-8 md:p-12 bg-white overflow-y-auto custom-scrollbar flex flex-col">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="self-end p-4 rounded-full hover:bg-[#6B3F2A]/5 text-[#2E1C14] transition-all mb-4"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex-1 max-w-xl mx-auto w-full flex flex-col justify-center">
                        <div className="mb-12">
                             <span className="text-[#C46A47] text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">Confirmation</span>
                             <h3 className="text-4xl font-black text-[#2E1C14] tracking-tighter leading-none">Confirm<br/>Order<span className="text-[#C46A47]">.</span></h3>
                        </div>

                        <div className="space-y-10">
                            {/* Validation Grid */}
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-1">
                                     <p className="text-[#C46A47] text-[10px] font-black uppercase tracking-widest">Name</p>
                                    <p className="text-[#2E1C14] font-black text-xl tracking-tight">{formData.name}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                     <p className="text-[#C46A47] text-[10px] font-black uppercase tracking-widest">Order Type</p>
                                    <p className="text-[#2E1C14] font-black text-xl tracking-tight capitalize">{formData.ordertype}</p>
                                </div>
                                <div className="space-y-1">
                                     <p className="text-[#C46A47] text-[10px] font-black uppercase tracking-widest">Payment Method</p>
                                    <p className="text-[#2E1C14] font-black text-xl tracking-tight capitalize">{formData.paymentMethod}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                     <p className="text-[#C46A47] text-[10px] font-black uppercase tracking-widest">Phone Number</p>
                                    <p className="text-[#2E1C14] font-black text-xl tracking-tight">{formData.phone || "---"}</p>
                                </div>
                            </div>

                            <div className="space-y-1 pt-8 border-t border-[#6B3F2A]/10">
                                 <p className="text-[#C46A47] text-[10px] font-black uppercase tracking-widest mb-2">Delivery Details</p>
                                <p className="text-[#2E1C14] font-bold text-lg leading-relaxed">
                                    {formData.ordertype === 'dinein' ? `Table ${formData.tableNumber}` : formData.area}
                                </p>
                            </div>

                            {/* Verification Toggle */}
                            <div 
                                className={`p-8 rounded-[32px] border-2 transition-all cursor-pointer group ${
                                    confirmChecked 
                                    ? "bg-[#6B3F2A] border-[#6B3F2A] shadow-2xl shadow-[#6B3F2A]/20" 
                                    : "bg-white border-[#E3D6C6] hover:border-[#6B3F2A]/30"
                                }`}
                                onClick={() => setConfirmChecked(!confirmChecked)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h4 className={`font-black text-sm uppercase tracking-widest ${confirmChecked ? 'text-white' : 'text-[#6B3F2A]'}`}>
                                            Verification
                                        </h4>
                                        <p className={`text-[10px] font-medium leading-relaxed ${confirmChecked ? 'text-[#FAF3E6]/60' : 'text-[#6F5A4A]/60'}`}>
                                             I confirm that my order and<br/>delivery details are correct.
                                        </p>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                        confirmChecked 
                                        ? 'bg-[#C46A47] border-[#C46A47] text-white rotate-0' 
                                        : 'bg-white border-[#2E1C14] -rotate-90'
                                    }`}>
                                        <Check size={18} />
                                    </div>
                                </div>
                            </div>

                            {/* Final Call to Action */}
                            <div className="pt-6">
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={!confirmChecked || isProcessing}
                                    className={`w-full h-20 rounded-[28px] font-black text-xl tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${
                                        confirmChecked && !isProcessing
                                        ? "bg-[#C46A47] text-white shadow-[0_24px_48px_-12px_rgba(196,106,71,0.5)] active:scale-95"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-ping"></div>
                                             Place Order
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-ping delay-300"></div>
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[9px] text-[#6F5A4A]/30 font-black uppercase tracking-[0.4em] mt-8">
                                     Thank you for ordering with us!
                                </p>
                            </div>
                        </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
};

const CheckoutPage: FC = () => {
    return (
        <Suspense fallback={<div className="p-8 text-[#6B3F2A] font-black uppercase tracking-widest text-center py-40">Architectural Loading...</div>}>
            <CheckoutPageContent />
        </Suspense>
    );
};

export default CheckoutPage;
