'use client';

import { FC, Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import successAnimation from '../../../public/lotties/success.json';
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
  ShoppingBag,
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
        <div className="p-6 rounded-[24px] bg-red-50 border border-red-100 text-red-600 font-black flex items-center justify-center gap-3 text-sm">
          ⚠️ {error}
        </div>
      );

    if (!orderNumber)
      return <p className="text-xs font-black text-[#2E1C14]/40 uppercase tracking-widest">No order number available.</p>;

    return (
      <div className="space-y-4">
        <div>
          <p className="text-[#C46A47] text-[10px] font-black uppercase tracking-[0.3em] mb-2 leading-none">
            {orderType === 'pickup'
              ? 'Pickup ID'
              : orderType === 'delivery'
              ? 'Delivery ID'
              : 'Table ID'}
          </p>

          <p className="text-4xl font-black text-[#2E1C14] tracking-tighter">
            <TypeAnimation sequence={[orderNumber]} speed={50} wrapper="span" repeat={0} />
          </p>
        </div>

        <div className="space-y-1">
          {orderType === 'dinein' && (
            <p className="text-xs font-black text-[#2E1C14]/60 uppercase tracking-widest">Table Location: {tableId}</p>
          )}
          {orderType === 'delivery' && phone && (
            <p className="text-xs font-black text-[#2E1C14]/60 uppercase tracking-widest">Linked Phone: {phone}</p>
          )}
          <p className="text-[10px] font-black text-[#C46A47] uppercase tracking-[0.2em]">
            Preserve this signature for verification.
          </p>
        </div>

        {pollError && (
          <p className="text-xs font-black text-rose-600 bg-rose-50 p-3 rounded-xl inline-block mt-4">
            {pollError} — <button onClick={() => fetchOrderDetails({ showLoader: true })} className="underline font-black">Retry Protocol</button>
          </p>
        )}
      </div>
    );
  };

  const renderStatusMessage = () => {
    const currentStatus = orderDetails?.status || 'Received';

    // Status-specific messages
    switch (currentStatus) {
      case 'Received':
        return (
          <>
            <p className="text-[#FAF3E6] font-black text-lg tracking-tight mb-1">
              {orderType === 'dinein' ? 'Reservation Authenticated' :
               orderType === 'pickup' ? 'Collection Request Received' :
               'Delivery Dispatch Initialized'}
            </p>
            <p className="text-[#FAF3E6]/60 text-xs font-black uppercase tracking-widest">System is processing your request.</p>
          </>
        );
      case 'Preparing':
        return (
          <>
            <p className="text-[#FAF3E6] font-black text-lg tracking-tight mb-1">
              {orderType === 'dinein' ? 'Culinary Assembly in Progress' :
               orderType === 'pickup' ? 'Order Preparation active' :
               'Global Logistics Assembly active'}
            </p>
            <p className="text-[#FAF3E6]/60 text-xs font-black uppercase tracking-widest">
              {orderType === 'dinein' ? 'T-Minus: 20–30 minutes' :
               orderType === 'pickup' ? 'Prepare for collection soon' :
               'T-Minus: 30–45 minutes'}
            </p>
          </>
        );
      case 'Ready':
        return (
          <>
            <p className="text-[#FAF3E6] font-black text-lg tracking-tight mb-1">
              {orderType === 'dinein' ? 'Service Protocol: Ready' :
               orderType === 'pickup' ? 'Collection Protocol: Ready' :
               'Transfer Sequence: Initialized'}
            </p>
            <p className="text-[#FAF3E6]/60 text-xs font-black uppercase tracking-widest">
              {orderType === 'dinein' ? 'Please remain at your coordinates' :
               orderType === 'pickup' ? 'Identity verification at counter required' :
               'Handover to courier partner complete'}
            </p>
          </>
        );
      case 'Out for delivery':
        return (
          <>
            <p className="text-[#FAF3E6] font-black text-lg tracking-tight mb-1">
              Autonomous Delivery active.
            </p>
            <p className="text-[#FAF3E6]/60 text-xs font-black uppercase tracking-widest">Orbital arrival: 15–30 minutes</p>
          </>
        );
      case 'Completed':
        return (
          <>
            <p className="text-[#FAF3E6] font-black text-lg tracking-tight mb-1">
              {orderType === 'dinein' ? 'Culinary Experience Complete' :
               orderType === 'pickup' ? 'Transaction Finalized' :
               'Secure Delivery Confirmed'}
            </p>
            <p className="text-[#FAF3E6]/60 text-xs font-black uppercase tracking-widest">We hope you appreciate the craft.</p>
          </>
        );
      case 'Cancelled':
        return (
          <>
            <p className="text-rose-500 font-black text-lg tracking-tight mb-1">
              Protocol Aborted.
            </p>
            <p className="text-rose-500/60 text-xs font-black uppercase tracking-widest">Please initiate support sequence.</p>
          </>
        );
      default:
        return (
          <>
            <p className="text-[#FAF3E6] font-black text-lg tracking-tight mb-1">
              Syncing with Central Vault...
            </p>
            <p className="text-[#FAF3E6]/60 text-xs font-black uppercase tracking-widest">Telemetry data incoming.</p>
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
      <div className="relative">
        <div className="flex items-center justify-between relative px-2">
            {/* Background Line */}
            <div className="absolute top-[22px] left-[10%] right-[10%] h-[2px] bg-[#2E1C14]/5" />
            
            {steps.map((step, idx) => {
                const isCompleted = idx < activeIndex;
                const isActive = idx === activeIndex || (activeIndex === -1 && idx === 0);
                const isFuture = idx > activeIndex && activeIndex !== -1;

                return (
                    <div key={step} className="relative z-10 flex flex-col items-center flex-1">
                        <motion.div
                            initial={false}
                            animate={{
                                scale: isActive ? 1.2 : 1,
                                backgroundColor: isActive || isCompleted ? '#C46A47' : '#FAF3E6',
                                borderColor: isActive || isCompleted ? '#C46A47' : '#2E1C14/10'
                            }}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-black shadow-lg transition-colors border-2 ${
                                isActive || isCompleted ? 'text-white' : 'text-[#2E1C14]/30'
                            }`}
                        >
                            {isCompleted ? <CheckCircle size={18} strokeWidth={3} /> : idx + 1}
                        </motion.div>
                        <p className={`text-[9px] font-black uppercase tracking-widest mt-4 text-center max-w-[80px] leading-tight ${
                            isActive ? 'text-[#C46A47]' : 'text-[#2E1C14]/40'
                        }`}>
                            {step}
                        </p>
                    </div>
                );
            })}
        </div>
        
        {isPolling && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#C46A47] rounded-full animate-ping" />
            <p className="text-[10px] font-black text-[#C46A47] uppercase tracking-[0.3em]">Vault Link Active</p>
          </div>
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
    <div className="min-h-screen bg-[#FAF3E6] relative overflow-hidden font-poppins selection:bg-[#C46A47]/20">
      {/* Premium Architectural Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#C46A47]/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#6B3F2A]/5 rounded-full blur-[120px]" />
        
        {/* Fine architectural grid lines */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6B3F2A]/10 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[#6B3F2A]/10 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#6B3F2A]/10 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Success Header: Architectural Celebration */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16 md:mb-24"
          >
            <div className="inline-flex flex-col items-center">
              <span className="text-[#C46A47] text-xs md:text-sm font-black uppercase tracking-[0.4em] mb-4">
                Transaction Verified
              </span>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-[#2E1C14] tracking-tighter leading-none mb-8">
                Thank You<span className="text-[#C46A47]">.</span>
              </h1>
              <div className="h-1.5 w-24 bg-[#C46A47] rounded-full mb-12" />
              
              <div className="relative group">
                <div className="absolute inset-0 bg-[#C46A47]/20 blur-2xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
                <div className="relative bg-white/40 backdrop-blur-xl border border-white/20 p-8 md:p-12 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(107,63,42,0.1)]">
                  <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-8 bg-[#2E1C14] rounded-[32px] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#C46A47]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Lottie 
                        animationData={successAnimation} 
                        loop={!prefersReducedMotion} 
                        className="w-20 h-20 md:w-28 md:h-28 relative z-10"
                    />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-[#2E1C14] tracking-tight mb-2">Signature Confirmed</h2>
                  <p className="text-[#6F5A4A] text-lg font-medium opacity-80">Your gourmet selection has been successfully archived.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="grid lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left Column: Status & Details */}
            <div className="lg:col-span-8 space-y-8">
              {/* Architectural Status Tracker */}
              <div className="bg-white/40 backdrop-blur-md rounded-[40px] p-8 md:p-12 border border-white/20 shadow-[0_32px_64px_-16px_rgba(107,63,42,0.05)]">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <span className="text-[#C46A47] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block text-left">Live Monitoring</span>
                    <h3 className="text-3xl font-black text-[#2E1C14] tracking-tight text-left">Order Progress</h3>
                  </div>
                  <div className="w-12 h-12 bg-[#2E1C14] rounded-2xl flex items-center justify-center shadow-lg text-[#C46A47]">
                    <Clock size={20} />
                  </div>
                </div>

                <div className="relative mb-12 text-left">
                    <div className="p-6 bg-[#211510] rounded-[24px] border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#C46A47]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 text-white/90">
                            {renderStatusMessage()}
                        </div>
                    </div>
                </div>

                {renderStatusTracker()}
              </div>

              {/* Order Specifications Card */}
              <div className="bg-white/40 backdrop-blur-md rounded-[40px] p-8 md:p-12 border border-white/20 shadow-[0_32px_64px_-16px_rgba(107,63,42,0.05)]">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[#6B3F2A]/10">
                  <div className="w-12 h-12 bg-[#FAF3E6] rounded-2xl flex items-center justify-center text-[#C46A47]">
                    <Receipt size={20} />
                  </div>
                  <h3 className="text-2xl font-black text-[#2E1C14] tracking-tight">Order Specifications</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-8 text-left">
                    {renderOrderDetails()}
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-[24px] bg-[#2E1C14] text-white flex items-center gap-5 shadow-xl group hover:scale-[1.02] transition-transform">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#C46A47]">
                            {orderType === 'dinein' && <Utensils size={24} />}
                            {orderType === 'pickup' && <ShoppingCart size={24} />}
                            {orderType === 'delivery' && <Truck size={24} />}
                        </div>
                        <div className="text-left">
                            <p className="text-[#C46A47] text-[10px] font-black uppercase tracking-widest mb-1">Service Protocol</p>
                            <p className="text-lg font-black tracking-tight capitalize">{orderType}</p>
                        </div>
                    </div>

                    {orderType === 'dinein' && tableId && (
                        <div className="p-6 rounded-[24px] bg-white border border-[#E3D6C6] flex items-center gap-5 shadow-sm">
                            <div className="w-12 h-12 bg-[#FAF3E6] rounded-2xl flex items-center justify-center text-[#C46A47]">
                                <MapPin size={24} />
                            </div>
                            <div className="text-left">
                                <p className="text-[#C46A47] text-[10px] font-black uppercase tracking-widest mb-1">Coordinates</p>
                                <p className="text-lg font-black text-[#2E1C14] tracking-tight">Table {tableId}</p>
                            </div>
                        </div>
                    )}

                    {orderType === 'delivery' && phone && (
                        <div className="p-6 rounded-[24px] bg-white border border-[#E3D6C6] flex items-center gap-5 shadow-sm">
                            <div className="w-12 h-12 bg-[#FAF3E6] rounded-2xl flex items-center justify-center text-[#C46A47]">
                                <Phone size={24} />
                            </div>
                            <div className="text-left">
                                <p className="text-[#C46A47] text-[10px] font-black uppercase tracking-widest mb-1">Subscriber Identity</p>
                                <p className="text-lg font-black text-[#2E1C14] tracking-tight">{phone}</p>
                            </div>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Summary & Actions */}
            <div className="lg:col-span-4 space-y-8">
              {/* Premium Digital Receipt */}
              <div className="bg-[#211510] rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C46A47] to-transparent" />
                
                <div className="relative z-10 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black text-white tracking-tight">Vault Summary.</h3>
                    <ShoppingBag size={20} className="text-[#C46A47]" />
                  </div>

                  <div className="space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar-light pr-2 mb-10">
                    {orderDetails?.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4 group">
                        <div className="flex-1 text-left">
                          <h4 className="text-[#FAF3E6] font-bold text-sm leading-tight group-hover:text-[#C46A47] transition-colors">{item.title}</h4>
                          <p className="text-[#FAF3E6]/40 text-[10px] font-black uppercase tracking-widest mt-1">QTY: {item.quantity}</p>
                        </div>
                        <span className="text-[#FAF3E6] font-black text-sm">Rs. {(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-8 border-t border-white/10 space-y-4">
                    <div className="flex justify-between text-xs font-black text-[#FAF3E6]/60 uppercase tracking-widest">
                      <span>Base Value</span>
                      <span>Rs. {(orderDetails?.totalAmount || 0).toFixed(0)}</span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-xs font-black text-[#FAF3E6]/60 uppercase tracking-widest">
                        <span>Logistics</span>
                        <span>Rs. {(orderDetails?.deliveryCharge || 0).toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end pt-6 border-t border-white/20">
                      <span className="text-2xl font-black text-white uppercase tracking-tighter text-left">Total</span>
                      <span className="text-3xl font-black text-[#C46A47]">Rs. {((orderDetails?.totalAmount || 0) + (orderType === 'delivery' ? orderDetails?.deliveryCharge || 0 : 0)).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Architectural Action Grid */}
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={handleBackToOrder}
                  className="w-full bg-[#C46A47] hover:bg-[#A65638] text-white font-black py-6 rounded-[24px] shadow-xl hover:shadow-[#C46A47]/20 transition-all flex items-center justify-center gap-3 group uppercase tracking-widest text-xs"
                >
                  {orderType === 'dinein' ? <Utensils size={18} /> : <ArrowRight size={18} />}
                  <span>{orderType === 'dinein' ? 'Explore More' : 'Continue Crafting'}</span>
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-[24px] bg-white border border-[#E3D6C6] text-[#2E1C14] hover:bg-[#2E1C14] hover:text-white transition-all group shadow-sm"
                  >
                    <Share2 size={24} className="text-[#C46A47]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                  </button>
                  <button
                    onClick={handleSupport}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-[24px] bg-white border border-[#E3D6C6] text-[#2E1C14] hover:bg-[#2E1C14] hover:text-white transition-all group shadow-sm"
                  >
                    <MessageCircle size={24} className="text-[#C46A47]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Support</span>
                  </button>
                </div>

                <button
                  onClick={handleDownloadReceipt}
                  className="w-full bg-[#2E1C14] hover:bg-[#211510] text-[#FAF3E6] font-black py-4 rounded-[20px] transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] border border-white/5"
                >
                  <Download size={16} className="text-[#C46A47]" />
                  <span>Download Archive</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const ThankYouPageWrapper = () => (
  <Suspense fallback={
    <div className="min-h-screen bg-[#FAF3E6] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#C46A47] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-[#2E1C14] font-black uppercase tracking-widest text-xs">Architectural Loading...</p>
      </div>
    </div>
  }>
    <ThankYouPage />
  </Suspense>
);

export default ThankYouPageWrapper;
