'use client'

import { FC } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa"
import { Phone, Navigation, ArrowUp } from "lucide-react"
import { motion, Variants } from "framer-motion"

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

  const phoneRaw = "+923331702706"
  const phoneFormatted = "+92 333 1702706"
  const whatsappNumber = "923331702706"

  return (
    <footer className="relative w-full overflow-hidden bg-[#22130c] text-white pt-16 pb-12 sm:pt-20 sm:pb-14 border-t border-[#6B3F2A]/40 mt-16 md:mt-24">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-[#C46A47]/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-48 bg-[#6B3F2A]/20 rounded-full blur-[110px] pointer-events-none" />

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
              <div className="absolute -inset-2 bg-[#C46A47]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#2E1C14] border border-[#6B3F2A] shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-center justify-center p-3 backdrop-blur-xl group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/logo.webp"
                  alt="The Chai Company Logo"
                  width={110}
                  height={110}
                  className="w-[85%] h-[85%] object-contain filter brightness-110 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
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
          className="text-[#E3D6C6]/80 text-sm sm:text-base max-w-md sm:max-w-lg leading-relaxed font-light mb-7 px-2"
        >
          Crafting stories through tea and tradition. Experience the architecture of perfect flavor in every cup, handcrafted platters, and gourmet snacks.
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
            className="group flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full bg-[#2E1C14]/80 hover:bg-[#2E1C14] border border-[#6B3F2A]/60 hover:border-[#C46A47] text-xs sm:text-sm font-medium text-[#E3D6C6] transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(196,106,71,0.25)] hover:-translate-y-0.5"
            aria-label={`Call us at ${phoneFormatted}`}
          >
            <Phone size={14} className="text-[#C46A47] shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-[#E3D6C6] group-hover:text-white transition-colors">{phoneFormatted}</span>
          </a>

          {/* WhatsApp Link */}
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello The Chai Company! I have an inquiry.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full bg-[#2E1C14]/80 hover:bg-[#2E1C14] border border-[#6B3F2A]/60 hover:border-[#25D366]/60 text-xs sm:text-sm font-medium text-[#E3D6C6] transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(37,211,102,0.2)] hover:-translate-y-0.5"
            aria-label="Chat with us on WhatsApp"
          >
            <FaWhatsapp size={15} className="text-[#25D366] shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-[#E3D6C6] group-hover:text-emerald-200 transition-colors">WhatsApp Support</span>
          </a>

          {/* Directions Link */}
          <a
            href="https://maps.app.goo.gl/VT5tV6Lm51pxRH7D8?g_st=aw"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full bg-[#2E1C14]/80 hover:bg-[#2E1C14] border border-[#6B3F2A]/60 hover:border-[#C46A47] text-xs sm:text-sm font-medium text-[#E3D6C6] transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(196,106,71,0.25)] hover:-translate-y-0.5"
            aria-label="Visit us at Gulistan-e-Johar, Karachi"
          >
            <Navigation size={14} className="text-[#C46A47] shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-[#E3D6C6] group-hover:text-white transition-colors">Gulistan-e-Johar, Karachi</span>
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
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              className={`flex items-center justify-center w-11 h-11 rounded-full bg-[#2E1C14] border border-[#6B3F2A] text-[#E3D6C6]/80 transition-all duration-200 shadow-sm ${item.hoverColor}`}
            >
              {item.icon}
            </motion.a>
          ))}
        </motion.div>

        {/* 5. Center Divider */}
        <div className="w-24 sm:w-36 h-px bg-gradient-to-r from-transparent via-[#6B3F2A] to-transparent mb-6" />

        {/* 6. Copyright & Hours */}
        <motion.div
          custom={4}
          initial="hidden"
          whileInView="visible"
          variants={fadeUp}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-1.5 text-center"
        >
          <p className="text-xs text-[#E3D6C6]/50 font-light tracking-wide">
            &copy; {new Date().getFullYear()} The Chai Company. All rights reserved.
          </p>
          <p className="text-[11px] text-[#E3D6C6]/40 flex items-center justify-center gap-1.5 font-light">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 inline-block animate-pulse" />
            <span>Open Daily: 4:00 PM – 2:00 AM · Dine-In & Takeaway</span>
          </p>
        </motion.div>

        {/* 7. Back to Top Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="mt-8 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#2E1C14] hover:bg-[#3D251A] border border-[#6B3F2A] hover:border-[#C46A47]/60 text-xs text-[#E3D6C6]/60 hover:text-[#E3D6C6] transition-all duration-200 shadow-sm"
          aria-label="Scroll back to top"
        >
          <ArrowUp size={13} className="text-[#C46A47]" />
          <span>Back to Top</span>
        </motion.button>
      </div>
    </footer>
  )
}

export default Footer

