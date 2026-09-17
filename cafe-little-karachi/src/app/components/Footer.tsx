'use client'

import { FC } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa"
import { Phone, Navigation, ArrowUp } from "lucide-react"
import { motion, Variants } from "framer-motion"
import { trackEvent } from "../lib/analytics"

const Footer: FC = () => {
  const pathname = usePathname()

  if (pathname?.startsWith("/admin")) return null

  // Animation variants
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923331702706"
  const phoneFormatted = "+92 333 1702706"
  const phoneRaw = "+923331702706"

  return (
    <footer className="relative w-full overflow-hidden bg-gradient-to-b from-[#25041a] via-[#350726] to-[#1a0212] text-white pt-14 pb-10 sm:pt-16 sm:pb-12 border-t border-white/10 mt-16 md:mt-24">
      {/* Ambient background glow orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-[#ff9824]/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[520px] h-48 bg-[#741052]/20 rounded-full blur-[110px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
        {/* 1. Centered Logo */}
        <motion.div
          custom={0}
          initial="hidden"
          whileInView="visible"
          variants={fadeUp}
          viewport={{ once: true }}
          className="mb-5"
        >
          <Link href="/" className="group relative inline-flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              {/* Logo glow halo */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#ff9824]/25 to-[#d0269b]/30 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              {/* Circular Emblem */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#5c0d40] border-2 border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(255,152,36,0.15)] flex items-center justify-center p-3.5 backdrop-blur-xl group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/hd-logo.webp"
                  alt="Cafe Little Karachi Logo"
                  width={110}
                  height={110}
                  className="w-[85%] h-[85%] object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* 2. Brand Paragraph */}
        <motion.p
          custom={1}
          initial="hidden"
          whileInView="visible"
          variants={fadeUp}
          viewport={{ once: true }}
          className="text-neutral-200 text-sm sm:text-base max-w-md sm:max-w-lg leading-relaxed font-normal mb-7 px-2"
        >
          Experience authentic Karachi flavors at Little Karachi Express. Handcrafted traditional delicacies, premium dine-in, and fast delivery right to your doorstep.
        </motion.p>

        {/* 3. Contact Links (Pill Badges) */}
        <motion.div
          custom={2}
          initial="hidden"
          whileInView="visible"
          variants={fadeUp}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mb-7 max-w-xl"
        >
          {/* Call Link */}
          <a
            href={`tel:${phoneRaw}`}
            onClick={() => {
              trackEvent('journey_call_click', {
                channel: 'phone',
                destination: phoneRaw,
                source: 'footer_contact',
              })
            }}
            className="group flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#ff9824]/60 text-xs sm:text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(255,152,36,0.2)] hover:-translate-y-0.5"
            aria-label={`Call us at ${phoneFormatted}`}
          >
            <Phone size={14} className="text-[#ff9824] shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-white group-hover:text-amber-200 transition-colors">{phoneFormatted}</span>
          </a>

          {/* WhatsApp Link */}
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello Cafe Little Karachi! I have an inquiry.')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent('journey_whatsapp_click', {
                channel: 'whatsapp',
                destination: whatsappNumber,
                source: 'footer_contact',
              })
            }}
            className="group flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#25D366]/60 text-xs sm:text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(37,211,102,0.2)] hover:-translate-y-0.5"
            aria-label="Chat with us on WhatsApp"
          >
            <FaWhatsapp size={15} className="text-[#25D366] shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-white group-hover:text-emerald-200 transition-colors">WhatsApp Support</span>
          </a>

          {/* Directions / Google Maps Link */}
          <a
            href="https://maps.app.goo.gl/VT5tV6Lm51pxRH7D8?g_st=aw"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent('journey_find_location', {
                location_name: 'Google Maps Directions',
                source: 'footer_contact',
              })
            }}
            className="group flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#ff9824]/60 text-xs sm:text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(255,152,36,0.2)] hover:-translate-y-0.5"
            aria-label="Find us on Google Maps"
          >
            <Navigation size={14} className="text-[#ff9824] shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-white group-hover:text-amber-200 transition-colors">Find Us On Map</span>
          </a>
        </motion.div>

        {/* 4. Social Media Links */}
        <motion.div
          custom={3}
          initial="hidden"
          whileInView="visible"
          variants={fadeUp}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3.5 mb-8"
        >
          {[
            {
              icon: <FaFacebook size={18} />,
              href: "https://www.facebook.com/littlekarachiexpress",
              label: "Facebook",
              hoverColor: "hover:border-[#1877F2]/60 hover:text-[#1877F2] hover:shadow-[0_0_15px_rgba(24,119,242,0.3)]",
            },
            {
              icon: <FaInstagram size={18} />,
              href: "https://www.instagram.com/littlekarachiexpress",
              label: "Instagram",
              hoverColor: "hover:border-[#E4405F]/60 hover:text-[#E4405F] hover:shadow-[0_0_15px_rgba(228,64,95,0.3)]",
            },
          ].map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              onClick={() => {
                trackEvent('journey_contact', {
                  channel: item.label.toLowerCase(),
                  destination: item.href,
                  source: 'footer_social',
                })
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              className={`flex items-center justify-center w-11 h-11 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-white/80 transition-all duration-200 shadow-sm ${item.hoverColor}`}
            >
              {item.icon}
            </motion.a>
          ))}
        </motion.div>

        {/* 5. Elegant Center Divider */}
        <div className="w-24 sm:w-36 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

        {/* 6. Copyright & Operating Details */}
        <motion.div
          custom={4}
          initial="hidden"
          whileInView="visible"
          variants={fadeUp}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-1.5 text-center"
        >
          <p className="text-xs text-neutral-400 font-normal tracking-wide">
            &copy; {new Date().getFullYear()} Little Karachi Express. All rights reserved.
          </p>
          <p className="text-[11px] text-neutral-400/80 flex items-center justify-center gap-1.5 font-light">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 inline-block animate-pulse" />
            <span>Open Daily · Dine-In, Takeaway & Express Delivery</span>
          </p>
        </motion.div>

        {/* 7. Subtle Back to Top Pill Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="mt-8 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-xs text-neutral-400 hover:text-white transition-all duration-200 shadow-sm"
          aria-label="Scroll back to top"
        >
          <ArrowUp size={13} className="text-[#ff9824]" />
          <span>Back to Top</span>
        </motion.button>
      </div>
    </footer>
  )
}

export default Footer

