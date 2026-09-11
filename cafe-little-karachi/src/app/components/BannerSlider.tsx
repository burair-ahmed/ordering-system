'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ---------- Shared type (also imported by AdminPageBuilder) ----------
export interface BannerSlide {
  id: string;
  image: string;
  mobileImage?: string;
  imageOnly?: boolean;       // when true: pure image, no overlay or text at all
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  overlayOpacity?: number;
  textColor?: 'white' | 'black';
  align?: 'left' | 'center' | 'right';
}

interface BannerSliderSection {
  props: {
    slides?: BannerSlide[];
    autoPlay?: boolean;
    autoPlayInterval?: number;
    showArrows?: boolean;
    showDots?: boolean;
    marginX?: number;
    marginTop?: number;
    borderRadius?: number;
  };
}

export default function BannerSlider({ section }: { section: BannerSliderSection }) {
  const {
    slides = [],
    autoPlay = true,
    autoPlayInterval = 4000,
    showArrows = true,
    showDots = true,
    marginX = 16,
    marginTop = 12,
    borderRadius = 20,
  } = section.props;

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Touch swipe support
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const count = slides.length;

  useEffect(() => { setIsMounted(true); }, []);

  const goTo = useCallback(
    (idx: number) => setCurrent(((idx % count) + count) % count),
    [count]
  );
  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || isPaused || count <= 1) return;
    timerRef.current = setInterval(next, autoPlayInterval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoPlay, isPaused, count, next, autoPlayInterval]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev();
    }
  };

  const getAlignClass = (align?: string) => {
    if (align === 'left') return 'items-start text-left';
    if (align === 'right') return 'items-end text-right';
    return 'items-center text-center';
  };

  const getTextColorClass = (color?: string) =>
    color === 'black' ? 'text-neutral-900' : 'text-white';

  // Don't render until client-side to avoid hydration mismatch
  if (!isMounted || !count) return null;

  return (
    <div
      className="relative select-none"
      style={{ margin: `${marginTop}px ${marginX}px 0` }}
    >
      <div
        className="relative overflow-hidden w-full shadow-xl"
        style={{ borderRadius: `${borderRadius}px` }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Slides track ── */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((s) => (
            <div
              key={s.id}
              className="relative w-full flex-shrink-0"
              style={{ aspectRatio: '21 / 8' }}
            >
              {/* Desktop image */}
              <img
                src={s.image || '/bg-hero.webp'}
                alt={s.title || 'Promotion Banner'}
                className="absolute inset-0 w-full h-full object-cover hidden md:block"
                draggable={false}
              />
              {/* Mobile image */}
              <img
                src={s.mobileImage || s.image || '/bg-hero.webp'}
                alt={s.title || 'Promotion Banner'}
                className="absolute inset-0 w-full h-full object-cover md:hidden"
                draggable={false}
              />

              {/* Dark overlay + text — skipped when imageOnly is true */}
              {!s.imageOnly && (s.title || s.subtitle || s.ctaText) && (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `rgba(0,0,0,${s.overlayOpacity ?? 0.38})`,
                    }}
                  />
                  <div
                    className={`absolute inset-0 flex flex-col justify-end pb-8 px-5 sm:pb-10 sm:px-10 ${getAlignClass(s.align)} ${getTextColorClass(s.textColor)}`}
                  >
                    {s.title && (
                      <h2 className="text-xl sm:text-3xl md:text-4xl font-black leading-tight drop-shadow-lg mb-1 font-poppins">
                        {s.title}
                      </h2>
                    )}
                    {s.subtitle && (
                      <p className="text-sm sm:text-base opacity-90 mb-3 drop-shadow max-w-xl">
                        {s.subtitle}
                      </p>
                    )}
                    {s.ctaText && s.ctaLink && (
                      <Link
                        href={s.ctaLink}
                        className="inline-flex items-center gap-2 bg-[#741052] hover:bg-[#5c0d40] text-white font-bold py-2.5 px-6 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 text-sm w-fit mt-1"
                      >
                        {s.ctaText}
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── Arrow buttons (inside slider) ── */}
        {showArrows && count > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md"
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md"
              aria-label="Next slide"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </>
        )}

        {/* ── Dot navigation pill (inside slider at bottom center) ── */}
        {showDots && count > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/35 backdrop-blur-sm rounded-full px-3 py-[7px]">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? 'w-5 h-2 bg-white shadow-sm'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
