'use client';

import { FC, Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import successAnimation from '../../../public/lotties/success-check.json';
import { TypeAnimation } from 'react-type-animation';

// Skeleton shimmer loader
const SkeletonLoader = () => (
  <div className="w-full animate-pulse">
    <div className="h-6 w-3/4 mx-auto rounded-lg bg-gradient-to-r from-[#741052]/20 via-[#d0269b]/30 to-[#741052]/20 bg-[length:200%_100%] animate-[shimmer_2s_infinite]"></div>
  </div>
);

const ThankYouPage: FC = () => {
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Query parameters
  const orderType = searchParams?.get('type');
  const tableId = searchParams?.get('tableId');
  const orderParam = searchParams?.get('order');
  const phone = searchParams?.get('phone');

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

  const handleBackToOrder = () => {
    if (orderType === 'dinein' && tableId) {
      router.push(`/order?tableId=${tableId}`);
    } else {
      router.push('/');
    }
  };

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
          <Lottie animationData={successAnimation} loop={true} />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#741052] to-[#d0269b] bg-clip-text text-transparent mb-3">
          Thank You for Your Order!
        </h1>

        <p className="text-gray-700 text-lg mb-6">
          Your order has been successfully received 🎉
        </p>

        {/* Order Info */}
        <div className="mb-6">{renderOrderDetails()}</div>

        {/* Status Info */}
        <div className="mb-6">{renderStatusMessage()}</div>

        {/* Button */}
        <motion.button
          onClick={handleBackToOrder}
          whileHover={{
            scale: 1.05,
            boxShadow: '0px 0px 12px rgba(208, 38, 155, 0.6)',
          }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-3 rounded-full text-white font-semibold bg-gradient-to-r from-[#741052] to-[#d0269b] transition relative overflow-hidden"
          aria-label="Back to Order"
        >
          {orderType === 'dinein' ? 'Back to Menu' : 'Back to Home'}
        </motion.button>
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
