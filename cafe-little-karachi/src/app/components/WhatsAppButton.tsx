'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import { X } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(true);
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923331702706';
  const defaultMessage = encodeURIComponent('Hello Cafe Little Karachi! I have an inquiry about the menu/order.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultMessage}`;

  if (pathname?.startsWith('/admin')) return null;

  return (
    <div className="hidden md:flex fixed bottom-6 left-6 z-50 items-center gap-3">
      {/* WhatsApp Action Button */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Cafe Little Karachi on WhatsApp"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        onClick={() => {
          trackEvent('journey_whatsapp_click', {
            channel: 'whatsapp',
            source: 'floating_button',
            destination: whatsappNumber,
          });
        }}
        className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-[0_8px_25px_rgba(37,211,102,0.4)] hover:shadow-[0_12px_30px_rgba(37,211,102,0.6)] border border-white/20 transition-all duration-300"
      >
        {/* Pulsing Outer Ring */}
        <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping pointer-events-none" />

        {/* WhatsApp Icon */}
        <FaWhatsapp className="w-7 h-7 text-white drop-shadow-sm transition-transform duration-300 group-hover:rotate-12" />

        {/* Online Status Indicator */}
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />
      </motion.a>

      {/* Floating Tooltip Pill */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -15, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-xs font-medium px-3.5 py-2 rounded-2xl shadow-xl"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent('journey_whatsapp_click', {
                  channel: 'whatsapp',
                  source: 'floating_button_tooltip',
                  destination: whatsappNumber,
                });
              }}
              className="hover:text-emerald-400 transition-colors"
            >
              <span>Chat with us on WhatsApp!</span>
              <span className="inline-block ml-1">👋</span>
            </a>
            <button
              onClick={() => setShowTooltip(false)}
              className="p-0.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all ml-1"
              aria-label="Dismiss WhatsApp hint"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
