'use client';

import React, { FC, useState, useEffect, Suspense } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Preloader from '../components/Preloader';

const CheckoutPageContent: FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { cartItems, totalAmount, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    email: '',  // Keep this but it's optional
    tableNumber: '',
    paymentMethod: 'cash',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      const tableId = searchParams.get('tableId');
      if (tableId) {
        setFormData((prevData) => ({
          ...prevData,
          tableNumber: tableId,
        }));
      } else {
        alert('Table ID is missing or invalid.');
        router.push('/');
      }
    }
  }, [searchParams, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, paymentMethod: e.target.value });
  };

  const handleCheckout = () => {
    if (!formData.name || !formData.tableNumber) {
      alert('Please fill in all required fields.');
      return;
    }
    setIsModalOpen(true);
  };

  

  const handlePlaceOrder = async (): Promise<void> => {
    setIsProcessing(true); // Indicate that the request is being processed
  
    const newOrder = {
      customerName: formData.name,
      email: formData.email || '', // Optional email
      tableNumber: formData.tableNumber,
      paymentMethod: formData.paymentMethod,
      items: cartItems.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        variations: item.variations || [], // Ensure variations is passed as an array
      })),
      totalAmount: totalAmount,
      status: 'Received', // Initial order status
    };
  
    try {
      // Save order to the backend
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
  
      if (response.ok) {
        const { orderNumber } = await response.json(); // Get the order number from the API response
        
        // Send WhatsApp message with Twilio using the order number returned from the API
        await sendWhatsAppNotification({ ...newOrder, orderNumber });
  
        // Clear the cart and redirect the user
        clearCart();
        router.push(`/thank-you?tableId=${formData.tableNumber}`);
      } else {
        alert('Failed to place the order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing the order:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false); // Reset the processing state
    }
  };
  

  
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
      variations: string[]; // Adjust based on your data structure
    }[];
    totalAmount: number;
  }): Promise<void> => {
    const { customerName, tableNumber, paymentMethod, items, totalAmount, orderNumber } = order;
  
    // Construct the message
    const message = `
    New Order Received:
    - Order Number: ${orderNumber}
    - Customer Name: ${customerName}
    - Table Number: ${tableNumber}
    - Payment Method: ${paymentMethod}
    - Total Amount: Rs. ${totalAmount.toFixed(2)}
    - Items:
    - ${items.map((item, index) => `   ${index + 1}. ${item.title} x${item.quantity} (Rs. ${item.price * item.quantity})`).join('\n')}
    `;
  
    try {
      // Call your API endpoint or server function to send the WhatsApp message
      const twilioResponse = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
  
      if (twilioResponse.ok) {
        console.log('WhatsApp notification sent successfully.');
      } else {
        console.error('Failed to send WhatsApp notification.');
      }
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
    }
  };
  

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold text-center text-[#333]">Checkout</h1>

      <div className="space-y-6">
        <div className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address (Optional)"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            name="tableNumber"
            placeholder="Table Number"
            value={formData.tableNumber}
            onChange={handleInputChange}
            className="w-full p-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled
          />
        </div>

        <div className="mb-6">
          <h2 className="font-semibold text-lg text-[#333] mb-4">Select Payment Method</h2>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="cash"
                name="paymentMethod"
                value="cash"
                checked={formData.paymentMethod === 'cash'}
                onChange={handlePaymentChange}
                className="text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="cash" className="text-sm text-[#333]">Cash</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="online"
                name="paymentMethod"
                value="online"
                checked={formData.paymentMethod === 'online'}
                onChange={handlePaymentChange}
                className="text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="online" className="text-sm text-[#333]">Online</label>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold text-lg text-[#333]">Cart Summary</h2>
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow-md">
                <Image src={item.image || "Placeholder.png"} alt={item.title} width={150} height={40} />
                <div className="flex-1 pl-4">
                  <p className="font-medium text-[#333]">{item.title} ({typeof item.variations === 'object' ? Object.values(item.variations).join(', ') : item.variations})</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  <p className="font-semibold text-[#741052]">Rs. {item.price * item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-bold text-lg mt-4">
            <span>Total:</span>
            <span>Rs. {totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          className="w-full py-3 bg-[#741052] text-white rounded-lg hover:bg-[#5e0d41] transition"
        >
          Proceed to Payment
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-opacity-60 bg-black flex justify-center items-center z-50 -mt-2">
          <div className="bg-white px-8 py-4 rounded-lg shadow-lg w-full max-w-lg transform transition-all duration-300">
            <h2 className="text-2xl font-semibold text-center mb-4 text-[#333]">Confirm Order</h2>
            <div className="space-y-3 mb-6">
              <div className="text-lg text-[#333]"><strong>Name:</strong> {formData.name}</div>
              <div className="text-lg text-[#333]"><strong>Email:</strong> {formData.email || 'N/A'}</div>
              <div className="text-lg text-[#333]"><strong>Table Number:</strong> {formData.tableNumber}</div>
              <div className="text-lg text-[#333]"><strong>Payment Method:</strong> {formData.paymentMethod}</div>
              
              <div className="text-lg text-[#333]"><strong>Cart Items:</strong></div>
              <ul className="space-y-2">
                {cartItems.map((item, index) => (
                  <li key={`${item.id}-${index}`} className="text-sm text-gray-700">
                    <strong>{item.title}</strong> 
                    ({typeof item.variations === 'object' ? Object.values(item.variations).join(', ') : item.variations}) 
                    - Qty: {item.quantity}, Price: Rs. {item.price * item.quantity}
                  </li>
                ))}
              </ul>
              
              <div className="text-lg font-semibold text-[#741052] mt-4">
                <strong>Total Amount:</strong> Rs. {totalAmount.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center mb-6 space-x-2">
              <input
                type="checkbox"
                id="confirm"
                checked={isChecked}
                onChange={handleCheckboxChange}
                className="mr-2 h-5 w-5 text-[#741052] border-gray-300 rounded focus:ring-[#741052]"
              />
              <label htmlFor="confirm" className="text-sm text-[#333]">I confirm the above details are correct.</label>
            </div>

            <div className="flex flex-col space-y-4">
            <button
  onClick={handlePlaceOrder}
  disabled={!isChecked || isProcessing}
  className={`w-full py-3 text-white rounded-lg font-semibold text-lg ${
    !isChecked || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#741052] hover:bg-[#5e0d41]'
  } transition-colors duration-200 flex items-center justify-center`}
>
  {isProcessing ? (
    <span className="loader"><Preloader/></span> 
  ) : (
    'Place Order'
  )}
</button>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-3 bg-gray-200 text-[#333] rounded-lg font-semibold text-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckoutPage: FC = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <CheckoutPageContent />
  </Suspense>
);

export default CheckoutPage;
