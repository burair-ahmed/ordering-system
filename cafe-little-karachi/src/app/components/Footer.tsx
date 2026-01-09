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
    <footer className="relative bg-gradient-to-r from-[#741052] to-[#d0269b] text-white py-10 mt-12">
      <div className="container mx-auto max-w-7xl px-6 lg:px-12">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
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
                src="/butter-paper1.webp"
                alt="Logo"
                width={140}
                height={140}
                className="transition-transform duration-300 hover:scale-105 hover:drop-shadow-[0_0_15px_rgba(255,152,36,0.6)]"
              />
            </Link>
            <p className="mt-4 text-sm text-neutral-200 text-center sm:text-left max-w-xs">
              Experience authentic flavors at Little Karachi Express. Dine in, order
              online, and enjoy the taste of tradition.
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
            <h3 className="text-lg font-semibold tracking-wide mb-4">
              Quick Links
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/about"
                className="text-sm font-medium transition-colors duration-300 hover:text-[#ff9824]"
              >
                About Us
              </Link>
              <Link
                href="/menu"
                className="text-sm font-medium transition-colors duration-300 hover:text-[#ff9824]"
              >
                Menu
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium transition-colors duration-300 hover:text-[#ff9824]"
              >
                Contact
              </Link>
              <Link
                href="/terms"
                className="text-sm font-medium transition-colors duration-300 hover:text-[#ff9824]"
              >
                Terms & Conditions
              </Link>
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
            <h3 className="text-lg font-semibold tracking-wide mb-4">
              Follow Us
            </h3>
            <div className="flex gap-6">
              {[
                { icon: <FaFacebook />, href: "#" },
                { icon: <FaInstagram />, href: "#" },
                { icon: <FaTwitter />, href: "#" },
                { icon: <FaLinkedin />, href: "#" },
              ].map((item, i) => (
                <motion.a
                  key={i}
                  href={item.href}
                  whileHover={{ scale: 1.2, color: "#ff9824" }}
                  className="text-2xl transition-colors"
                >
                  {item.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 mt-10 pt-6 text-center text-sm text-neutral-200">
          <p>
            &copy; {new Date().getFullYear()} Little Karachi Express. All rights
            reserved.
          </p>
        </div>

        {/* Back to Top Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute right-6 bottom-6"
        >
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="rounded-full bg-gradient-to-r from-[#741052] to-[#d0269b] text-white px-4 py-2 shadow-lg hover:from-[#d0269b] hover:to-[#741052] transition-all"
          >
            ↑ Top
          </Button>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
