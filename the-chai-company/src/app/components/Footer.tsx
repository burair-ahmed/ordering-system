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
    <footer className="relative bg-[#2E1C14] text-white py-16 mt-12 border-t border-[#6B3F2A]">
      <div className="container mx-auto max-w-7xl px-6 lg:px-12">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
          {/* Logo Section */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
            className="flex flex-col items-center sm:items-start"
          >
            <Link href={tableId ? `/order?tableId=${tableId}` : "/"}>
              <Image
                src="/logo.webp"
                alt="Logo"
                width={140}
                height={140}
                className="transition-transform duration-300 hover:scale-105 hover:drop-shadow-[0_0_15px_rgba(196,106,71,0.4)]"
              />
            </Link>
            <p className="mt-6 text-sm text-[#E3D6C6] text-center sm:text-left max-w-xs leading-relaxed">
              Experience the finest hand-crafted tea and authentic snacks at The Chai Company. Dine in, order
              online, and savor the moment.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
            className="flex flex-col text-center sm:text-left"
          >
            <h3 className="text-[#C46A47] text-lg font-bold tracking-wider mb-6">
              Quick Links
            </h3>
            <nav className="flex flex-col gap-3">
              {[
                { name: "About Us", href: "/about" },
                { name: "Menu", href: "/menu" },
                { name: "Contact", href: "/contact" },
                { name: "Terms & Conditions", href: "/terms" },
              ].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-[#E3D6C6] transition-colors duration-300 hover:text-[#C46A47] inline-block"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </motion.div>

          {/* Social Media */}
          <motion.div
            custom={2}
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
            className="flex flex-col items-center sm:items-start"
          >
            <h3 className="text-[#C46A47] text-lg font-bold tracking-wider mb-6">
              Follow Us
            </h3>
            <div className="flex gap-5">
              {[
                { icon: <FaFacebook />, href: "#" },
                { icon: <FaInstagram />, href: "#" },
                { icon: <FaTwitter />, href: "#" },
                { icon: <FaLinkedin />, href: "#" },
              ].map((item, i) => (
                <motion.a
                  key={i}
                  href={item.href}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="text-2xl text-[#E3D6C6] hover:text-[#C46A47] transition-colors bg-[#2E1C14] hover:bg-white/5 p-2 rounded-lg"
                >
                  {item.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#6B3F2A]/30 mt-16 pt-8 text-center text-sm text-[#6F5A4A]">
          <p>
            &copy; {new Date().getFullYear()} The Chai Company. All rights reserved.
          </p>
        </div>

        {/* Back to Top Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute right-6 bottom-10"
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-12 h-12 rounded-full bg-[#C46A47] text-white flex items-center justify-center shadow-xl hover:bg-[#A65638] transition-all group"
          >
            <span className="group-hover:-translate-y-1 transition-transform">↑</span>
          </button>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
