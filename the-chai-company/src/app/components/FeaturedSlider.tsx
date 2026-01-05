"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import MenuItem from "./MenuItem"; // Assuming reuse of existing card or create a variant
import PlatterItem from "./PlatterItem";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FeaturedSliderProps {
  items: any[];
}

const FeaturedSlider = ({ items }: FeaturedSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!items || items.length === 0) return null;

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-[#6B3F2A] border-b-4 border-[#FF8C00] pb-2 inline-block">
          Featured Products
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full border border-[#6B3F2A] transition-colors ${
              !canScrollLeft
                ? "opacity-30 cursor-not-allowed text-gray-400"
                : "text-[#6B3F2A] hover:bg-[#6B3F2A] hover:text-white"
            }`}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`p-2 rounded-full border border-[#6B3F2A] transition-colors ${
              !canScrollRight
                ? "opacity-30 cursor-not-allowed text-gray-400"
                : "text-[#6B3F2A] hover:bg-[#6B3F2A] hover:text-white"
            }`}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            className="flex-shrink-0 w-[280px] md:w-[320px] snap-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
              {/* Check if it's a platter or menu item based on properties unique to each, or pass a type flag */}
               {/* Simplified logic: if basePrice exists, it's a platter */}
              {item.basePrice !== undefined ? (
                  <PlatterItem platter={item} />
              ) : (
                  <MenuItem item={item} />
              )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedSlider;
