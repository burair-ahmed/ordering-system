'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useRotatingPlaceholderDishes, type CatalogItemLike } from '../hooks/useRotatingPlaceholderDishes';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  catalogItems?: CatalogItemLike[];
  platters?: CatalogItemLike[];
  dishesList?: string[];
  placeholderPrefix?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  className = '',
  catalogItems,
  platters,
  dishesList: customDishesList,
  placeholderPrefix = 'Search for ',
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const typingSpeed = 45; // ms per character typed
    const deletingSpeed = 25; // ms per character deleted
    const holdFullTextDuration = 2100; // ms to pause at complete name
    const holdEmptyDuration = 320; // ms to pause before typing next name

    if (!isDeleting) {
      // TYPING STATE
      if (displayedText.length < currentTargetDish.length) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(currentTargetDish.slice(0, displayedText.length + 1));
        }, typingSpeed);
      } else {
        // Finished typing full dish name -> hold, then start deleting
        timerRef.current = setTimeout(() => {
          setIsDeleting(true);
        }, holdFullTextDuration);
      }
    } else {
      // DELETING STATE
      if (displayedText.length > 0) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(currentTargetDish.slice(0, displayedText.length - 1));
        }, deletingSpeed);
      } else {
        // Finished deleting -> move to next dish in list
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
      if (onSearch) {
        onSearch(value);
      }
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

  const isExpanded = isFocused || value.length > 0;
  const showPlaceholder = value.length === 0;

  return (
    <div className={`w-full flex justify-center items-center px-3 sm:px-6 my-2 sm:my-3 ${className}`}>
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
    </div>
  );
}
