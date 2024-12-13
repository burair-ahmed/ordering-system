'use client'

import { FC, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa"; // Optional for social media icons

const Footer: FC = () => {
  const [tableId, setTableId] = useState<string>('');

  useEffect(() => {
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

  return (
    <footer className="bg-[#741052] text-white py-8">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-center">
          {/* Left Section: Logo */}
          <div className="text-center lg:text-left mb-6 lg:mb-0">
            <Link href={tableId ? `/order?tableId=${tableId}` : '/'}>
              <Image src="/logo.webp" alt="Logo" width={120} height={120} />
            </Link>
          </div>

          {/* Middle Section: Navigation Links */}
          {/* <div className="flex justify-center space-x-8 mb-6 lg:mb-0">
            <a href="/about" className="text-white hover:text-gray-200 transition duration-300">About Us</a>
            <a href="/menu" className="text-white hover:text-gray-200 transition duration-300">Menu</a>
            <a href="/contact" className="text-white hover:text-gray-200 transition duration-300">Contact</a>
            <a href="/terms" className="text-white hover:text-gray-200 transition duration-300">Terms & Conditions</a>
          </div> */}

          {/* Right Section: Social Media Links */}
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-white hover:text-gray-200 transition duration-300">
              <FaFacebook size={24} />
            </a>
            <a href="#" className="text-white hover:text-gray-200 transition duration-300">
              <FaTwitter size={24} />
            </a>
            <a href="#" className="text-white hover:text-gray-200 transition duration-300">
              <FaInstagram size={24} />
            </a>
            <a href="#" className="text-white hover:text-gray-200 transition duration-300">
              <FaLinkedin size={24} />
            </a>
          </div>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="text-center mt-6 text-sm pb-[3em]">
          <p>&copy; {new Date().getFullYear()} Cafe Little Karachi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
