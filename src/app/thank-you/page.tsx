'use client';

import { FC, useEffect, useState } from "react";

const ThankYouPage: FC = () => {
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Generate a random order number only after the component is mounted
  useEffect(() => {
    const generateOrderNumber = () => {
      return `ORD-${Math.floor(Math.random() * 1000000)}`;
    };

    setOrderNumber(generateOrderNumber());
  }, []); // Empty dependency array ensures this runs only once after mount

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Thank You for Your Order!</h1>
      
      <p className="text-xl mb-4 text-center">Your order has been successfully received.</p>
      
      <div className="mb-6 text-center">
        {orderNumber ? (
          <>
            <p className="text-lg font-bold">Order Number: {orderNumber}</p>
            <p className="text-md">Please keep this number for reference.</p>
          </>
        ) : (
          <p>Loading order number...</p>
        )}
      </div>

      <div className="mb-6 text-center">
        <p className="text-lg">Your order is now forwarded to preparation.</p>
        <p className="text-md">We&apos;ll serve you your order when it gets ready. Primarily, it takes 30-45 minutes.</p>
      </div>

      {/* Optional: Button to redirect back to the homepage or other pages */}
      <div className="text-center mt-6">
        <button 
          onClick={() => window.location.href = '/'}
          className="py-2 px-4 bg-blue-500 text-white rounded"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ThankYouPage;
