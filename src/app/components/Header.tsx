'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CartSidebar from './CartSidebar'; // Import the CartSidebar component

export default function Header() {
  // State to track if the cart sidebar is open or closed
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableId, setTableId] = useState<string>(''); // State for tableId

  // UseEffect hook to fetch tableId from URL query params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableIdFromUrl = urlParams.get('tableId');

    if (tableIdFromUrl) {
      setTableId(tableIdFromUrl); // If tableId is found in URL, set it
    } else {
      // Fallback: Get tableId from localStorage
      const tableIdFromStorage = localStorage.getItem('tableId');
      if (tableIdFromStorage) {
        setTableId(tableIdFromStorage); // Set tableId from localStorage
      }
    }
  }, []);

  // Function to toggle the cart sidebar
  const toggleCartSidebar = () => {
    if (tableId) {
      setIsCartOpen((prevState) => !prevState); // Open the sidebar if tableId is set
    } else {
      console.log("Table ID is missing");
    }
  };

  return (
    <div className="p-0">
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
              onClick={toggleCartSidebar} // Toggle the cart sidebar
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
          <Link href={"/"}>
            <Image src="/logo.webp" alt="Logo" width={120} height={120} />
          </Link>
        </div>
      </div>

      {/* Conditionally Render Cart Sidebar */}
      {isCartOpen && tableId && <CartSidebar closeSidebar={toggleCartSidebar} tableId={tableId} />}
      {/* Show an error if tableId is missing */}
      {isCartOpen && !tableId && <div className="text-red-500">Error: Table ID is missing</div>}
    </div>
  );
}
