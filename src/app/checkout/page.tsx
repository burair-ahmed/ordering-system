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
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [isChecked, setIsChecked] = useState(false); // Checkbox state
  const router = useRouter();
  const searchParams = useSearchParams(); // Client-side hook

  // Read tableId from URL using useSearchParams
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
        router.push('/'); // Redirect to home if tableId is invalid
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
    setIsModalOpen(true); // Open the modal
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
        variations: item.variations, // Include variations in the order
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
      router.push('/thank-you');
    } else {
      alert('Failed to place the order.');
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="space-y-4 mb-6">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="tableNumber"
          placeholder="Table Number"
          value={formData.tableNumber}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          disabled
        />
      </div>

      <div className="mb-6">
        <h2 className="font-bold mb-2">Select Payment Method</h2>
        <div className="flex gap-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="cash"
              name="paymentMethod"
              value="cash"
              checked={formData.paymentMethod === 'cash'}
              onChange={handlePaymentChange}
              className="mr-2"
            />
            <label htmlFor="cash">Cash</label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="card"
              name="paymentMethod"
              value="card"
              checked={formData.paymentMethod === 'card'}
              onChange={handlePaymentChange}
              className="mr-2"
            />
            <label htmlFor="card">Card</label>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-bold">Cart Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cartItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className="border rounded p-4 shadow-md">
              <img src={item.image} alt={item.title} className="w-full h-40 object-cover mb-4" />
              <div className="flex flex-col">
                <span className="font-semibold">{item.title}</span>
                <span>Qty: {item.quantity}</span>
                <span>Rs. {item.price * item.quantity}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold mt-4">
          <span>Total:</span>
          <span>Rs. {totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        className="w-full py-2 bg-blue-500 text-white rounded mb-4"
      >
        Proceed to Payment
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Order</h2>
            <div className="space-y-4 mb-4">
              <div><strong>Name:</strong> {formData.name}</div>
              <div><strong>Email:</strong> {formData.email}</div>
              <div><strong>Table Number:</strong> {formData.tableNumber}</div>
              <div><strong>Payment Method:</strong> {formData.paymentMethod}</div>
              <div><strong>Total Items:</strong> {cartItems.length}</div>
              <div><strong>Total Amount:</strong> Rs. {totalAmount.toFixed(2)}</div>
            </div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="confirm"
                checked={isChecked}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label htmlFor="confirm">I confirm the above details are correct.</label>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={!isChecked}
              className={`w-full py-2 bg-green-500 text-white rounded ${
                !isChecked && 'opacity-50 cursor-not-allowed'
              }`}
            >
              Place Order
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full py-2 mt-4 bg-gray-300 text-black rounded"
            >
              Close
            </button>
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
