"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const MaintenanceScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#5c0d40] p-6 text-center text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center max-w-2xl w-full bg-black/20 backdrop-blur-sm border border-white/10 p-8 rounded-[2rem] shadow-2xl"
      >
        {/* Logo with Halo Effect */}
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#ff9824]/20 blur-2xl rounded-full scale-110" />
            <div className="relative z-10 w-24 h-24 md:w-32 md:h-32">
                <Image
                src="/butter-paper1.webp"
                alt="Cafe Little Karachi Logo"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                priority
                />
            </div>
        </div>

        <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-6 text-[#ff9824]"
        >
          Closed for Renovations
        </motion.h1>

        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 text-white/90 font-medium text-lg md:text-xl leading-relaxed"
        >
          <p>
            Cafe Little Karachi will remain closed for renovations from{" "}
            <span className="text-[#ff9824] font-bold">9 February 2026</span> and
            will reopen after <span className="text-[#ff9824] font-bold">Eid Ul Fitr</span>.
          </p>
          <p className="text-white/60 text-base mt-4">
            Sorry for the inconvenience.
          </p>
        </motion.div>


      </motion.div>
    </div>
  );
};

export default MaintenanceScreen;
