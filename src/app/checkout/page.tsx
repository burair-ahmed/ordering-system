'use client';

import React, { FC, useState, useEffect, Suspense } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';

const CheckoutPageContent: FC = () => {
  const { cartItems, totalAmount, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
    if (!formData.name || !formData.email || !formData.tableNumber) {
      alert('Please fill in all fields.');
      return;
    }
    setIsModalOpen(true);
  };

  const handlePlaceOrder = async () => {
    const newOrder = {
      orderNumber: `ORD-${Math.floor(Math.random() * 1000000)}`,
      customerName: formData.name,
      email: formData.email,
      tableNumber: formData.tableNumber,
      paymentMethod: formData.paymentMethod,
      items: cartItems.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        variations: item.variations,
      })),
      totalAmount: totalAmount,
      status: 'Received',
    };

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newOrder),
    });

    if (response.ok) {
      alert('Order placed successfully!');
      clearCart();
      
      // Redirect to the thank you page with tableId
      router.push(`/thank-you?tableId=${formData.tableNumber}`);
    } else {
      alert('Failed to place the order.');
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
            placeholder="Email Address"
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
                id="card"
                name="paymentMethod"
                value="card"
                checked={formData.paymentMethod === 'card'}
                onChange={handlePaymentChange}
                className="text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="card" className="text-sm text-[#333]">Card</label>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold text-lg text-[#333]">Cart Summary</h2>
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow-md">
                <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-lg" />
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
              <div className="text-lg text-[#333]"><strong>Email:</strong> {formData.email}</div>
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
                disabled={!isChecked}
                className={`w-full py-3 text-white rounded-lg font-semibold text-lg ${
                  !isChecked ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#741052] hover:bg-[#5e0d41]'
                } transition-colors duration-200`}
              >
                Place Order
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

export default CheckoutPageContent;
