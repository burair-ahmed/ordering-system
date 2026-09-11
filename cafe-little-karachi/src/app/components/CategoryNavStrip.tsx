'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { slugify } from '../lib/slugify';

export interface CategoryItem {
  id: string;
  name: string;
  isPlatter?: boolean;
}

interface CategoryNavStripProps {
  categories: CategoryItem[];
  className?: string;
}

export default function CategoryNavStrip({ categories, className = '' }: CategoryNavStripProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || '');
  const isClickingRef = useRef(false);

  // Check scroll position to enable/disable arrow buttons
  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);

    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability, categories]);

  // Scroll left / right by 260px when circular arrows are clicked
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Scroll to section when a category label is clicked
  const handleCategoryClick = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    isClickingRef.current = true;

    // Try finding by explicit category anchor id
    const targetElement =
      document.getElementById(`category-${categoryId}`) ||
      document.getElementById(`category-${slugify(categoryId)}`) ||
      document.getElementById(categoryId);

    if (targetElement) {
      const navHeight = 85;
      const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = Math.max(0, elementPosition - navHeight);

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }

    // Scroll active item inside strip into view if needed
    const activeBtn = document.getElementById(`nav-cat-btn-${categoryId}`);
    if (activeBtn && scrollContainerRef.current) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    // Release clicking flag after animation completes
    setTimeout(() => {
      isClickingRef.current = false;
    }, 800);
  };

  // Scroll-spy: Highlight active category based on viewport position
  useEffect(() => {
    if (!categories.length) return;

    const handleWindowScroll = () => {
      if (isClickingRef.current) return;

      const triggerPoint = 160;
      let currentId = categories[0]?.id || '';

      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const targetElement =
          document.getElementById(`category-${cat.id}`) ||
          document.getElementById(`category-${slugify(cat.id)}`) ||
          document.getElementById(cat.id);

        if (targetElement) {
          const rect = targetElement.getBoundingClientRect();
          if (rect.top <= triggerPoint) {
            currentId = cat.id;
          }
        }
      }

      if (currentId && currentId !== activeCategoryId) {
        setActiveCategoryId(currentId);
        // Gently bring active pill into view in the horizontal strip
        const activeBtn = document.getElementById(`nav-cat-btn-${currentId}`);
        if (activeBtn && scrollContainerRef.current) {
          activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    // Initial check
    handleWindowScroll();

    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [categories, activeCategoryId]);

  if (!categories || categories.length === 0) return null;

  return (
    <nav
      aria-label="Category Navigation"
      className={`sticky top-0 z-30 w-full px-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14 py-2 sm:py-2.5 transition-all duration-300 backdrop-blur-md bg-white/80 dark:bg-black/80 ${className}`}
    >
      {/* 
        Strip Container:
        - Full-width container aligned with header gutters (px-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14)
        - Soft light purple / lavender tint matching site's pink-purple theme: bg-[#f6eff7] / dark:bg-[#250a20]
        - Subtle rounded/soft edge: rounded-2xl
        - Subtle purple border: border-[#741052]/15 / dark:border-[#d0269b]/25
        - Soft ambient shadow
      */}
      <div className="relative group w-full bg-[#f6eff7] dark:bg-[#250a20] border border-[#741052]/15 dark:border-[#d0269b]/25 rounded-2xl shadow-[0_2px_14px_rgba(116,16,82,0.06)] overflow-hidden">
        
        {/* Left Circular Arrow Button (Fixed on Left End with Lavender Gradient Mask) */}
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pl-1 sm:pl-2 pr-4 bg-gradient-to-r from-[#f6eff7] via-[#f6eff7]/95 to-transparent dark:from-[#250a20] dark:via-[#250a20]/95 pointer-events-none">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll categories left"
            className={`pointer-events-auto w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-neutral-900 border border-[#741052]/25 dark:border-[#d0269b]/40 shadow-md flex items-center justify-center text-[#741052] dark:text-[#d0269b] transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-[#faf4fa] dark:hover:bg-neutral-800 ${
              !canScrollLeft ? 'opacity-25 cursor-not-allowed scale-95' : 'cursor-pointer hover:shadow-lg'
            }`}
          >
            <ChevronLeft size={18} strokeWidth={2.5} className="text-[#741052] dark:text-[#d0269b]" />
          </button>
        </div>

        {/* Right Circular Arrow Button (Fixed on Right End with Lavender Gradient Mask) */}
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pr-1 sm:pr-2 pl-4 bg-gradient-to-l from-[#f6eff7] via-[#f6eff7]/95 to-transparent dark:from-[#250a20] dark:via-[#250a20]/95 pointer-events-none">
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll categories right"
            className={`pointer-events-auto w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-neutral-900 border border-[#741052]/25 dark:border-[#d0269b]/40 shadow-md flex items-center justify-center text-[#741052] dark:text-[#d0269b] transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-[#faf4fa] dark:hover:bg-neutral-800 ${
              !canScrollRight ? 'opacity-25 cursor-not-allowed scale-95' : 'cursor-pointer hover:shadow-lg'
            }`}
          >
            <ChevronRight size={18} strokeWidth={2.5} className="text-[#741052] dark:text-[#d0269b]" />
          </button>
        </div>

        {/* Horizontally Scrollable Category Items Strip (Zero Scrollbar) */}
        <div
          ref={scrollContainerRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="flex items-center gap-2 sm:gap-3 md:gap-4 overflow-x-auto py-2.5 px-10 sm:px-12 scroll-smooth select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:[display:none]"
        >
          {categories.map((category) => {
            const isActive = activeCategoryId === category.id;
            return (
              <button
                key={category.id}
                id={`nav-cat-btn-${category.id}`}
                type="button"
                onClick={() => handleCategoryClick(category.id)}
                className={`relative shrink-0 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm md:text-sm font-bold tracking-tight transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#741052] text-white shadow-md shadow-[#741052]/25 scale-[1.02]'
                    : 'text-[#330523] dark:text-neutral-200 hover:text-[#741052] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
