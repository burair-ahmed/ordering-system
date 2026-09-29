'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useRotatingPlaceholderDishes, type CatalogItemLike } from '../hooks/useRotatingPlaceholderDishes';

// ─── Lean result types (only display fields needed in the dropdown) ───────────
export interface SearchResultItem {
  id: string | number;
  title: string;
  price: number;
  image: string;
  status: 'in stock' | 'out of stock';
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  type: 'menu';
}

export interface SearchResultPlatter {
  id: string | number;
  title: string;
  basePrice: number;
  image: string;
  status: 'in stock' | 'out of stock';
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  type: 'platter';
}

export interface SearchResults {
  menuItems: SearchResultItem[];
  platters: SearchResultPlatter[];
  total: number;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  catalogItems?: CatalogItemLike[];
  platters?: CatalogItemLike[];
  dishesList?: string[];
  placeholderPrefix?: string;
  // Dropdown results + open callbacks
  results?: SearchResults;
  onItemOpen?: (id: string | number) => void;
  onPlatterOpen?: (id: string | number) => void;
}

// ─── Price helpers ────────────────────────────────────────────────────────────
function computeDiscountedPrice(original: number, type?: string, value?: number): number | null {
  if (!value || value <= 0) return null;
  if (type === 'percentage') return Math.round(original * (1 - value / 100));
  if (type === 'fixed') return Math.max(0, original - value);
  return null;
}

function formatPrice(n: number) {
  return `Rs ${n.toLocaleString()}`;
}

// ─── Single result row ────────────────────────────────────────────────────────
function ResultRow({
  id,
  title,
  image,
  originalPrice,
  isPlatter,
  discountType,
  discountValue,
  status,
  onOpen,
}: {
  id: string | number;
  title: string;
  image: string;
  originalPrice: number;
  isPlatter: boolean;
  discountType?: string;
  discountValue?: number;
  status: string;
  onOpen: (id: string | number) => void;
}) {
  const discounted = computeDiscountedPrice(originalPrice, discountType, discountValue);
  const isOutOfStock = status === 'out of stock';

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onOpen(id)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#f6eff7] dark:hover:bg-[#741052]/10 transition-colors duration-150 text-left group"
      aria-label={`Open ${title}`}
    >
      {/* Thumbnail */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#f0e4ed] dark:bg-[#1e0a17]">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="56px"
            className={`object-cover transition-transform duration-200 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#741052]/30 dark:text-[#d0269b]/30">
            <Search size={20} />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="text-[9px] font-bold text-white leading-none text-center px-1">SOLD OUT</span>
          </div>
        )}
      </div>

      {/* Text block */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-sm font-semibold text-[#330523] dark:text-neutral-100 truncate leading-snug">
          {title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {discounted ? (
            <>
              <span className="text-xs font-bold text-[#741052] dark:text-[#d0269b]">
                {formatPrice(discounted)}
              </span>
              <span className="text-[10px] text-neutral-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            </>
          ) : (
            <span className="text-xs font-bold text-[#741052] dark:text-[#d0269b]">
              {formatPrice(originalPrice)}{isPlatter ? '+' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Plus button */}
      <div
        aria-hidden="true"
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#741052] dark:bg-[#d0269b] text-white shadow-sm transition-transform duration-150 group-hover:scale-110 group-active:scale-95"
      >
        <Plus size={15} strokeWidth={2.5} />
      </div>
    </button>
  );
}

// ─── Main SearchBar ───────────────────────────────────────────────────────────
export default function SearchBar({
  value,
  onChange,
  onSearch,
  className = '',
  catalogItems,
  platters,
  dishesList: customDishesList,
  placeholderPrefix = 'Search for ',
  results,
  onItemOpen,
  onPlatterOpen,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Wraps both pill AND dropdown for click-outside detection
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive dynamic list of representative dishes (or use custom admin configured list)
  const dynamicDishes = useRotatingPlaceholderDishes(catalogItems, platters);
  const dishes =
    customDishesList && customDishesList.length > 0
      ? customDishesList
      : dynamicDishes;

  // Rotating placeholder state (typewriter / type-and-delete effect)
  const [currentDishIndex, setCurrentDishIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Timeouts ref to ensure zero memory leaks on unmount
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Type-and-delete animation effect
  useEffect(() => {
    // Keep animation running whenever input is empty (even when focused)
    // Only stop when user has typed search text or list is empty
    if (value.length > 0 || dishes.length === 0) {
      clearTimer();
      return;
    }

    const currentTargetDish = dishes[currentDishIndex] || dishes[0] || 'Chicken White Biryani';
    const typingSpeed = 45;
    const deletingSpeed = 25;
    const holdFullTextDuration = 2100;
    const holdEmptyDuration = 320;

    if (!isDeleting) {
      if (displayedText.length < currentTargetDish.length) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(currentTargetDish.slice(0, displayedText.length + 1));
        }, typingSpeed);
      } else {
        timerRef.current = setTimeout(() => {
          setIsDeleting(true);
        }, holdFullTextDuration);
      }
    } else {
      if (displayedText.length > 0) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(currentTargetDish.slice(0, displayedText.length - 1));
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setCurrentDishIndex((prev) => (prev + 1) % dishes.length);
        timerRef.current = setTimeout(() => {}, holdEmptyDuration);
      }
    }

    return () => clearTimer();
  }, [displayedText, isDeleting, currentDishIndex, dishes, value, clearTimer]);

  // Clean up all timers on component unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Click-outside → clear query (closes dropdown)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (value.length > 0) {
          onChange('');
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value, onChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (onSearch) onSearch('');
    inputRef.current?.focus();
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSearch) onSearch(value);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      if (value) {
        onChange('');
        if (onSearch) onSearch('');
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const handleSearchButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFocused && !value) {
      inputRef.current?.focus();
    } else if (onSearch) {
      onSearch(value);
    }
  };

  const handleItemOpen = useCallback((id: string | number) => {
    if (onItemOpen) onItemOpen(id);
    onChange('');
  }, [onItemOpen, onChange]);

  const handlePlatterOpen = useCallback((id: string | number) => {
    if (onPlatterOpen) onPlatterOpen(id);
    onChange('');
  }, [onPlatterOpen, onChange]);

  const isExpanded = isFocused || value.length > 0;
  const showPlaceholder = value.length === 0;
  const showDropdown =
    !!(results && value.length > 0);

  const totalResults = results?.total ?? 0;
  const hasResults = totalResults > 0;

  return (
    /*
     * containerRef wraps both the pill AND the absolute dropdown,
     * so mousedown inside the dropdown does NOT trigger click-outside dismissal.
     */
    <div ref={containerRef} className={`w-full flex justify-center items-center px-3 sm:px-6 my-2 sm:my-3 ${className}`}>
      <div className="relative w-full flex justify-center">
        {/*
          Pill Shell with 100% Smooth Glitch-Free Width Transition:
          - Completely borderless (no grey border lines)
          - Both states use w-full with explicit max-w-[...]
          - Smooth CSS max-width interpolation ensures 0% glitch on focus & blur
        */}
        <div
          onClick={handleContainerClick}
          className={`relative flex items-center h-11 sm:h-12 rounded-full cursor-text w-full transition-[max-width,box-shadow,ring-color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] bg-[#f6eff7] dark:bg-[#250a20] ${
            isExpanded
              ? 'max-w-[560px] sm:max-w-[620px] ring-2 ring-[#741052] dark:ring-[#d0269b] shadow-[0_4px_24px_rgba(116,16,82,0.14)]'
              : 'max-w-[280px] sm:max-w-[320px] shadow-[0_2px_12px_rgba(116,16,82,0.06)] hover:shadow-[0_4px_16px_rgba(116,16,82,0.10)]'
          }`}
        >
          {/* Left Search Icon */}
          <div className="flex items-center justify-center pl-3.5 sm:pl-4 text-[#741052]/75 dark:text-[#d0269b]/85 shrink-0 pointer-events-none">
            <Search size={17} strokeWidth={2.5} />
          </div>

          {/* Real Input Field */}
          <div className="relative flex-1 h-full flex items-center mx-2 overflow-hidden">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              aria-label="Search menu items and platters"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
              autoComplete="off"
              className="w-full h-full bg-transparent outline-none border-0 ring-0 text-sm sm:text-base font-medium text-[#330523] dark:text-neutral-100 placeholder-transparent z-10 select-text"
            />

            {/*
              Animated Rotating Typewriter Placeholder:
              - Absolutely positioned overlay matching input typography exactly
              - pointer-events: none so clicks & typing go directly to input
              - Stays visible when focused as long as input is empty
              - Hides cleanly as soon as user types anything
            */}
            {showPlaceholder && (
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 flex items-center pointer-events-none select-none text-xs sm:text-sm font-medium text-[#741052]/60 dark:text-neutral-400 overflow-hidden text-ellipsis whitespace-nowrap z-0"
              >
                <span className="opacity-90 mr-1.5">{placeholderPrefix.trim()}</span>
                <span className="font-semibold text-[#741052] dark:text-[#d0269b] tracking-tight">
                  {displayedText}
                </span>
                {/* Subtle typing cursor */}
                <span className="inline-block w-[1.5px] h-3.5 bg-[#741052]/70 dark:bg-[#d0269b] ml-[1px] animate-pulse" />
                <span className="opacity-80">...</span>
              </div>
            )}
          </div>

          {/* Clear (X) Button */}
          {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search query"
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors duration-150 rounded-full hover:bg-black/5 dark:hover:bg-white/10 shrink-0 mr-1"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}

          {/* Circular Docked Theme Action Button */}
          <button
            type="button"
            onClick={handleSearchButtonClick}
            aria-label="Submit search"
            className="w-8 h-8 sm:w-9 sm:h-9 mr-1 sm:mr-1.5 rounded-full bg-[#741052] dark:bg-[#d0269b] text-white shadow-sm flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95 hover:shadow-md"
          >
            <Search size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Floating Search Results Dropdown ─────────────────────────── */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              key="search-dropdown"
              role="listbox"
              aria-label="Search results"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-[calc(100%+8px)] left-0 right-0 mx-auto w-full max-w-[560px] sm:max-w-[620px] z-50 bg-white dark:bg-[#1a0812] rounded-2xl shadow-[0_8px_40px_rgba(116,16,82,0.18)] ring-1 ring-[#741052]/10 dark:ring-[#d0269b]/15 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#741052]/8 dark:border-[#d0269b]/10">
                <span className="text-xs font-semibold text-[#741052]/70 dark:text-[#d0269b]/70">
                  {hasResults
                    ? `${totalResults} result${totalResults === 1 ? '' : 's'} for "${value}"`
                    : `No results for "${value}"`}
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[10px] font-bold text-[#741052]/60 dark:text-[#d0269b]/60 hover:text-[#741052] dark:hover:text-[#d0269b] transition-colors flex items-center gap-1"
                  aria-label="Clear search"
                >
                  Clear <X size={11} />
                </button>
              </div>

              {/* Result list */}
              {hasResults ? (
                <div className="overflow-y-auto max-h-[420px] py-2 px-2 space-y-0.5 scrollbar-hide">
                  {/* Platters first */}
                  {(results?.platters ?? []).map((platter) => (
                    <ResultRow
                      key={`drop-platter-${platter.id}`}
                      id={platter.id}
                      title={platter.title}
                      image={platter.image}
                      originalPrice={platter.basePrice}
                      isPlatter
                      discountType={platter.discountType}
                      discountValue={platter.discountValue}
                      status={platter.status}
                      onOpen={handlePlatterOpen}
                    />
                  ))}
                  {/* Menu items */}
                  {(results?.menuItems ?? []).map((item) => (
                    <ResultRow
                      key={`drop-item-${item.id}`}
                      id={item.id}
                      title={item.title}
                      image={item.image}
                      originalPrice={item.price}
                      isPlatter={false}
                      discountType={item.discountType}
                      discountValue={item.discountValue}
                      status={item.status}
                      onOpen={handleItemOpen}
                    />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-11 h-11 rounded-full bg-[#741052]/8 dark:bg-[#d0269b]/15 flex items-center justify-center text-[#741052]/50 dark:text-[#d0269b]/60 mb-3">
                    <Search size={20} strokeWidth={2} />
                  </div>
                  <p className="text-sm font-semibold text-[#330523] dark:text-neutral-200">
                    Nothing found
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-[240px]">
                    Try "Biryani", "Karahi", "Roll", "Pizza", or "Platter"
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
