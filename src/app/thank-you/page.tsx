'use client';

import { FC, Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import successAnimation from '../../../public/lotties/success-check.json';
import { TypeAnimation } from 'react-type-animation';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';

// Skeleton shimmer loader
const SkeletonLoader = () => (
  <div className="w-full animate-pulse">
    <div className="h-6 w-3/4 mx-auto rounded-lg bg-gradient-to-r from-[#741052]/20 via-[#d0269b]/30 to-[#741052]/20 bg-[length:200%_100%] animate-[shimmer_2s_infinite]"></div>
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

  const fetchOrderDetails = async (opts?: { showLoader?: boolean }) => {
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
  };

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
  }, [orderNumber, orderType, tableId]);

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

        <p className="text-2xl font-bold bg-gradient-to-r from-[#741052] to-[#d0269b] bg-clip-text text-transparent">
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
    switch (orderType) {
      case 'dinein':
        return (
          <>
            <p className="text-gray-700 font-medium">
              Your table order is now being prepared 🍽️
            </p>
            <p className="text-sm text-gray-500">Estimated time: 20–30 minutes</p>
          </>
        );
      case 'pickup':
        return (
          <>
            <p className="text-gray-700 font-medium">
              Your pickup order is being prepared 🥡
            </p>
            <p className="text-sm text-gray-500">Please collect it at the counter soon.</p>
          </>
        );
      case 'delivery':
        return (
          <>
            <p className="text-gray-700 font-medium">
              Your order is out for delivery 🚚
            </p>
            <p className="text-sm text-gray-500">Estimated arrival: 30–45 minutes</p>
          </>
        );
      default:
        return (
          <p className="text-gray-700 font-medium">
            Your order is being processed. Thank you!
          </p>
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
                      ? 'bg-gradient-to-r from-[#741052] to-[#d0269b] text-white border-transparent shadow-md'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9f4fb] via-[#fdf6fb] to-[#f7f1ff] relative overflow-hidden px-4">
      {/* Decorative background emojis */}
      <div className="absolute text-6xl opacity-10 top-4 left-8">🍕</div>
      <div className="absolute text-5xl opacity-10 bottom-10 right-10">🥤</div>
      <div className="absolute text-7xl opacity-10 top-20 right-1/4">🍔</div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-md w-full p-8 rounded-2xl shadow-xl backdrop-blur-lg bg-white/40 border border-white/20 text-center"
      >
        {/* Success Animation */}
        <div className="mx-auto mb-4 w-32 h-32">
          <Lottie animationData={successAnimation} loop={!prefersReducedMotion} />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#741052] to-[#d0269b] bg-clip-text text-transparent mb-3">
          Thank You for Your Order!
        </h1>

        <p className="text-gray-700 text-lg mb-6">
          Your order has been successfully received 🎉
        </p>

        {/* Order Info */}
        <div className="mb-6" role="status" aria-live="polite">
          {renderOrderDetails()}
        </div>

        {/* Status Info */}
        <div className="mb-4" role="status" aria-live="polite">
          {renderStatusMessage()}
        </div>
        {renderStatusTracker()}
        {renderOrderSummary()}

        {/* Button */}
        <motion.button
          onClick={handleBackToOrder}
          whileHover={{
            scale: 1.05,
            boxShadow: '0px 0px 12px rgba(208, 38, 155, 0.6)',
          }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-3 rounded-full text-white font-semibold bg-gradient-to-r from-[#741052] to-[#d0269b] transition relative overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]"
          aria-label="Back to Order"
        >
          {orderType === 'dinein' ? 'Back to Menu' : 'Back to Home'}
        </motion.button>

        {/* Secondary CTAs */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={handleShare}
            className="w-full py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white/70 text-gray-700 hover:border-[#d0269b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]"
            disabled={isSharing}
            aria-disabled={isSharing}
          >
            {isSharing ? 'Sharing…' : 'Share order'}
          </button>
          <button
            onClick={handleSupport}
            className="w-full py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white/70 text-gray-700 hover:border-[#741052] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]"
          >
            Contact support
          </button>
          <button
            onClick={() => fetchOrderDetails({ showLoader: true })}
            className="w-full py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white/70 text-gray-700 hover:border-[#741052] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]"
            disabled={loading}
            aria-disabled={loading}
          >
            Refresh status
          </button>
        </div>

        {/* Reorder & receipts */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={handleReorder}
            disabled={isReordering || !orderDetails?.items}
            className="w-full py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white/70 text-gray-700 hover:border-[#741052] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]"
            aria-disabled={isReordering || !orderDetails?.items}
          >
            {isReordering ? 'Adding…' : 'Reorder these items'}
          </button>
          <button
            onClick={handleDownloadReceipt}
            className="w-full py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white/70 text-gray-700 hover:border-[#741052] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]"
          >
            Download receipt
          </button>
        </div>

        {/* Add-ons */}
        <div className="mt-6 p-4 rounded-xl bg-white/60 border border-white/30 text-left">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800">Popular add-ons</p>
            <p className="text-xs text-gray-500">Prep for your next order</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {addOnSuggestions.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 bg-white/70 p-3 flex flex-col gap-2"
              >
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">Rs. {item.price.toFixed(2)}</p>
                <button
                  onClick={() => handleAddOn(item)}
                  className="mt-auto text-xs font-semibold text-white rounded-full py-2 px-3 bg-gradient-to-r from-[#741052] to-[#d0269b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741052]"
                >
                  Add for next order
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notification opt-in */}
        <div className="mt-6 p-4 rounded-xl bg-white/60 border border-white/30 text-left space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Get updates</p>
              <p className="text-xs text-gray-500">
                We can notify you when your order is ready.
              </p>
            </div>
            {consentStatus === 'saving' && (
              <span className="text-xs text-gray-500">Saving…</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">WhatsApp alerts</div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={whatsappOptIn}
                onChange={(e) => {
                  setWhatsAppOptIn(e.target.checked);
                  submitConsent('whatsapp', e.target.checked);
                }}
                aria-label="Toggle WhatsApp alerts"
              />
              <span
                className={`w-10 h-5 flex items-center rounded-full p-1 transition ${
                  whatsappOptIn ? 'bg-[#d0269b]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
                    whatsappOptIn ? 'translate-x-5' : ''
                  }`}
                />
              </span>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">Push notifications</div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={pushOptIn}
                onChange={(e) => {
                  setPushOptIn(e.target.checked);
                  submitConsent('push', e.target.checked);
                }}
                aria-label="Toggle push notifications"
              />
              <span
                className={`w-10 h-5 flex items-center rounded-full p-1 transition ${
                  pushOptIn ? 'bg-[#741052]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
                    pushOptIn ? 'translate-x-5' : ''
                  }`}
                />
              </span>
            </label>
          </div>
        </div>

        {/* Feedback */}
        <div className="mt-4 p-4 rounded-xl bg-white/60 border border-white/30 text-left">
          <p className="text-sm font-semibold text-gray-800">How was your experience?</p>
          <p className="text-xs text-gray-500 mb-3">
            Quick feedback helps us improve.
          </p>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => setRating(val)}
                className={`w-10 h-10 rounded-full border text-sm font-semibold ${
                  rating === val
                    ? 'bg-gradient-to-r from-[#741052] to-[#d0269b] text-white border-transparent'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
                aria-label={`Rate ${val} star${val > 1 ? 's' : ''}`}
              >
                {val}
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Any quick notes for us?"
            className="w-full rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#741052]"
            rows={3}
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={submitFeedback}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#741052] to-[#d0269b]"
              disabled={feedbackStatus === 'submitting'}
            >
              {feedbackStatus === 'submitting' ? 'Sending…' : 'Submit'}
            </button>
          </div>
          {feedbackStatus === 'success' && (
            <p className="text-xs text-green-600 mt-2">Thanks for your feedback!</p>
          )}
          {feedbackStatus === 'error' && (
            <p className="text-xs text-rose-600 mt-2">Could not submit. Please retry.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const ThankYouPageWithSuspense: FC = () => (
  <Suspense fallback={<SkeletonLoader />}>
    <ThankYouPage />
  </Suspense>
);

export default ThankYouPageWithSuspense;
