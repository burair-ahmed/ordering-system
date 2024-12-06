'use client';

import { FC, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const ThankYouPage: FC = () => {
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const tableId = searchParams ? searchParams.get('tableId') : null; // Get tableId from search params

  // Fetch order number from the API based on tableId
  useEffect(() => {
    if (!tableId) {
      setError('Table ID is missing or invalid.');
      setLoading(false);
      return;
    }

    const fetchOrderNumber = async () => {
      try {
        // Fetch the most recent order details using the tableId
        const response = await fetch(`/api/orders?tableId=${tableId}`);
        const data = await response.json();

        if (response.ok) {
          setOrderNumber(data.orderNumber); // Assuming the API returns an orderNumber
        } else {
          setError('Failed to fetch order details.');
        }
      } catch (error) {
        setError('An error occurred while fetching order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderNumber();
  }, [tableId]);

  const handleBackToOrder = () => {
    if (tableId) {
      window.location.href = `/order?tableId=${tableId}`;
    } else {
      window.location.href = '/';
    }
  };

  if (loading) {
    return <div className="text-center">Loading order details...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-4 text-center">
        <h1 className="text-xl font-semibold text-[#741052] mb-2">Thank You for Your Order!</h1>
        
        <p className="text-base text-gray-700 mb-2">Your order has been successfully received.</p>
        
        <div className="mb-2">
          {orderNumber ? (
            <>
              <p className="text-base font-bold text-[#741052]">Order Number: {orderNumber}</p>
              <p className="text-sm text-gray-600">Please keep this number for reference.</p>
            </>
          ) : (
            <p className="text-gray-600 text-sm">Loading order number...</p>
          )}
        </div>

        <div className="mb-4">
          <p className="text-base text-gray-700">Your order is now forwarded to preparation.</p>
          <p className="text-sm text-gray-500">It will take 30-45 minutes to get ready.</p>
        </div>

        <button
          onClick={handleBackToOrder}
          className="py-2 px-4 bg-[#741052] text-white font-semibold rounded-lg hover:bg-[#5e0d41] transition mt-4"
        >
          Back to Order
        </button>
      </div>
    </div>
  );
};

export default ThankYouPage;
