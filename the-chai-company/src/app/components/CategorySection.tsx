"use client";

import { motion, AnimatePresence } from "framer-motion";
import MenuItem from "./MenuItem";
import PlatterItem from "./PlatterItem";
import { useRef, useState, useEffect } from "react";
import SkeletonLoader from "./SkeletonLoader";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategorySectionProps {
  title: string;
  items: any[];
  layout: "grid-2" | "grid-3" | "grid-4" | "slider";
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isPlatter?: boolean; // Type guard helper if needed
}

const CategorySection = ({
  title,
  items,
  layout,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  isPlatter = false,
}: CategorySectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Scroll check logic for slider layout
  const checkScroll = () => {
    if (layout === "slider" && scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    if (layout === "slider") {
      checkScroll();
      window.addEventListener("resize", checkScroll);
      return () => window.removeEventListener("resize", checkScroll);
    }
  }, [layout, items]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Intersection Observer for Infinite Scroll in Grid Layouts
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = (node: HTMLDivElement | null) => {
    if (isLoading || !hasMore || layout === "slider") return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && onLoadMore) {
        onLoadMore();
      }
    });
    
    if (node) observerRef.current.observe(node);
  };

  return (
    <div className="mt-12 mb-8">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-[#6B3F2A] to-[#A65638] shadow-[0_8px_25px_rgba(107,63,42,0.2)] py-3 px-8 rounded-2xl tracking-tight">
          {title}
        </h2>
        
        {/* Slider Controls */}
        {layout === "slider" && (
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
              <ChevronLeft size={20} />
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
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {layout === "slider" ? (
          // Slider Layout
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:px-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item, index) => (
               <motion.div
                key={`${title}-slider-${item.id}-${index}`}
                className="flex-shrink-0 w-[280px] snap-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                 {isPlatter ? <PlatterItem platter={item} /> : <MenuItem item={item} />}
              </motion.div>
            ))}
             {isLoading && [...Array(3)].map((_, i) => (
                <div key={`skeleton-${i}`} className="flex-shrink-0 w-[280px]">
                   <SkeletonLoader />
                </div>
             ))}
          </div>
        ) : (
          // Grid Layouts
          <div className={`grid gap-5 
            ${layout === 'grid-2' ? 'grid-cols-2 lg:grid-cols-3' : ''}
            ${layout === 'grid-3' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3' : ''}
            ${layout === 'grid-4' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : ''}
          `}>
             <AnimatePresence>
              {items.map((item, index) => {
                 const isLast = index === items.length - 1;
                 return (
                  <motion.div
                    ref={isLast ? lastItemRef : null}
                    key={`${title}-grid-${item.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    {isPlatter ? <PlatterItem platter={item} /> : <MenuItem item={item} />}
                  </motion.div>
                 );
              })}
             </AnimatePresence>
             
             {/* Loading Skeletons for Grid */}
             {isLoading && items.length === 0 && (
                [...Array(layout === 'grid-4' ? 4 : 3)].map((_, i) => <SkeletonLoader key={i} />)
             )}
             {/* Infinite Scroll Loader */}
             {isLoading && items.length > 0 && (
                <div className="col-span-full py-4 text-center">
                   <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySection;
