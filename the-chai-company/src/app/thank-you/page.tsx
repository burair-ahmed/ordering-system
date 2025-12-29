'use client';

import { FC, Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import successAnimation from '../../../public/lotties/success-check.json';
import { TypeAnimation } from 'react-type-animation';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';
import {
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Star,
  RefreshCw,
  Share2,
  MessageCircle,
  Download,
  Plus,
  ShoppingCart,
  Receipt,
  ArrowRight,
  Heart,
  Truck,
  Utensils,
  ChefHat,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Skeleton shimmer loader
const SkeletonLoader = () => (
  <div className="w-full animate-pulse">
    <div className="h-6 w-3/4 mx-auto rounded-lg bg-gradient-to-r from-[#C46A47]/20 via-[#A65638]/30 to-[#C46A47]/20 bg-[length:200%_100%] animate-[shimmer_2s_infinite]"></div>
  </div>
);

type OrderItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  variations?: string[];
};

type OrderPayload = {
  orderNumber: string;
  status?: string;
  items?: OrderItem[];
  totalAmount?: number;
  deliveryCharge?: number;
  paymentMethod?: string;
  ordertype?: string;
  tableNumber?: string | null;
  area?: string | null;
  phone?: string | null;
};

const STATUS_STEPS = {
  dinein: ['Received', 'Preparing', 'Ready', 'Completed'],
  pickup: ['Received', 'Preparing', 'Ready', 'Completed'],
  delivery: ['Received', 'Preparing', 'Out for delivery', 'Completed'],
} as const;

const ThankYouPage: FC = () => {
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderPayload | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [hasPlayedSound, setHasPlayedSound] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const [whatsappOptIn, setWhatsAppOptIn] = useState<boolean>(false);
  const [pushOptIn, setPushOptIn] = useState<boolean>(false);
  const [consentStatus, setConsentStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReordering, setIsReordering] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart, clearCart, setOrderContext } = useCart();

  // Query parameters
  const orderType = searchParams?.get('type');
  const tableId = searchParams?.get('tableId');
  const orderParam = searchParams?.get('order');
  const phone = searchParams?.get('phone');

  const fetchOrderDetails = useCallback(async (opts?: { showLoader?: boolean }) => {
    if (!orderType || (!orderNumber && !tableId)) return;
    if (opts?.showLoader) setLoading(true);
    setIsPolling(true);
    setPollError(null);
    try {
      const query = orderNumber
        ? `orderNumber=${encodeURIComponent(orderNumber)}`
        : tableId
        ? `tableId=${encodeURIComponent(tableId)}`
        : '';
      const response = await fetch(`/api/order-status?${query}`);
      const data = await response.json();
      if (!response.ok) {
        setPollError(data?.message || 'Failed to fetch order status.');
      } else {
        setOrderDetails(data.order);
        if (!orderNumber && data.order?.orderNumber) {
          setOrderNumber(data.order.orderNumber);
        }
      }
    } catch {
      setPollError('An error occurred while fetching order status.');
    } finally {
      if (opts?.showLoader) setLoading(false);
      setIsPolling(false);
    }
  }, [orderType, orderNumber, tableId]);

  useEffect(() => {
    // Dine-in: fetch order number using tableId
    if (orderType === 'dinein' && tableId) {
      const fetchOrderNumber = async () => {
        try {
          const response = await fetch(`/api/getOrderByTableId?tableId=${tableId}`);
          const data = await response.json();

          if (response.ok) {
            setOrderNumber(data.orderNumber);
          } else {
            setError('Failed to fetch order details.');
          }
        } catch {
          setError('An error occurred while fetching order details.');
        } finally {
          setLoading(false);
        }
      };
      fetchOrderNumber();
    } 
    // Pickup or Delivery: order number comes directly from query
    else if (orderType === 'pickup' || orderType === 'delivery') {
      if (orderParam) {
        setOrderNumber(orderParam);
        setLoading(false);
      } else {
        setError('Order number missing in URL.');
        setLoading(false);
      }
    } 
    // Unknown or missing order type
    else {
      setError('Invalid or missing order type.');
      setLoading(false);
    }
  }, [orderType, tableId, orderParam]);

  // Fetch order details once we know the identifier
  useEffect(() => {
    if (!orderType) return;
    if (orderType === 'dinein' && tableId) {
      fetchOrderDetails({ showLoader: true });
    } else if ((orderType === 'pickup' || orderType === 'delivery') && orderNumber) {
      fetchOrderDetails({ showLoader: true });
    }
  }, [orderNumber, orderType, tableId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    if (media.addEventListener) media.addEventListener('change', handler);
    else media.addListener(handler);
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', handler);
      else media.removeListener(handler);
    };
  }, []);

  // Poll for status updates
  useEffect(() => {
    if (!orderType || (!orderNumber && !tableId)) return;
    const interval = setInterval(() => {
      fetchOrderDetails();
    }, 10000);
    return () => clearInterval(interval);
  }, [orderNumber, orderType, tableId, fetchOrderDetails]);

  const handleBackToOrder = () => {
    if (orderType === 'dinein' && tableId) {
      router.push(`/order?tableId=${tableId}`);
    } else {
      router.push('/');
    }
  };

  // Play success sound + toast once when we have an order number
  useEffect(() => {
    if (!orderNumber || hasPlayedSound || prefersReducedMotion) return;
    audioRef.current = new Audio('/notification/notification.mp3');
    audioRef.current.volume = 0.6;
    audioRef.current.play().catch(() => null);
    toast.success('Order placed!', {
      description: `We’re preparing your ${orderType || 'order'}.`,
      duration: 4000,
    });
    setHasPlayedSound(true);
  }, [orderNumber, hasPlayedSound, orderType, prefersReducedMotion]);

  const renderOrderDetails = () => {
    if (loading) return <SkeletonLoader />;

    if (error)
      return (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 font-semibold flex items-center justify-center">
          ⚠️ {error}
        </div>
      );

    if (!orderNumber)
      return <p className="text-sm text-gray-500">No order number available.</p>;

    return (
      <>
        <p className="text-lg font-semibold text-gray-800">
          {orderType === 'pickup'
            ? 'Your Pickup Order Number:'
            : orderType === 'delivery'
            ? 'Your Delivery Order Number:'
            : 'Your Table Order Number:'}
        </p>

        <p className="text-2xl font-bold bg-gradient-to-r from-[#C46A47] to-[#A65638] bg-clip-text text-transparent">
          <TypeAnimation sequence={[orderNumber]} speed={50} wrapper="span" repeat={0} />
        </p>

        {orderType === 'dinein' && (
          <p className="text-sm text-gray-600 mt-1">Table ID: {tableId}</p>
        )}
        {orderType === 'delivery' && (
          <p className="text-sm text-gray-600 mt-1">Phone: {phone}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Please keep this number for reference.
        </p>
        {pollError && (
          <p className="text-xs text-amber-600 mt-2">
            {pollError} — <button onClick={() => fetchOrderDetails({ showLoader: true })} className="underline">Retry</button>
          </p>
        )}
      </>
    );
  };

  const renderStatusMessage = () => {
    const currentStatus = orderDetails?.status || 'Received';

    // Status-specific messages
    switch (currentStatus) {
      case 'Received':
        return (
          <>
            <p className="text-gray-700 font-medium">
              {orderType === 'dinein' ? 'Your table order has been received 🍽️' :
               orderType === 'pickup' ? 'Your pickup order has been received 🥡' :
               'Your delivery order has been received 🚚'}
            </p>
            <p className="text-sm text-gray-500">We're preparing your order now.</p>
          </>
        );
      case 'Preparing':
        return (
          <>
            <p className="text-gray-700 font-medium">
              {orderType === 'dinein' ? 'Your table order is being prepared 🍽️' :
               orderType === 'pickup' ? 'Your pickup order is being prepared 🥡' :
               'Your delivery order is being prepared 🚚'}
            </p>
            <p className="text-sm text-gray-500">
              {orderType === 'dinein' ? 'Estimated time: 20–30 minutes' :
               orderType === 'pickup' ? 'Please collect it at the counter soon' :
               'Estimated delivery time: 30–45 minutes'}
            </p>
          </>
        );
      case 'Ready':
        return (
          <>
            <p className="text-gray-700 font-medium">
              {orderType === 'dinein' ? 'Your table order is ready! 🍽️' :
               orderType === 'pickup' ? 'Your pickup order is ready! 🥡' :
               'Your delivery order is ready! 🚚'}
            </p>
            <p className="text-sm text-gray-500">
              {orderType === 'dinein' ? 'Please enjoy your meal at your table' :
               orderType === 'pickup' ? 'Please collect it at the counter' :
               'Your order will be picked up by our delivery partner soon'}
            </p>
          </>
        );
      case 'Out for delivery':
        return (
          <>
            <p className="text-gray-700 font-medium">
              Your order is out for delivery 🚚
            </p>
            <p className="text-sm text-gray-500">Estimated arrival: 15–30 minutes</p>
          </>
        );
      case 'Completed':
        return (
          <>
            <p className="text-gray-700 font-medium">
              {orderType === 'dinein' ? 'Enjoy your meal! 🍽️' :
               orderType === 'pickup' ? 'Order completed! Thank you for visiting 🥡' :
               'Order delivered! Thank you for choosing us 🚚'}
            </p>
            <p className="text-sm text-gray-500">We hope you enjoyed your order!</p>
          </>
        );
      case 'Cancelled':
        return (
          <>
            <p className="text-gray-700 font-medium">
              Order has been cancelled ❌
            </p>
            <p className="text-sm text-gray-500">Please contact us if you have any questions.</p>
          </>
        );
      default:
        return (
          <>
            <p className="text-gray-700 font-medium">
              Your order is being processed. Thank you!
            </p>
            <p className="text-sm text-gray-500">We'll update you with the latest status.</p>
          </>
        );
    }
  };

  const renderStatusTracker = () => {
    if (!orderType) return null;
    const steps = STATUS_STEPS[orderType as keyof typeof STATUS_STEPS] || STATUS_STEPS.dinein;
    const currentStatus = orderDetails?.status || 'Received';
    const activeIndex = steps.findIndex(
      (step) => step.toLowerCase() === currentStatus.toLowerCase()
    );

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, idx) => {
            const isActive = idx <= activeIndex || (activeIndex === -1 && idx === 0);
            return (
              <div key={step} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border ${
                    isActive
                      ? 'bg-gradient-to-r from-[#C46A47] to-[#A65638] text-white border-transparent shadow-md'
                      : 'bg-white/70 text-gray-500 border-gray-200'
                  }`}
                >
                  {idx + 1}
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">{step}</p>
              </div>
            );
          })}
        </div>
        {isPolling && (
          <p className="mt-3 text-xs text-gray-500 text-center">Refreshing status…</p>
        )}
      </div>
    );
  };

  const renderOrderSummary = () => {
    if (!orderDetails || !orderDetails.items) return null;
    return (
      <div className="mb-6 p-4 rounded-xl bg-white/60 border border-white/30 shadow-inner text-left">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-800">Order Summary</p>
          <p className="text-sm text-gray-600">
            {orderDetails.items.length} item{orderDetails.items.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="space-y-3 max-h-48 overflow-auto pr-1">
          {orderDetails.items.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                {item.variations && item.variations.length > 0 && (
                  <p className="text-xs text-rose-700 mt-0.5 truncate">
                    {item.variations.join(', ')}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Rs. {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3 space-y-2 text-sm text-gray-700">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>Rs. {(orderDetails.totalAmount || 0).toFixed(2)}</span>
          </div>
          {orderType === 'delivery' && (
            <div className="flex items-center justify-between">
              <span>Delivery</span>
              <span>Rs. {(orderDetails.deliveryCharge || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between font-semibold">
            <span>Total Paid/Payable</span>
            <span>
              Rs.{' '}
              {(
                (orderDetails.totalAmount || 0) +
                (orderType === 'delivery' ? orderDetails.deliveryCharge || 0 : 0)
              ).toFixed(2)}
            </span>
          </div>
          {orderDetails.paymentMethod && (
            <p className="text-xs text-gray-500">
              Payment method: {orderDetails.paymentMethod.toUpperCase()}
            </p>
          )}
        </div>
      </div>
    );
  };

  const submitConsent = async (channel: 'whatsapp' | 'push', consent: boolean) => {
    if (!orderNumber) return;
    setConsentStatus('saving');
    try {
      const res = await fetch('/api/notification-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          ordertype: orderType,
          phone,
          channel,
          consent,
        }),
      });
      if (!res.ok) throw new Error();
      setConsentStatus('success');
      toast.success('Preference saved');
    } catch {
      setConsentStatus('error');
      toast.error('Could not save preference');
    } finally {
      setTimeout(() => setConsentStatus('idle'), 1500);
    }
  };

  const submitFeedback = async () => {
    if (!orderNumber || !rating) {
      toast.error('Please select a rating before submitting.');
      return;
    }
    setFeedbackStatus('submitting');
    try {
      const res = await fetch('/api/order-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          ordertype: orderType,
          phone,
          rating,
          comment: feedback,
        }),
      });
      if (!res.ok) throw new Error();
      setFeedbackStatus('success');
      toast.success('Thanks for your feedback!');
    } catch {
      setFeedbackStatus('error');
      toast.error('Could not submit feedback');
    } finally {
      setTimeout(() => setFeedbackStatus('idle'), 2000);
    }
  };

  const handleShare = async () => {
    if (!orderNumber) return;
    const shareText = `My order ${orderNumber}${
      orderType === 'delivery' ? ' is on its way!' : ' has been placed!'
    }`;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Order placed', text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      }
    } catch {
      // ignore
    } finally {
      setIsSharing(false);
    }
  };

  const handleSupport = () => {
    const message = encodeURIComponent(
      `Hi, I need help with my order ${orderNumber || ''} (${orderType || ''}).`
    );
    const url = `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  const handleReorder = async () => {
    if (!orderDetails?.items || !orderType) {
      toast.error('Order details not available for reorder.');
      return;
    }
    setIsReordering(true);
    try {
      clearCart();
      setOrderContext(
        orderType as 'dinein' | 'pickup' | 'delivery',
        orderDetails.tableNumber || orderDetails.area || 'default'
      );
      orderDetails.items.forEach((item) => {
        for (let i = 0; i < item.quantity; i += 1) {
          addToCart({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: 1,
            variations: item.variations || [],
          });
        }
      });
      toast.success('Items added back to cart. You can adjust or checkout.');
    } catch {
      toast.error('Could not reorder right now.');
    } finally {
      setIsReordering(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!orderDetails || !orderNumber) {
      toast.error('Receipt unavailable.');
      return;
    }
    const total =
      (orderDetails.totalAmount || 0) +
      (orderDetails.ordertype === 'delivery' ? orderDetails.deliveryCharge || 0 : 0);
    const lines = [
      `Order: ${orderNumber}`,
      `Type: ${orderDetails.ordertype ?? ''}`,
      orderDetails.tableNumber ? `Table: ${orderDetails.tableNumber}` : '',
      orderDetails.area ? `Area: ${orderDetails.area}` : '',
      orderDetails.phone ? `Phone: ${orderDetails.phone}` : '',
      `Payment: ${orderDetails.paymentMethod ?? ''}`,
      `Status: ${orderDetails.status ?? ''}`,
      '',
      'Items:',
      ...(orderDetails.items || []).map(
        (it, idx) =>
          `${idx + 1}. ${it.title} x${it.quantity} @ Rs.${it.price} = Rs.${(
            it.price * it.quantity
          ).toFixed(2)}${it.variations && it.variations.length ? ` (${it.variations.join(', ')})` : ''}`
      ),
      '',
      `Subtotal: Rs.${(orderDetails.totalAmount || 0).toFixed(2)}`,
      orderDetails.ordertype === 'delivery'
        ? `Delivery: Rs.${(orderDetails.deliveryCharge || 0).toFixed(2)}`
        : '',
      `Total: Rs.${total.toFixed(2)}`,
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addOnSuggestions: OrderItem[] = [
    { id: 'addon-softdrink', title: 'Soft Drink 500ml', price: 120, quantity: 1 },
    { id: 'addon-fries', title: 'Crispy Fries', price: 220, quantity: 1 },
    { id: 'addon-dip', title: 'Garlic Dip', price: 80, quantity: 1 },
  ];

  const handleAddOn = (item: OrderItem) => {
    addToCart({ ...item, variations: item.variations || [] });
    toast.success(`${item.title} added for your next order`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf9] via-[#fcf8f5] to-[#f9f3ef] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/20 to-brown-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-200/20 to-brown-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-orange-200/10 to-brown-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[#C46A47] to-[#A65638] rounded-full blur-lg opacity-20 scale-110"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-white/20">
                <div className="w-24 h-24 mx-auto mb-4">
                  <Lottie animationData={successAnimation} loop={!prefersReducedMotion} />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#C46A47] to-[#A65638] bg-clip-text text-transparent mb-2">
                  Order Confirmed!
                </h1>
                <p className="text-gray-600 text-lg">Your delicious order has been received successfully</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Order placed successfully</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Order Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Details Card */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 rounded-[18px]">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#C46A47] to-[#A65638] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-[#C46A47]">Order Details</CardTitle>
                  <CardDescription>Keep this information for your records</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {renderOrderDetails()}

                  {/* Order Type & Details */}
                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                      {orderType === 'dinein' && <Utensils className="h-5 w-5 text-blue-600" />}
                      {orderType === 'pickup' && <ShoppingCart className="h-5 w-5 text-blue-600" />}
                      {orderType === 'delivery' && <Truck className="h-5 w-5 text-blue-600" />}
                      <div>
                        <p className="font-semibold text-gray-900 capitalize">{orderType}</p>
                        <p className="text-sm text-gray-600">
                          {orderType === 'dinein' ? 'Dine-in order' :
                           orderType === 'pickup' ? 'Pickup order' : 'Delivery order'}
                        </p>
                      </div>
                    </div>

                    {orderType === 'dinein' && tableId && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                        <Utensils className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Table {tableId}</p>
                          <p className="text-sm text-gray-600">Your table number</p>
                        </div>
                      </div>
                    )}

                    {orderType === 'delivery' && phone && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                        <Phone className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{phone}</p>
                          <p className="text-sm text-gray-600">Delivery contact</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Status */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 rounded-[18px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-[#C46A47]">
                    <Clock className="h-5 w-5" />
                    Order Status
                  </CardTitle>
                  <CardDescription>Real-time updates on your order progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    {renderStatusMessage()}
                  </div>
                  {renderStatusTracker()}
                </CardContent>
              </Card>

              {/* Order Summary */}
              {renderOrderSummary()}
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg text-[#C46A47]">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleBackToOrder}
                    className="w-full bg-gradient-to-r from-[#C46A47] to-[#A65638] text-white font-semibold py-3 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                  >
                    {orderType === 'dinein' ? <Utensils className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    {orderType === 'dinein' ? 'Back to Menu' : 'Continue Shopping'}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      className="flex items-center gap-2 border-2 hover:border-[#C46A47] hover:text-[#C46A47] transition-colors rounded-xl"
                      disabled={isSharing}
                    >
                      <Share2 className="h-4 w-4" />
                      {isSharing ? 'Sharing...' : 'Share'}
                    </Button>
                    <Button
                      onClick={handleSupport}
                      variant="outline"
                      className="flex items-center gap-2 border-2 hover:border-[#C46A47] hover:text-[#C46A47] transition-colors rounded-xl"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Support
                    </Button>
                  </div>

                  <Button
                    onClick={() => fetchOrderDetails({ showLoader: true })}
                    variant="outline"
                    className="w-full flex items-center gap-2 border-2 hover:border-[#C46A47] hover:text-[#C46A47] transition-colors rounded-xl"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Status
                  </Button>
                </CardContent>
              </Card>

              {/* Order Management */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg text-[#C46A47]">Order Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleReorder}
                    disabled={isReordering || !orderDetails?.items}
                    variant="outline"
                    className="w-full flex items-center gap-2 border-2 hover:border-[#C46A47] hover:text-[#C46A47] transition-colors rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                    {isReordering ? 'Adding to Cart...' : 'Reorder Items'}
                  </Button>

                  <Button
                    onClick={handleDownloadReceipt}
                    variant="outline"
                    className="w-full flex items-center gap-2 border-2 hover:border-[#C46A47] hover:text-[#C46A47] transition-colors rounded-xl"
                  >
                    <Download className="h-4 w-4" />
                    Download Receipt
                  </Button>
                </CardContent>
              </Card>

              {/* Popular Add-ons */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg text-[#C46A47] flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Popular Add-ons
                  </CardTitle>
                  <CardDescription>Perfect companions for your order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {addOnSuggestions.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-600">Rs. {item.price.toFixed(2)}</p>
                        </div>
                        <Button
                          onClick={() => handleAddOn(item)}
                          size="sm"
                          className="bg-gradient-to-r from-[#C46A47] to-[#A65638] text-white hover:opacity-90 transition-all duration-200"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* Notifications */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardHeader>
                <CardTitle className="text-lg text-[#C46A47] flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Stay Updated
                </CardTitle>
                <CardDescription>Get notified when your order is ready</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {consentStatus === 'saving' && (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-5 w-5 animate-spin text-[#C46A47]" />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">WhatsApp Alerts</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={whatsappOptIn}
                        onChange={(e) => {
                          setWhatsAppOptIn(e.target.checked);
                          submitConsent('whatsapp', e.target.checked);
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C46A47]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">Push Notifications</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={pushOptIn}
                        onChange={(e) => {
                          setPushOptIn(e.target.checked);
                          submitConsent('push', e.target.checked);
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A65638]"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardHeader>
                <CardTitle className="text-lg text-[#C46A47] flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Share Your Feedback
                </CardTitle>
                <CardDescription>Help us improve your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Rate your experience</Label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <motion.button
                        key={val}
                        onClick={() => setRating(val)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`w-12 h-12 rounded-full border-2 font-semibold transition-all duration-200 ${
                          rating === val
                            ? 'bg-gradient-to-r from-[#C46A47] to-[#A65638] text-white border-transparent shadow-lg'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#C46A47] hover:shadow-md'
                        }`}
                        aria-label={`Rate ${val} star${val > 1 ? 's' : ''}`}
                      >
                        {val}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="feedback" className="text-sm font-medium text-gray-700 mb-2 block">
                    Additional Comments (Optional)
                  </Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us about your experience..."
                    className="min-h-20 border-2 focus:border-[#C46A47] transition-colors resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={submitFeedback}
                    disabled={feedbackStatus === 'submitting'}
                    className="bg-gradient-to-r from-[#C46A47] to-[#A65638] text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                  >
                    {feedbackStatus === 'submitting' ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>

                <AnimatePresence>
                  {feedbackStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Thank you for your feedback!</span>
                    </motion.div>
                  )}

                  {feedbackStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800"
                    >
                      <X className="h-4 w-4" />
                      <span className="text-sm font-medium">Could not submit feedback. Please try again.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThankYouPageWithSuspense: FC = () => (
  <Suspense fallback={<SkeletonLoader />}>
    <ThankYouPage />
  </Suspense>
);

export default ThankYouPageWithSuspense;
