'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CartSidebar from './CartSidebar';
import { useCart } from '../context/CartContext';

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableId, setTableId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const { cartItems, totalAmount } = useCart();

  useEffect(() => {
    setIsClient(true);
    const urlParams = new URLSearchParams(window.location.search);
    const tableIdFromUrl = urlParams.get('tableId');

    if (tableIdFromUrl) {
      setTableId(tableIdFromUrl);
    } else {
      const tableIdFromStorage = localStorage.getItem('tableId');
      if (tableIdFromStorage) {
        setTableId(tableIdFromStorage);
      }
    }
  }, []);

  const toggleCartSidebar = () => {
    if (tableId) {
      setIsCartOpen((prevState) => !prevState);
    } else {
      console.log('Table ID is missing');
    }
  };

  if (!isClient) return null;

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="p-0">
      {/* Desktop Header (Unchanged) */}
      <div className="hidden lg:block">
        <div className="fading-gradient">
          <div
            className="background-repeat p-0 -mt-5"
            style={{
              zIndex: '1',
              padding: '0px',
              width: '100%',
              height: '80px',
              backgroundImage: 'url(/group426.png)',
              backgroundRepeat: 'repeat-x',
              backgroundSize: '365px 65px',
              backgroundPosition: '0 0',
            }}
          ></div>

          <div className="grid grid-cols-8 items-center w-9/12 mx-auto pt-6">
            <div className="col-span-4 flex gap-4">
              {/* Contact Button */}
              <button className="bg-[#ff9824] rounded-[5px] px-4 py-1">
                <div className="flex items-center gap-2 mx-auto">
                  <div className="flex items-center">
                    <Image src="/contact.svg" alt="" width={15} height={15} />
                  </div>
                  <div className="text-left">
                    <h1 className="text-[11px] font-extrabold">Contact Now</h1>
                    <p className="text-[10px] font-regular">+92 123456789</p>
                  </div>
                </div>
              </button>

              {/* Location Button */}
              <button className="bg-[#ff9824] rounded-[5px] px-4 py-1">
                <div className="flex items-center gap-2 mx-auto">
                  <div className="flex items-center">
                    <Image src="/location.svg" alt="" width={15} height={15} />
                  </div>
                  <div className="text-left">
                    <h1 className="text-[11px] font-extrabold">Location</h1>
                    <p className="text-[10px] font-regular">Find Us</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="col-span-4 flex gap-4 justify-end">
              {/* Cart Button */}
              <button
                className="bg-[#ff9824] rounded-[5px] px-4 py-1"
                onClick={toggleCartSidebar}
              >
                <div className="flex items-center gap-2 mx-auto">
                  <div className="flex items-center">
                    <Image src="/cart-icon.webp" alt="" width={20} height={20} />
                  </div>
                  <div className="text-left">
                    <h1 className="text-[11px] font-extrabold">Cart</h1>
                    <p className="text-[10px] font-regular">Your Items</p>
                  </div>
                </div>
              </button>

              {/* Offcanvas Button */}
              <button className="bg-[#000] rounded-[5px] px-4 py-1">
                <div className="flex items-center gap-2 mx-auto">
                  <div className="flex items-center">
                    <Image src="/sidebar.svg" alt="" width={15} height={15} />
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Centered Logo */}
          <div className="flex justify-center items-center -mt-[5rem] z-10">
            <Link href={'/'}>
              <Image src="/logo.webp" alt="Logo" width={120} height={120} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="block lg:hidden">
        <div className="flex justify-between items-center p-4 bg-[#ff9824]">
          <Link href={'/'}>
            <Image src="/logo.webp" alt="Logo" width={80} height={80} />
          </Link>

          {/* Sidebar Icon */}
          <button
            className="bg-[#000] rounded-[5px] px-4 py-1"
            onClick={toggleCartSidebar}
          >
            <div className="flex items-center">
              <Image src="/sidebar.svg" alt="Menu" width={20} height={20} />
            </div>
          </button>
        </div>
      </div>

      {/* Fixed Bottom Bar for Mobile */}
      <div className="fixed bottom-0 w-full bg-[#ff9824] text-white py-4 flex justify-between items-center px-4 z-10">
        <div>
          <p className="text-sm font-bold">Total Price: Rs. {totalAmount.toFixed(2)}</p>
          <p className="text-sm">Items: {totalItems}</p>
        </div>
        <button
          className="bg-white text-[#ff9824] rounded-full px-6 py-2 font-bold"
          onClick={toggleCartSidebar}
        >
          View Cart
        </button>
      </div>

      {/* Main Content (Add bottom padding to avoid overlap) */}
      <div className="pt-16 lg:pt-0 pb-16">
        {/* Your main content goes here */}
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && tableId && (
        <CartSidebar closeSidebar={toggleCartSidebar} tableId={tableId} />
      )}
      {isCartOpen && !tableId && (
        <div className="text-red-500">Error: Table ID is missing</div>
      )}
    </div>
  );
}
