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
} from "lucide-react";
import posthog from 'posthog-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BRAND_FROM = "#741052";
const BRAND_TO = "#d0269b";
const BRAND_TO1 = "#ff03afff";
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
  const { orderType, area, tableId, setCheckoutModalOpen } = useOrder();
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

  // Sync global modal state
  useEffect(() => {
    setCheckoutModalOpen(isModalOpen);
    return () => setCheckoutModalOpen(false); // cleanup on unmount or when modal closes
  }, [isModalOpen, setCheckoutModalOpen]);

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

  const discountAmount = useMemo(() => {
    return totalAmount * 0.10;
  }, [totalAmount]);

  const finalAmount = useMemo(() =>
    (totalAmount - discountAmount) + deliveryCharge,
    [totalAmount, discountAmount, deliveryCharge]
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

    // Identify the user to link this session to their email/phone
    const userId = formData.email || formData.phone || `user_${Date.now()}`;
    posthog.identify(userId, {
      email: formData.email,
      name: formData.name,
      phone: formData.phone
    });

    // Track Order Submission Journey Event
    posthog.capture('journey_submit_order', {
      order_type: formData.ordertype,
      payment_method: formData.paymentMethod,
      item_count: cartItems.length,
      total_amount: finalAmount,
      delivery_charge: deliveryCharge
    });

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
- Subtotal: Rs. ${totalAmount.toFixed(2)}
- Discount: Rs. ${(totalAmount * 0.10).toFixed(2)}
- Total Amount: Rs. ${order.totalAmount.toFixed(2)}
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
    <div className="min-h-screen bg-gradient-to-br from-[#f9f4fb] via-[#fdf6fb] to-[#f7f1ff] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-200/10 to-orange-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[#741052] to-[#d0269b] rounded-full blur-lg opacity-20 scale-110"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-r from-[#741052] to-[#d0269b] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#741052] to-[#d0269b] bg-clip-text text-transparent mb-2">
                  Secure Checkout
                </h1>
                <p className="text-gray-600 text-lg">Complete your order with confidence</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-[#741052]">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                  <CardDescription>
                    Please provide your details for order processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. John Doe"
                        className="h-12 border-2 focus:border-[#741052] transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@domain.com"
                        className="h-12 border-2 focus:border-[#741052] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Order Type Specific Fields */}
                  <AnimatePresence>
                    {formData.ordertype === "dinein" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Utensils className="h-4 w-4" />
                          Table Number
                        </Label>
                        <Input
                          name="tableNumber"
                          value={formData.tableNumber}
                          onChange={handleInputChange}
                          placeholder="Your table number"
                          className="h-12 border-2 focus:border-[#741052] transition-colors bg-gray-50"
                          disabled
                        />
                        <p className="text-xs text-gray-500">Table number is automatically detected</p>
                      </motion.div>
                    )}

                    {formData.ordertype === "delivery" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid md:grid-cols-2 gap-6"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="area" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Delivery Address
                          </Label>
                          <Input
                            ref={areaInputRef}
                            id="area"
                            name="area"
                            type="text"
                            value={formData.area}
                            onChange={handleInputChange}
                            placeholder={`Enter delivery address`}
                            className="h-12 border-2 focus:border-[#741052] transition-colors"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            placeholder="03XXXXXXXXX"
                            className="h-12 border-2 focus:border-[#741052] transition-colors"
                            required
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-[#741052]">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    Choose how you'd like to pay for your order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button
                      type="button"
                      onClick={() => handlePaymentChange("cash")}
                      variant={formData.paymentMethod === "cash" ? "default" : "outline"}
                      className={`h-16 flex items-center gap-3 text-lg font-semibold ${
                        formData.paymentMethod === "cash"
                          ? "bg-gradient-to-r from-[#741052] to-[#d0269b] text-white border-0 shadow-lg"
                          : "border-2 border-gray-200 hover:border-[#741052] transition-colors"
                      }`}
                    >
                      <Banknote className="h-6 w-6" />
                      Cash Payment
                    </Button>

                    <Button
                      type="button"
                      onClick={() => {
                        handlePaymentChange("online");
                        toast.error("Online payment is coming soon!");
                      }}
                      variant={formData.paymentMethod === "online" ? "default" : "outline"}
                      className={`h-16 flex items-center gap-3 text-lg font-semibold ${
                        formData.paymentMethod === "online"
                          ? "bg-gradient-to-r from-[#741052] to-[#d0269b] text-white border-0 shadow-lg"
                          : "border-2 border-gray-200 hover:border-[#741052] transition-colors"
                      }`}
                      disabled={true}
                    >
                      <CreditCard className="h-6 w-6" />
                      Online Payment
                      <span className="text-xs opacity-75">(Coming Soon)</span>
                    </Button>
                  </div>

                  {/* Cash Payment Options */}
                  <AnimatePresence>
                    {formData.paymentMethod === "cash" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200"
                      >
                        <h4 className="font-semibold text-gray-900">Cash Payment Options</h4>

                        <div className="space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="cash-preference"
                              checked={cashPreference === "none"}
                              onChange={() => setCashPreference("none")}
                              className="w-4 h-4 text-[#741052] focus:ring-[#741052] rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">No preference</span>
                          </label>

                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="cash-preference"
                              checked={cashPreference === "exact"}
                              onChange={() => setCashPreference("exact")}
                              className="w-4 h-4 text-[#741052] focus:ring-[#741052] rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">I have exact cash</span>
                          </label>

                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="cash-preference"
                              checked={cashPreference === "need-change"}
                              onChange={() => setCashPreference("need-change")}
                              className="w-4 h-4 text-[#741052] focus:ring-[#741052] rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">I might need change</span>
                          </label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tip" className="text-sm font-semibold text-gray-700">
                            Tip Amount (Optional)
                          </Label>
                          <Input
                            id="tip"
                            type="number"
                            value={tipAmount}
                            onChange={(e) => setTipAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                            placeholder="Enter tip amount"
                            className="h-12 border-2 focus:border-[#741052] transition-colors"
                            min="0"
                            step="0.01"
                          />
                          <p className="text-xs text-gray-600">Tip is optional and paid in cash to delivery staff</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Online Payment Notice */}
                  <AnimatePresence>
                    {formData.paymentMethod === "online" && showOnlineInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-amber-50 border border-amber-200 rounded-xl"
                      >
                        <h4 className="font-semibold text-amber-900 mb-3">Online Payment Instructions</h4>
                        <p className="text-sm text-amber-800 mb-4">
                          Online payment is coming soon. For now, you can pay via bank transfer or mobile wallet and share the proof upon delivery.
                        </p>

                        <div className="space-y-3">
                          {/* Bank Transfer */}
                          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Banknote className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">Bank Transfer</p>
                              <p className="text-xs text-gray-600">Meezan Bank - Account: 0123456789</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy("Meezan Bank - Account No: 0123456789", "Bank details")}
                                className="mt-1 h-6 text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                          </div>

                          {/* Easypaisa */}
                          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Phone className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">Easypaisa</p>
                              <p className="text-xs text-gray-600">Number: 03XX-XXXXXXX</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy("Easypaisa Number: 03XX-XXXXXXX", "Easypaisa number")}
                                className="mt-1 h-6 text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-[#741052]">
                    <Calculator className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                  <CardDescription>
                    Review your order details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <AnimatePresence>
                      {formattedItems.map((item, index) => (
                        <motion.div
                          key={`${item.id}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <Image
                              src={item.image || "/placeholder.png"}
                              alt={item.title}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{item.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.variations)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1, item.variations)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromCart(item.id, item.variations)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            {item.variations && (
                              <p className="text-xs text-rose-600 mt-1">
                                {Array.isArray(item.variations) ? item.variations.join(", ") : String(item.variations)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#741052] text-sm">
                              Rs. {(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Order Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">Rs. {totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount (10%)</span>
                      <span className="font-medium">- Rs. {discountAmount.toFixed(2)}</span>
                    </div>

                    {formData.ordertype === "delivery" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Charges</span>
                        <span className="font-medium">Rs. {deliveryCharge.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t border-gray-300 pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-900">Total Amount</span>
                        <span className="bg-gradient-to-r from-[#741052] to-[#d0269b] bg-clip-text text-transparent">
                          Rs. {finalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Proceed to Payment */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-[#741052] to-[#d0269b] text-white font-semibold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2 text-lg"
                      size="lg"
                    >
                      <ArrowRight className="h-5 w-5" />
                      Proceed to Payment
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      By proceeding, you agree to our terms and conditions
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Order Confirmation Modal */}
          <AnimatePresence>
            {isModalOpen && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                  onClick={() => setIsModalOpen(false)}
                />

                <motion.div
                  ref={modalRef}
                  className="relative w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#741052] to-[#d0269b] p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">Confirm Your Order</h2>
                        <p className="text-white/80 mt-1">Please review all details before placing your order</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsModalOpen(false)}
                        className="text-white hover:bg-white/20"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      {/* Order Details */}
                      <div className="space-y-6">
                        <Card className="border-0 shadow-lg">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <User className="h-5 w-5 text-[#741052]" />
                              Customer Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium">{formData.name}</span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-gray-600">Email:</span>
                              <div className="flex-1 ml-4">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="font-medium cursor-help text-right block">
                                        {formData.email ? truncateText(formData.email, 20) : "Not provided"}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">{formData.email || "Not provided"}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            {formData.ordertype === "dinein" && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Table:</span>
                                <span className="font-medium">{formData.tableNumber}</span>
                              </div>
                            )}
                            {formData.ordertype === "delivery" && (
                              <>
                                <div className="flex justify-between items-start">
                                  <span className="text-gray-600">Address:</span>
                                  <div className="flex-1 ml-4">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="font-medium cursor-help text-right block">
                                            {truncateText(formData.area)}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="max-w-xs">{formData.area}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Phone:</span>
                                  <span className="font-medium">{formData.phone}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Payment:</span>
                              <span className="font-medium capitalize">{formData.paymentMethod}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <ShoppingCart className="h-5 w-5 text-[#741052]" />
                              Order Items
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                              {formattedItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{item.title}</p>
                                    {item.variations && (
                                      <p className="text-sm text-rose-600">
                                        {Array.isArray(item.variations) ? item.variations.join(", ") : String(item.variations)}
                                      </p>
                                    )}
                                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                  </div>
                                  <p className="font-bold text-[#741052]">
                                    Rs. {(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Order Summary & Confirmation */}
                      <div className="space-y-6">
                        <Card className="border-0 shadow-lg">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Calculator className="h-5 w-5 text-[#741052]" />
                              Order Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-medium">Rs. {totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>Discount (10%):</span>
                              <span className="font-medium">- Rs. {discountAmount.toFixed(2)}</span>
                            </div>
                            {formData.ordertype === "delivery" && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Delivery Charges:</span>
                                <span className="font-medium">Rs. {deliveryCharge.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="border-t border-gray-200 pt-4">
                              <div className="flex justify-between text-xl font-bold">
                                <span>Total Amount:</span>
                                <span className="bg-gradient-to-r from-[#741052] to-[#d0269b] bg-clip-text text-transparent">
                                  Rs. {finalAmount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Confirmation Section - Now in scrollable content */}
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Ready to Place Order?</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                  By confirming, you agree to our terms and conditions. Your order will be processed immediately.
                                </p>

                                <label className="flex items-center gap-3 cursor-pointer mb-4">
                                  <input
                                    type="checkbox"
                                    checked={confirmChecked}
                                    onChange={(e) => setConfirmChecked(e.target.checked)}
                                    className="w-5 h-5 text-[#741052] focus:ring-[#741052] rounded"
                                  />
                                  <span className="text-sm font-medium text-gray-700">
                                    I confirm all details are correct
                                  </span>
                                </label>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Fixed Footer */}
                    <div className="flex-shrink-0 border-t border-gray-200 bg-white p-6">
                      <div className="flex gap-3">
                        <Button
                          onClick={handlePlaceOrder}
                          disabled={!confirmChecked || isProcessing}
                          className="flex-1 bg-gradient-to-r from-[#741052] to-[#d0269b] text-white font-semibold py-3 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200"
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Placing Order...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Place Order
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsModalOpen(false)}
                          className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 transition-colors"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage: FC = () => (
  <Suspense fallback={<div className="p-8">Loading checkout…</div>}>
    <CheckoutPageContent />
  </Suspense>
);

export default CheckoutPage;
