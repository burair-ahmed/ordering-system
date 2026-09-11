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
    showArrowsMobile?: boolean;
    showDots?: boolean;

    // Desktop styling
    marginX?: number;
    marginTop?: number;
    borderRadius?: number;
    aspectRatio?: string;

    // Mobile specific styling
    mobileMarginX?: number;
    mobileMarginTop?: number;
    mobileBorderRadius?: number;
    mobileAspectRatio?: string;
  };
}

export default function BannerSlider({ section }: { section: BannerSliderSection }) {
  const {
    slides = [],
    autoPlay = true,
    autoPlayInterval = 4000,
    showArrows = true,
    showArrowsMobile = true,
    showDots = true,
    marginX = 16,
    marginTop = 12,
    borderRadius = 20,
    aspectRatio = '21/8',
    mobileMarginX = 8,
    mobileMarginTop = 6,
    mobileBorderRadius = 14,
    mobileAspectRatio = '16/9',
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

  // Format aspect ratio correctly for CSS
  const formatAspect = (val: string) => {
    if (!val) return '21/8';
    return val.includes('/') ? val.replace('/', ' / ') : val;
  };

  // Don't render until client-side to avoid hydration mismatch
  if (!isMounted || !count) return null;

  return (
    <div
      className="relative select-none banner-slider-root"
      style={{
        ['--m-top' as any]: `${mobileMarginTop}px`,
        ['--m-x' as any]: `${mobileMarginX}px`,
        ['--d-top' as any]: `${marginTop}px`,
        ['--d-x' as any]: `${marginX}px`,
        ['--m-rad' as any]: `${mobileBorderRadius}px`,
        ['--d-rad' as any]: `${borderRadius}px`,
        ['--m-asp' as any]: formatAspect(mobileAspectRatio),
        ['--d-asp' as any]: formatAspect(aspectRatio),
      }}
    >
      <style jsx>{`
        .banner-slider-root {
          margin: var(--m-top) var(--m-x) 0;
        }
        .banner-slider-frame {
          border-radius: var(--m-rad);
        }
        .banner-slide-box {
          aspect-ratio: var(--m-asp);
        }
        @media (min-width: 768px) {
          .banner-slider-root {
            margin: var(--d-top) var(--d-x) 0;
          }
          .banner-slider-frame {
            border-radius: var(--d-rad);
          }
          .banner-slide-box {
            aspect-ratio: var(--d-asp);
          }
        }
      `}</style>

      <div
        className="banner-slider-frame relative overflow-hidden w-full shadow-xl"
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
              className="banner-slide-box relative w-full flex-shrink-0"
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
                    className={`absolute inset-0 flex flex-col justify-end pb-4 px-3 sm:pb-8 sm:px-6 md:pb-10 md:px-10 ${getAlignClass(s.align)} ${getTextColorClass(s.textColor)}`}
                  >
                    {s.title && (
                      <h2 className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight drop-shadow-lg mb-0.5 sm:mb-1 font-poppins">
                        {s.title}
                      </h2>
                    )}
                    {s.subtitle && (
                      <p className="text-[10px] sm:text-sm md:text-base opacity-90 mb-1.5 sm:mb-3 drop-shadow max-w-xl line-clamp-2 sm:line-clamp-none">
                        {s.subtitle}
                      </p>
                    )}
                    {s.ctaText && s.ctaLink && (
                      <Link
                        href={s.ctaLink}
                        className="inline-flex items-center gap-1 sm:gap-2 bg-[#741052] hover:bg-[#5c0d40] text-white font-bold py-1 px-3 sm:py-2.5 sm:px-6 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 text-[10px] sm:text-sm w-fit mt-0.5 sm:mt-1"
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

        {/* ── Arrow buttons (inside slider, scaled cleanly for mobile) ── */}
        {showArrows && count > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className={`absolute left-1.5 sm:left-2.5 md:left-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-md ${showArrowsMobile === false ? 'hidden md:flex' : 'flex'
                }`}
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" strokeWidth={2.5} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className={`absolute right-1.5 sm:right-2.5 md:right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-md ${showArrowsMobile === false ? 'hidden md:flex' : 'flex'
                }`}
              aria-label="Next slide"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" strokeWidth={2.5} />
            </button>
          </>
        )}

        {/* ── Carousel Navigation Indicators (Perfect half: 2-2.5px height & circles, elongated 28-36px active pill) ── */}
        {showDots && count > 1 && (
          <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 bg-black/35 backdrop-blur-md border border-white/10 rounded-full px-2 sm:px-2.5 py-[2px] sm:py-[3px] shadow-lg">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`relative transition-all duration-300 ease-out rounded-full cursor-pointer before:content-[''] before:absolute before:-inset-2 before:rounded-full ${i === current
                  ? 'w-5 sm:w-8 md:w-9 h-[1.5px] sm:h-[2.5px] bg-white shadow-md'
                  : 'w-[1px] sm:w-[2px] h-[1px] sm:h-[2px] bg-white/45 hover:bg-white/75'
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
