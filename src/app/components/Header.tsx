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
      {/* Desktop Header */}
      <div className="hidden lg:block pb-8">
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
              <button className="bg-[#ff9824] rounded-[5px] px-4 py-1">
                <Link href="tel:+923331702704">
                  <div className="flex items-center gap-2 mx-auto">
                    <div className="flex items-center">
                      <Image src="/contact.svg" alt="" width={15} height={15} />
                    </div>
                    <div className="text-left">
                      <h1 className="text-[11px] font-extrabold">Contact Now</h1>
                      <p className="text-[10px] font-regular">+92 3331702704</p>
                    </div>
                  </div>
                </Link>
              </button>

              {/* Location Button */}
              <button className="bg-[#ff9824] rounded-[5px] px-4 py-1">
                <Link target='_blank' href="https://www.google.com/maps/place/Cafe+Little+Karachi/@24.9219628,67.1162219,41m/data=!3m1!1e3!4m6!3m5!1s0x3eb3414e7de37d51:0x29be4bee897cb4b2!8m2!3d24.9219151!4d67.1163346!16s%2Fg%2F11jz5mh9y8?entry=ttu&g_ep=EgoyMDI0MTIwNC4wIKXMDSoASAFQAw%3D%3D">
                  <div className="flex items-center gap-2 mx-auto">
                    <div className="flex items-center">
                      <Image src="/location.svg" alt="" width={15} height={15} />
                    </div>
                    <div className="text-left">
                      <h1 className="text-[11px] font-extrabold">Location</h1>
                      <p className="text-[10px] font-regular">Find Us</p>
                    </div>
                  </div>
                </Link>
              </button>
            </div>

            <div className="col-span-4 flex gap-4 justify-end">
              {/* Cart Button with item count */}
              <button
                className="bg-[#ff9824] rounded-[5px] px-4 py-1 relative"
                onClick={toggleCartSidebar}
              >
                <div className="flex items-center gap-2 mx-auto">
                  <div className="flex items-center">
                    <Image src={"/cart-icon.png"} alt="" width={20} height={20} />
                  </div>
                  <div className="text-left">
                    <h1 className="text-[11px] font-extrabold">Cart</h1>
                    <p className="text-[10px] font-regular">Your Items</p>
                  </div>
                </div>
                {/* Red Circle for Cart Item Quantity */}
                {totalItems > 0 && (
                  <div className="absolute top-1 right-2 bg-white text-[#000] text-xs font-extrabold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalItems}
                  </div>
                )}
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

          {/* Centered Logo with Table ID in the Link */}
          <div className="flex justify-center items-center -mt-[5rem] z-10">
            <Link href={tableId ? `/order?tableId=${tableId}` : '/'}>
              <Image src="/logo.webp" alt="Logo" width={120} height={120} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="block lg:hidden">
        <div className="flex justify-between items-center p-4 bg-[#ff9824]">
          <Link href={tableId ? `/order?tableId=${tableId}` : '/'}>
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
      <div className="fixed bottom-0 left-0 w-full bg-[#741052] text-white py-3 flex justify-between items-center px-6 z-20 shadow-md">
        <div className="flex flex-col text-center sm:text-left">
          <p className="text-sm font-semibold">Total Price: Rs. {totalAmount.toFixed(2)}</p>
          <p className="text-xs sm:text-sm">Items: {totalItems}</p>
        </div>
        <button 
          className="bg-white text-[#ff7b00] rounded-full px-6 py-2 font-bold shadow-lg transition-all hover:bg-[#ff5f00] hover:text-[#fff] focus:outline-none focus:ring-2 focus:ring-[#ff5f00] focus:ring-opacity-50"
          onClick={toggleCartSidebar}
        >
          View Cart
        </button>
      </div>

      {/* Main Content */}
      {/* <div className="pt-16 lg:pt-0 pb-16">
      </div> */}

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
