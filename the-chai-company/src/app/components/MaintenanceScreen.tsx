"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const MaintenanceScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF3E6] p-6 text-center text-[#6B3F2A]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center max-w-2xl w-full bg-white/40 backdrop-blur-sm border border-[#C46A47]/20 p-8 rounded-[2rem] shadow-2xl"
      >
        {/* Logo with Halo Effect */}
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#C46A47]/20 blur-2xl rounded-full scale-110" />
            <div className="relative z-10 w-24 h-24 md:w-32 md:h-32">
                <Image
                src="/logo.webp"
                alt="The Chai Company Logo"
                fill
                className="object-contain drop-shadow-xl"
                priority
                />
            </div>
        </div>

        <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-6 text-[#C46A47]"
        >
          Closed for Renovations
        </motion.h1>

        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 text-[#6B3F2A]/90 font-medium text-lg md:text-xl leading-relaxed"
        >
          <p>
            The Chai Company will remain closed for renovations from{" "}
            <span className="text-[#C46A47] font-bold">9 February 2026</span> and
            will reopen after <span className="text-[#C46A47] font-bold">Eid Ul Fitr</span>.
          </p>
          <p className="text-[#6B3F2A]/60 text-base mt-4">
            Sorry for the inconvenience.
          </p>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default MaintenanceScreen;
