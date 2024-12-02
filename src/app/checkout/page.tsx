"use client";

import { FC, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";

const CheckoutPage: FC = () => {
  const { cartItems, totalAmount, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    tableNumber: "",
    paymentMethod: "cash",
  });
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, paymentMethod: e.target.value });
  };

  const handleCheckout = () => {
    if (!formData.name || !formData.email || !formData.tableNumber) {
      alert("Please fill in all fields.");
      return;
    }

    clearCart();
    router.push("/thank-you");
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
              checked={formData.paymentMethod === "cash"}
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
              checked={formData.paymentMethod === "card"}
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
        className="w-full py-2 bg-blue-500 text-white rounded"
      >
        Proceed to Payment
      </button>
    </div>
  );
};

export default CheckoutPage;
