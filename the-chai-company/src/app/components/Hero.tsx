'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden bg-[#2E1C14]">
      {/* Background with dynamic parallax-like feel */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/bg-hero.webp"
          alt="Premium Chai Background"
          fill
          className="object-cover object-center scale-105"
          priority
        />
        {/* Layered Overlays for Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#FAF3E6]" />
        <div className="absolute inset-0 bg-[#C46A47]/10 mix-blend-overlay" />
      </motion.div>
      
      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="inline-block text-[#C46A47] text-sm md:text-base font-semibold tracking-[0.4em] uppercase mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            Est. 2024 &bull; Karachi
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold text-white tracking-tight leading-[0.9] drop-shadow-2xl">
            Taste the <br /> 
            <span className="text-[#C46A47]">Heritage</span>
          </h1>
          <p className="mt-8 text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Experience the finest tea architecture where every cup tells a story of tradition, warmth, and perfection.
          </p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="px-8 py-4 rounded-2xl bg-[#C46A47] text-white font-bold text-lg shadow-[0_20px_40px_-10px_rgba(196,106,71,0.5)] hover:bg-[#A65638] transition-all hover:scale-105 active:scale-95">
              Order Now
            </button>
            <button className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all">
              View Menu
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Blur Object */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-[#C46A47]/30 rounded-full blur-[120px] pointer-events-none" />
    </section>
  );
}
  