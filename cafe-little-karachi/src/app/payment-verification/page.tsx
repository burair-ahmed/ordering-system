"use client";

import React, { FC, Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { io as socketIOClient } from "socket.io-client";
import { toast } from "sonner";
import {
  ShieldCheck,
  Clock,
  MessageCircle,
  Copy,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Receipt,
  HelpCircle,
  Utensils,
  Truck,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_CONFIG, OnlineProviderId } from "@/config/paymentConfig";
import { trackEvent } from "../lib/analytics";

interface OrderData {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentProvider?: string | null;
  paymentStatus?: string;
  ordertype: string;
  totalAmount: number;
  deliveryCharge?: number;
  customerName?: string;
  phone?: string | null;
  area?: string | null;
  tableNumber?: string | null;
  items?: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
    variations?: string[];
  }>;
  createdAt?: string;
}

const PaymentVerificationContent: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query parameters with local storage fallbacks
  const urlOrder = searchParams?.get("order") || (typeof window !== "undefined" ? localStorage.getItem("latest_order_number") : null);
  const urlProvider = ((searchParams?.get("provider") as OnlineProviderId) || "jazzcash");
  const urlType = searchParams?.get("type") || (typeof window !== "undefined" ? localStorage.getItem("latest_order_type") : null) || "delivery";
  const urlPhone = searchParams?.get("phone") || (typeof window !== "undefined" ? localStorage.getItem("latest_order_phone") : null) || "";
  const urlArea = searchParams?.get("area") || "";

  const [orderNumber, setOrderNumber] = useState<string | null>(urlOrder);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string>("Payment Verification");
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [showAccountDetails, setShowAccountDetails] = useState<boolean>(true);
  const [verifiedRedirecting, setVerifiedRedirecting] = useState<boolean>(false);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const socketRef = useRef<any>(null);

  // Identify matching payment config method
  const activeProviderId: OnlineProviderId = (order?.paymentProvider as OnlineProviderId) || urlProvider;
  const activeMethod =
    PAYMENT_CONFIG.methods.find((m) => m.id === activeProviderId) ||
    PAYMENT_CONFIG.methods[0];

  // Helper to copy account info with feedback
  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(label);
      toast.success(`${label} copied!`, { description: text });
      trackEvent("journey_copy_verification_details", { label, text });
      setTimeout(() => setHasCopied(null), 2500);
    } catch {
      toast.error("Copy failed", { description: "Please copy manually." });
    }
  };

  // Pre-filled WhatsApp message for screenshot submission
  const generateWhatsAppUrl = useCallback(() => {
    const formattedAmount = order?.totalAmount
      ? `Rs. ${Number(order.totalAmount).toFixed(2)}`
      : "Full Order Amount";

    const message = `Hi Little Karachi Express! 👋
I have made the online transfer for my order. Here are my details:

• Order Number: #${orderNumber || "CLK-ORD"}
• Payment Method: ${activeMethod.name}
• Payable Amount: ${formattedAmount}
${order?.customerName ? `• Customer Name: ${order.customerName}` : ""}

I am attaching the payment transaction receipt/screenshot below. Please verify and confirm my order! 📸`;

    return `https://wa.me/${PAYMENT_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }, [orderNumber, activeMethod, order]);

  // Navigate to Thank You page
  const navigateToThankYou = useCallback(() => {
    const targetType = order?.ordertype || urlType;
    const targetTable = order?.tableNumber;
    const targetPhone = order?.phone || urlPhone;
    const targetArea = order?.area || urlArea;

    const thankYouUrl =
      targetType === "dinein" && targetTable
        ? `/thank-you?type=dinein&tableId=${encodeURIComponent(targetTable)}&order=${encodeURIComponent(orderNumber || "")}`
        : `/thank-you?type=${encodeURIComponent(targetType)}&order=${encodeURIComponent(orderNumber || "")}${
            targetPhone ? `&phone=${encodeURIComponent(targetPhone)}` : ""
          }${targetArea ? `&area=${encodeURIComponent(targetArea)}` : ""}`;

    router.replace(thankYouUrl);
  }, [order, urlType, urlPhone, urlArea, orderNumber, router]);

  // Trigger celebration and redirect upon verification
  const handlePaymentVerified = useCallback(() => {
    if (verifiedRedirecting) return;
    setVerifiedRedirecting(true);

    try {
      audioRef.current = new Audio("/notification/notification.mp3");
      audioRef.current.volume = 0.7;
      audioRef.current.play().catch(() => null);
    } catch {
      // Audio playback restricted by browser policy
    }

    toast.success("Payment Verified! 🎉", {
      description: "Your order is confirmed and moving to the kitchen. Redirecting...",
      duration: 3500,
    });

    trackEvent("journey_payment_verified_client", {
      order_number: orderNumber,
      provider: activeProviderId,
    });

    setTimeout(() => {
      navigateToThankYou();
    }, 1800);
  }, [verifiedRedirecting, orderNumber, activeProviderId, navigateToThankYou]);

  // Poll order status
  const fetchStatus = useCallback(async () => {
    if (!orderNumber) return;

    try {
      const res = await fetch(`/api/order-status?orderNumber=${encodeURIComponent(orderNumber)}`);
      if (res.ok) {
        const data = await res.json();
        const o: OrderData = data.order;
        if (o) {
          setOrder(o);
          setStatus(o.status);
          if (o.paymentStatus) setPaymentStatus(o.paymentStatus);

          const sLower = (o.status || "").toLowerCase().trim();
          const pLower = (o.paymentStatus || "").toLowerCase().trim();

          // Check if verified or moved out of verification
          if (
            pLower === "verified" ||
            sLower === "received" ||
            sLower === "preparing" ||
            sLower === "ready" ||
            sLower === "out for delivery" ||
            sLower === "delivered" ||
            sLower === "completed"
          ) {
            handlePaymentVerified();
          } else if (sLower === "cancelled" || sLower === "canceled" || sLower === "rejected") {
            setIsCancelled(true);
          }
        }
      }
    } catch (err) {
      console.warn("Status fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [orderNumber, handlePaymentVerified]);

  // Initial fetch and polling loop
  useEffect(() => {
    if (orderNumber) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 3500); // 3.5s polling loop
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [orderNumber, fetchStatus]);

  // Socket.IO real-time connection for instant verification
  useEffect(() => {
    if (!orderNumber) return;

    // Initialize socket connection
    fetch("/api/socket").finally(() => {
      const socket = socketIOClient({
        path: "/api/socket",
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      socket.on("order-status-updated", (data: { orderNumber: string; status: string; paymentStatus?: string }) => {
        if (data.orderNumber === orderNumber) {
          const sLower = (data.status || "").toLowerCase().trim();
          const pLower = (data.paymentStatus || "").toLowerCase().trim();

          if (
            pLower === "verified" ||
            sLower === "received" ||
            sLower === "preparing" ||
            sLower === "ready" ||
            sLower === "out for delivery" ||
            sLower === "delivered" ||
            sLower === "completed"
          ) {
            setStatus(data.status);
            setPaymentStatus("verified");
            handlePaymentVerified();
          } else if (sLower === "cancelled" || sLower === "canceled") {
            setStatus("Cancelled");
            setIsCancelled(true);
          }
        }
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [orderNumber, handlePaymentVerified]);

  const handleShareOnWhatsApp = () => {
    trackEvent("journey_share_screenshot_clicked", {
      order_number: orderNumber,
      provider: activeProviderId,
    });
    window.open(generateWhatsAppUrl(), "_blank", "noopener,noreferrer");
  };

  if (!orderNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border border-rose-200 shadow-xl text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">Order Not Found</CardTitle>
          <CardDescription className="text-gray-600 text-sm">
            We couldn&apos;t detect an active order reference. If you recently placed an order, please check your confirmation on WhatsApp or browse our menu.
          </CardDescription>
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-[#741052] hover:bg-[#5a0c3f] text-white font-semibold py-3 rounded-xl"
          >
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#741052]/5 via-white to-[#741052]/10 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#741052]/10 border border-[#741052]/20 text-[#741052] text-xs sm:text-sm font-bold">
            <ShieldCheck className="h-4 w-4 text-[#d0269b]" />
            Little Karachi Express • Online Payment Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Verify Your Payment
          </h1>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Order <span className="font-mono font-bold text-[#741052]">#{orderNumber}</span> has been created. Follow the instructions below to complete manual verification.
          </p>
        </div>

        {/* State Banner: Verified & Redirecting */}
        <AnimatePresence>
          {verifiedRedirecting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-xl flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Payment Verified Successfully! 🎉</h3>
                <p className="text-xs sm:text-sm text-emerald-100">
                  Your order has been confirmed by our staff and dispatched to preparation. Moving to confirmation...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State Banner: Cancelled / Declined */}
        <AnimatePresence>
          {isCancelled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 bg-rose-50 border-2 border-rose-200 text-rose-900 rounded-2xl shadow-sm flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-base">Payment Not Verified</h3>
                <p className="text-xs sm:text-sm text-rose-700">
                  This order was cancelled by the store administrator. If you believe this is an error, please reach out to our team directly on WhatsApp or try placing an order using Cash.
                </p>
                <div className="pt-2 flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/checkout")}
                    className="text-xs"
                  >
                    Return to Checkout
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleShareOnWhatsApp}
                    className="bg-[#25D366] hover:bg-[#1ebd5b] text-white text-xs font-semibold"
                  >
                    Contact on WhatsApp
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PRIMARY ACTION CARD: Share Screenshot on WhatsApp */}
        {!verifiedRedirecting && !isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-2 border-[#25D366]/40 shadow-xl overflow-hidden bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30">
              <div className="bg-[#25D366] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="h-6 w-6" />
                  <span className="font-bold text-base sm:text-lg">Step 2: Share Proof via WhatsApp</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/25">
                  Fast Verification
                </span>
              </div>

              <CardContent className="p-6 space-y-5">
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">
                    To release your order to the kitchen, please send your transaction screenshot:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600">
                    <li>Take a screenshot of the completed transfer in your banking/wallet app.</li>
                    <li>Click the green button below to open WhatsApp with your pre-filled order number.</li>
                    <li>Attach and send your screenshot. Our staff verifies it in real-time!</li>
                  </ol>
                </div>

                {/* Animated Pulsing WhatsApp Button */}
                <Button
                  onClick={handleShareOnWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white font-bold py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-base sm:text-lg group"
                >
                  <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <span>Share Screenshot on WhatsApp</span>
                  <ExternalLink className="h-4 w-4 opacity-75" />
                </Button>

                <p className="text-center text-xs text-gray-500">
                  WhatsApp Support: <span className="font-mono font-semibold text-gray-800">+{PAYMENT_CONFIG.whatsappNumber}</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* REAL-TIME HOLDING COCKPIT */}
        {!verifiedRedirecting && !isCancelled && (
          <Card className="border border-[#741052]/20 shadow-lg bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                {/* Radar Sonar Pulsing Ring */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 animate-ping" />
                  <div className="relative w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">Awaiting Payment Verification</h3>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-semibold">
                      Live Queue
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    This screen automatically updates once our staff verifies your payment. Please keep this tab open.
                  </p>
                </div>
              </div>

              {/* Status Stepper Progress */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/70 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> 1. Order Placed
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <Clock className="h-4 w-4 animate-spin" /> 2. Manual Verification
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-400">
                    3. Kitchen Dispatch
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-[#741052]"
                    initial={{ width: "45%" }}
                    animate={{ width: ["45%", "60%", "45%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>

                <div className="text-center">
                  <p className="text-xs text-stone-500">
                    Verification typically takes <strong>1–3 minutes</strong> during operating hours.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* COLLAPSIBLE PAYMENT ACCOUNT DETAILS DRAWER */}
        <Card className="border border-gray-200 shadow-md overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowAccountDetails((v) => !v)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <Receipt className="h-5 w-5 text-[#741052]" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  {activeMethod.name} Transfer Details (Review / Copy)
                </h4>
                <p className="text-xs text-gray-500">
                  Need to re-check account numbers or amount?
                </p>
              </div>
            </div>
            {showAccountDetails ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {showAccountDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 border-t border-gray-100 bg-gradient-to-b from-stone-50/50 to-white space-y-3">
                  {activeMethod.bankName && (
                    <div className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Bank Name:</span>
                      <span className="font-bold text-gray-900">{activeMethod.bankName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Account Title:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{activeMethod.accountTitle}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(activeMethod.accountTitle, "Account Title")}
                        className="h-7 w-7 p-0 text-[#741052] hover:bg-purple-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">
                      {activeMethod.id === "bank_transfer" ? "Account Number:" : "Account Number:"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-[#741052] text-sm sm:text-base">
                        {activeMethod.accountNumber}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(activeMethod.accountNumber, "Account Number")}
                        className="h-7 w-7 p-0 text-[#741052] hover:bg-purple-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {activeMethod.iban && (
                    <div className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">IBAN:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900">
                          {activeMethod.iban}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(activeMethod.iban!, "IBAN")}
                          className="h-7 w-7 p-0 text-[#741052] hover:bg-purple-50"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-600">Total Payable Amount:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#741052] text-base sm:text-lg">
                        Rs. {order?.totalAmount ? Number(order.totalAmount).toFixed(2) : "0.00"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(order?.totalAmount ? String(order.totalAmount) : "0", "Amount")}
                        className="h-7 w-7 p-0 text-[#741052] hover:bg-purple-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* HELP & FOOTER INFO */}
        <div className="pt-2 text-center space-y-3">
          <p className="text-xs text-gray-500">
            Have questions or issues transferring? Call our manager directly at{" "}
            <a
              href={`tel:${PAYMENT_CONFIG.supportPhone.replace(/\s/g, "")}`}
              className="font-bold text-[#741052] underline"
            >
              {PAYMENT_CONFIG.supportPhone}
            </a>
          </p>

          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Return to Catalog
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PaymentVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#741052] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-gray-700">Loading Payment Verification...</p>
          </div>
        </div>
      }
    >
      <PaymentVerificationContent />
    </Suspense>
  );
}
