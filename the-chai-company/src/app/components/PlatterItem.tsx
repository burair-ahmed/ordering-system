/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

"use client";

import { FC, useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { PlatterItemModal } from "./PlatterItemModal";
import { X, Check } from "lucide-react";

interface CategoryOption {
  uuid: string;
  name: string;
  title: string;
  price: number;
}

interface Category {
  categoryName: string;
  options: CategoryOption[];
}

interface AdditionalChoice {
  heading: string;
  options: CategoryOption[];
}

interface PlatterItemProps {
  platter: {
    id: string;
    title: string;
    description: string;
    basePrice: number;
    image: string;
    categories: Category[];
    additionalChoices: AdditionalChoice[];
    status: "in stock" | "out of stock";
  };
}

const PlatterItem: FC<PlatterItemProps> = ({ platter }) => {
  const [showModal, setShowModal] = useState(false);
  const handleItemAdded = () => {
    // This is handled inside the modal now
  };

  return (
    <>
      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.02, translateY: -8 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowModal(true)}
        className="relative flex flex-col p-4 rounded-[24px] cursor-pointer 
        bg-white border border-[#E3D6C6]/60 shadow-[0_10px_30px_-10px_rgba(107,63,42,0.05)]
        hover:shadow-[0_40px_80px_-20px_rgba(196,106,71,0.15)] hover:border-[#C46A47]/40 transition-all duration-500 group overflow-hidden h-full"
      >
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C46A47]/5 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-[#C46A47]/10 transition-colors" />

        {/* Out of stock badge */}
        {platter.status === "out of stock" && (
          <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md text-white text-[10px] uppercase font-bold px-4 py-1.5 rounded-full shadow-lg border border-white/10">
            Sold Out
          </div>
        )}

        {/* Image Container */}
        <div className="relative overflow-hidden rounded-[20px] mb-6 aspect-[4/3] w-full shrink-0">
          <Image
            src={platter.image || "/fallback-image.jpg"}
            alt={platter.title}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000 ease-out"
            width={450}
            height={340}
            unoptimized={true}
          />
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Title & Badge */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-lg md:text-2xl font-bold text-[#6B3F2A] leading-[1.1] group-hover:text-[#C46A47] transition-colors line-clamp-2">
            {platter.title}
          </h3>
          <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#FAF3E6] flex items-center justify-center text-[#C46A47] group-hover:bg-[#C46A47] group-hover:text-white transition-all shadow-sm">
            <Check size={14} className="md:w-[16px] md:h-[16px]" />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-[#6F5A4A]/80 line-clamp-2 mb-2 leading-relaxed font-light">
          {platter.description}
        </p>

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs text-[#C46A47] font-bold uppercase tracking-widest block mb-0.5 opacity-60">Price</span>
            <p className="font-black text-xl md:text-2xl text-[#C46A47] flex items-baseline gap-1">
              <span className="text-xs md:text-sm font-bold">Rs.</span>
              {(platter.basePrice || (platter as any).price || 0).toFixed(0)}
            </p>
          </div>
          
          <div className="px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl bg-[#FAF3E6] text-[#6B3F2A] font-bold text-[10px] md:text-xs uppercase tracking-tighter group-hover:bg-[#C46A47] group-hover:text-white transition-all">
            Customize
          </div>
        </div>
      </motion.div>

      <PlatterItemModal 
        platter={platter} 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
};

export default PlatterItem;
