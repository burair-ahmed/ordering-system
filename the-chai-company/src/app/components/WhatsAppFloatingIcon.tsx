'use client';

import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import Link from 'next/link';

const WhatsAppFloatingIcon = () => {
  const phoneNumber = '923331702706';
  const message = encodeURIComponent('Hello! I would like to inquire about ordering from The Chai Company.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-10 left-10 z-[100]"
    >
      <Link 
        href={whatsappUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all hover:bg-[#20ba5a]"
      >
        <FaWhatsapp size={32} />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-white/20"></span>
        </span>
      </Link>
    </motion.div>
  );
};

export default WhatsAppFloatingIcon;
