'use client'

import { FC, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa"
import { motion, Variants } from "framer-motion"
import { Button } from "@/components/ui/button"

const Footer: FC = () => {
  const [tableId, setTableId] = useState<string>("")

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tableIdFromUrl = urlParams.get("tableId")

    if (tableIdFromUrl) {
      setTableId(tableIdFromUrl)
    } else {
      const tableIdFromStorage = localStorage.getItem("tableId")
      if (tableIdFromStorage) {
        setTableId(tableIdFromStorage)
      }
    }
  }, [])

  // Animation variants (typed)
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    // visible can accept a custom value (index) — provide default to be safe
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      // use a cubic-bezier array for ease so TS accepts it
      transition: { delay: i * 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    }),
  }

  return (
    <footer className="relative bg-[#2E1C14] text-white py-20 mt-20 border-t border-[#6B3F2A]/50">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#C46A47]/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto max-w-7xl px-6 lg:px-12 relative z-10">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Logo Section */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
            className="flex flex-col items-center md:items-start col-span-1 lg:col-span-1"
          >
            <Link href={tableId ? `/order?tableId=${tableId}` : "/"}>
              <div className="relative group">
                <Image
                  src="/logo.webp"
                  alt="The Chai Company Logo"
                  width={120}
                  height={120}
                  className="transition-all duration-500 filter brightness-110 group-hover:scale-110"
                />
                <div className="absolute -inset-2 bg-[#C46A47]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
            <p className="mt-8 text-sm text-[#E3D6C6]/80 text-center md:text-left max-w-xs leading-relaxed font-light">
              Crafting stories through tea and tradition. Experience the architecture of perfect flavor in every cup.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
            className="flex flex-col items-center md:items-start"
          >
            <h3 className="text-[#C46A47] text-sm font-bold uppercase tracking-[0.2em] mb-8">
              Explore
            </h3>
            <nav className="flex flex-col gap-4">
              {[
                { name: "The Menu", href: "/menu" },
                { name: "Our Story", href: "/about" },
                { name: "Find Us", href: "/contact" },
                { name: "Contact", href: "/contact" },
              ].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-[#E3D6C6] transition-all hover:text-[#C46A47] hover:translate-x-1"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </motion.div>

          {/* Business Info */}
          <motion.div
            custom={2}
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
            className="flex flex-col items-center md:items-start"
          >
            <h3 className="text-[#C46A47] text-sm font-bold uppercase tracking-[0.2em] mb-8">
              Visit
            </h3>
            <div className="space-y-4 text-center md:text-left">
              <p className="text-sm text-[#E3D6C6]/80 font-light leading-relaxed">
                Shop No. A/1 Abdullah Apartments,<br />
                Block 16 Gulistan E Johar, Karachi
              </p>
              <p className="text-sm text-[#E3D6C6]/80 font-light underline decoration-[#C46A47]/30 underline-offset-4">
                Open Daily: 4PM - 2AM
              </p>
              <p className="text-sm text-[#E3D6C6]/80 font-light pt-2">
                <a href="tel:+923331702706" className="hover:text-[#C46A47] transition-colors">
                  +92 333 1702706
                </a>
              </p>
            </div>
          </motion.div>

          {/* Social Media */}
          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
            className="flex flex-col items-center md:items-start"
          >
            <h3 className="text-[#C46A47] text-sm font-bold uppercase tracking-[0.2em] mb-8">
              Connect
            </h3>
            <div className="flex gap-4">
              {[
                { icon: <FaFacebook />, href: "#" },
                { icon: <FaInstagram />, href: "#" },
                { icon: <FaTwitter />, href: "#" },
                { icon: <FaLinkedin />, href: "#" },
              ].map((item, i) => (
                <motion.a
                  key={i}
                  href={item.href}
                  whileHover={{ y: -5, backgroundColor: "rgba(196, 106, 71, 0.1)" }}
                  className="text-xl text-[#E3D6C6] border border-[#6B3F2A] p-2.5 rounded-xl transition-colors"
                >
                  {item.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-[#6B3F2A]/30 mt-20 pt-8 flex flex-col md:row items-center justify-between gap-4">
          <p className="text-xs text-[#E3D6C6]/40 uppercase tracking-widest font-medium">
            &copy; {new Date().getFullYear()} The Chai Company. Architectural perfection.
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-xs text-[#E3D6C6]/40 hover:text-[#C46A47] transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-[#E3D6C6]/40 hover:text-[#C46A47] transition-colors">Privacy</Link>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <motion.button
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-10 right-10 w-14 h-14 rounded-2xl bg-[#C46A47] text-white flex items-center justify-center shadow-2xl hover:bg-[#A65638] transition-all group z-40 lg:flex hidden"
      >
        <span className="text-xl group-hover:-translate-y-1 transition-transform">↑</span>
      </motion.button>
    </footer>
  )
}

export default Footer
