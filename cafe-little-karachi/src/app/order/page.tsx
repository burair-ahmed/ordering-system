/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MenuItem from "../components/MenuItem";
import PlatterItem from "../components/PlatterItem";
import Hero from "../components/Hero";
import SkeletonLoader from "../components/SkeletonLoader";
import { Star, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { trackEvent, trackClarityFunnelStep, CLK_FUNNEL_MENU_VIEWED } from "../lib/analytics";

// --- Types ---
interface MenuItemData {
  id: string | number;
  title: string;
  description: string;
  price: number;
  image: string;
  variations: { name: string; price: string | number }[];
  category: string;
  status: "in stock" | "out of stock";
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  isVisible?: boolean;
}

interface Platter {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  image: string;
  platterCategory: string;
  status: "in stock" | "out of stock";
  categories: {
    categoryName: string;
    options: { uuid?: string; name: string; title?: string; price?: number }[];
    selectionType?: 'category' | 'items';
    itemIds?: string[];
  }[];
  additionalChoices: {
    heading: string;
    options: { uuid: string; name: string; title?: string; price: number }[];
  }[];
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  isVisible?: boolean;
}

interface PageSection {
  id: string;
  type: 'hero' | 'banner' | 'rich-content' | 'divider' | 'testimonials' | 'slider' | 'grid';
  title: string;
  isVisible: boolean;
  props: {
    sourceType?: 'category' | 'manual';
    itemType?: 'menu' | 'platter';
    categoryId?: string;
    itemIds?: string[];
    
    // Grid/Slider specific
    columns?: 2 | 3 | 4;
    cardStyle?: 'minimal' | 'compact' | 'gourmet' | 'list';
    bgColor?: 'default' | 'grey' | 'light-fuchsia' | 'dark-fuchsia';
    spacingY?: 'small' | 'medium' | 'large';

    // Hero specific
    subtitle?: string;
    backgroundImage?: string;
    mobileBackgroundImage?: string;
    overlayOpacity?: number;
    ctaText?: string;
    ctaAction?: 'scroll' | 'link';
    ctaLink?: string;
    align?: 'left' | 'center' | 'right';
    textColor?: 'white' | 'black' | 'fuchsia';
    displayMode?: 'overlay' | 'direct';
    bannerSize?: 'small' | 'medium' | 'large' | 'freesize';
    showText?: boolean;

    // Promo banner specific
    bannerBg?: string;
    bannerTextColor?: string;
    hasCountdown?: boolean;
    countdownEnd?: string;

    // Rich content specific
    description?: string;
    image?: string;
    mediaAlign?: 'left' | 'right';

    // Divider specific
    dividerHeight?: 'small' | 'medium' | 'large';
    dividerStyle?: 'none' | 'solid' | 'dashed' | 'gold-border' | 'fuchsia-line';

    // Testimonials specific
    testimonials?: Array<{
      id: string;
      name: string;
      rating: number;
      comment: string;
      avatar?: string;
    }>;
  };
}

// --- Helpers for Background and Spacing styling ---
const getBgColorClass = (bgColor?: string) => {
  switch (bgColor) {
    case 'grey':
      return 'bg-neutral-50 dark:bg-neutral-900';
    case 'light-fuchsia':
      return 'bg-[#741052]/5 dark:bg-[#741052]/10';
    case 'dark-fuchsia':
      return 'bg-gradient-to-br from-[#5c0b40] to-[#741052] text-white dark:from-[#3d072a] dark:to-[#5c0b40]';
    case 'default':
    default:
      return 'bg-white dark:bg-black text-black dark:text-white';
  }
};

const getSpacingYClass = (spacingY?: string, type?: string) => {
  if (type === 'hero' || type === 'divider') return '';
  switch (spacingY) {
    case 'small':
      return 'py-4 sm:py-6';
    case 'large':
      return 'py-12 sm:py-20';
    case 'medium':
    default:
      return 'py-8 sm:py-12';
  }
};

const headingColorClass = (bgColor?: string) => {
  return bgColor === 'dark-fuchsia' ? 'text-white' : 'text-[#741052] dark:text-[#d0269b]';
};

// --- Fallback Default Layout ---
const DEFAULT_SECTIONS: PageSection[] = [
  { id: 'default-hero', type: 'hero', title: 'Little Karachi Express', isVisible: true, props: { subtitle: 'Authentic Pakistani & Karachi Cuisines', backgroundImage: '/bg-hero.webp', overlayOpacity: 0.4, ctaText: 'Order Now', ctaAction: 'scroll', align: 'center', textColor: 'white' }},
  { id: 'default-platters', type: 'grid', title: 'Sharing Platters', isVisible: true, props: { sourceType: 'category', itemType: 'platter', categoryId: 'Sharing Platters', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-mealboxes', type: 'grid', title: 'Meal Boxes', isVisible: true, props: { sourceType: 'category', itemType: 'platter', categoryId: 'Meal Boxes', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-fastfood-deals', type: 'grid', title: 'Fast Food Deals', isVisible: true, props: { sourceType: 'category', itemType: 'platter', categoryId: 'Fast Food Deals', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-veryfastfood', type: 'grid', title: 'Very Fast Food', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Very Fast Food', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-beastbbq', type: 'grid', title: 'Beast BBQ', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Beast BBQ', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-pizza', type: 'grid', title: 'Pizza Parlour', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Pizza Parlour', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-hotpot', type: 'grid', title: 'Hotpot and Chinese', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Hotpot and Chinese', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-rolls', type: 'grid', title: 'Rolls Royce', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Rolls Royce', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-chai', type: 'grid', title: 'The Chai Company', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'The Chai Company', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
  { id: 'default-extra', type: 'grid', title: 'Very Extra', isVisible: true, props: { sourceType: 'category', itemType: 'menu', categoryId: 'Very Extra', columns: 4, cardStyle: 'gourmet', bgColor: 'default', spacingY: 'medium' }},
];

// --- Classic Layout Categories ---
const defaultPlatterCategoryOrder = [
  "Sharing Platters", "Meal Boxes", "Fast Food Deals"
];

const defaultMenuCategoryOrder = [
  "Very Fast Food", "Beast BBQ", "Pizza Parlour", "Hotpot and Chinese", "Rolls Royce", "The Chai Company", "Very Extra"
];

export default function MenuPage({
  initialItemSlug,
  initialPlatterSlug,
}: {
  initialItemSlug?: string;
  initialPlatterSlug?: string;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/order') {
      router.replace('/');
    }
  }, [pathname, router]);

  const [sections, setSections] = useState<PageSection[]>([]);
  const [allPlatters, setAllPlatters] = useState<Platter[]>([]);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [useCmsLayout, setUseCmsLayout] = useState<boolean>(true);

  // Items loading state for each section ID
  const [sectionAllItems, setSectionAllItems] = useState<{ [sectionId: string]: any[] }>({});
  const [sectionLoadedItems, setSectionLoadedItems] = useState<{ [sectionId: string]: any[] }>({});
  const [sectionLoading, setSectionLoading] = useState<{ [sectionId: string]: boolean }>({});
  const [sectionPages, setSectionPages] = useState<{ [sectionId: string]: number }>({});
  const [sectionHasMore, setSectionHasMore] = useState<{ [sectionId: string]: boolean }>({});

  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());

  const observers = useRef<{ [key: string]: IntersectionObserver }>({});
  const loadingTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // --- Classic/Normal Layout States ---
  const [classicMenu, setClassicMenu] = useState<{ [key: string]: MenuItemData[] }>({});
  const [classicPlatters, setClassicPlatters] = useState<{ [key: string]: Platter[] }>({});
  const [classicMenuLoading, setClassicMenuLoading] = useState<{ [key: string]: boolean }>({});
  const [classicPlatterLoading, setClassicPlatterLoading] = useState<boolean>(true);
  const [classicPage, setClassicPage] = useState<{ [key: string]: number }>({});
  const [classicHasMore, setClassicHasMore] = useState<{ [key: string]: boolean }>({});
  const [classicLoadedItems, setClassicLoadedItems] = useState<{ [key: string]: MenuItemData[] }>({});
  const [classicLoadedPlatters, setClassicLoadedPlatters] = useState<{ [key: string]: Platter[] }>({});

  // Progressive loading functions
  const addItemWithAnimation = (item: any, sectionId: string) => {
    const itemId = item.id || item._id;
    const itemKey = `${sectionId}-${itemId}`;

    if (animatingItems.has(itemKey)) return;

    setAnimatingItems(prev => {
      const next = new Set(prev);
      next.add(itemKey);
      return next;
    });

    const timeoutId = setTimeout(() => {
      setSectionLoadedItems(prev => {
        const currentItems = prev[sectionId] || [];
        if (currentItems.some(existing => (existing.id || existing._id) === itemId)) {
          return prev;
        }
        return {
          ...prev,
          [sectionId]: [...currentItems, item]
        };
      });

      setAnimatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }, Math.random() * 300 + 100);

    loadingTimeouts.current[itemKey] = timeoutId;
  };

  const loadItemsProgressively = (items: any[], sectionId: string) => {
    items.forEach((item, index) => {
      setTimeout(() => {
        addItemWithAnimation(item, sectionId);
      }, index * (Math.random() * 150 + 100));
    });
  };

  // --- Classic Layout progressive loading & animations ---
  const addClassicItemWithAnimation = (item: any, category: string, isPlatter: boolean = false) => {
    const itemId = item.id || item._id;
    const itemKey = `classic-${isPlatter ? 'platter' : 'menu'}-${category}-${itemId}`;

    if (animatingItems.has(itemKey)) return;

    setAnimatingItems(prev => {
      const next = new Set(prev);
      next.add(itemKey);
      return next;
    });

    const timeoutId = setTimeout(() => {
      if (isPlatter) {
        setClassicLoadedPlatters(prev => {
          const currentCategoryItems = prev[category] || [];
          if (currentCategoryItems.some(existing => (existing.id || (existing as any)._id) === itemId)) {
            return prev;
          }
          return {
            ...prev,
            [category]: [...currentCategoryItems, item as Platter]
          };
        });
      } else {
        setClassicLoadedItems(prev => {
          const currentCategoryItems = prev[category] || [];
          if (currentCategoryItems.some(existing => (existing.id || (existing as any)._id) === itemId)) {
            return prev;
          }
          return {
            ...prev,
            [category]: [...currentCategoryItems, item as MenuItemData]
          };
        });
      }

      setAnimatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }, Math.random() * 300 + 100);

    loadingTimeouts.current[itemKey] = timeoutId;
  };

  const loadClassicItemsProgressively = (items: any[], category: string, isPlatter: boolean = false) => {
    items.forEach((item, index) => {
      setTimeout(() => {
        addClassicItemWithAnimation(item, category, isPlatter);
      }, index * (Math.random() * 200 + 150));
    });
  };

  const fetchClassicData = async () => {
    setClassicPlatterLoading(true);
    try {
      const res = await fetch("/api/platter");
      const data: Platter[] = await res.json();
      
      const grouped: { [key: string]: Platter[] } = {};
      data.forEach((p) => {
        if (!grouped[p.platterCategory]) grouped[p.platterCategory] = [];
        grouped[p.platterCategory].push(p);
      });

      setClassicPlatters(grouped);
      Object.entries(grouped).forEach(([category, categoryPlatters]) => {
        loadClassicItemsProgressively(categoryPlatters, category, true);
      });
    } catch (err) {
      console.error("Failed to fetch classic platters:", err);
    } finally {
      setClassicPlatterLoading(false);
    }

    // Fetch menu items category by category
    defaultMenuCategoryOrder.forEach(async (category) => {
      setClassicMenuLoading((prev) => ({ ...prev, [category]: true }));
      try {
        const res = await fetch(`/api/getitems?page=1&limit=10&category=${encodeURIComponent(category)}`);
        const data = await res.json();
        
        setClassicMenu((prev) => ({ ...prev, [category]: data }));
        setClassicPage((prev) => ({ ...prev, [category]: 2 }));
        setClassicHasMore((prev) => ({ ...prev, [category]: data.length === 10 }));

        loadClassicItemsProgressively(data, category, false);
      } catch (err) {
        console.error(`Failed to fetch classic menu category ${category}:`, err);
      } finally {
        setClassicMenuLoading((prev) => ({ ...prev, [category]: false }));
      }
    });
  };

  const loadMoreClassicItems = async (category: string) => {
    if (classicMenuLoading[category] || !classicHasMore[category]) return;

    setClassicMenuLoading((prev) => ({ ...prev, [category]: true }));
    try {
      const nextPage = classicPage[category] || 1;
      const res = await fetch(`/api/getitems?page=${nextPage}&limit=10&category=${encodeURIComponent(category)}`);
      const data = await res.json();

      if (data.length > 0) {
        setClassicMenu((prev) => ({
          ...prev,
          [category]: [...(prev[category] || []), ...data]
        }));
        setClassicPage((prev) => ({ ...prev, [category]: nextPage + 1 }));
        setClassicHasMore((prev) => ({ ...prev, [category]: data.length === 10 }));

        loadClassicItemsProgressively(data, category, false);
      } else {
        setClassicHasMore((prev) => ({ ...prev, [category]: false }));
      }
    } catch (err) {
      console.error(`Failed to load more items for classic category ${category}:`, err);
    } finally {
      setClassicMenuLoading((prev) => ({ ...prev, [category]: false }));
    }
  };

  const lastClassicMenuItemRef = (category: string, node: HTMLDivElement | null) => {
    if (classicMenuLoading[category] || !classicHasMore[category]) return;

    const observerKey = `classic-observer-${category}`;
    if (observers.current[observerKey]) {
      observers.current[observerKey].disconnect();
    }

    observers.current[observerKey] = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreClassicItems(category);
      }
    });

    if (node) observers.current[observerKey].observe(node);
  };

  // Load layout configuration and platter items on mount
  useEffect(() => {
    // Stage 4: Menu Viewed
    trackClarityFunnelStep(CLK_FUNNEL_MENU_VIEWED);
    trackEvent('journey_menu_viewed');

    const loadPageData = async () => {
      setPageLoading(true);
      try {
        const [configRes, plattersRes] = await Promise.all([
          fetch("/api/page-config"),
          fetch("/api/platter")
        ]);

        const plattersData = await plattersRes.json();
        setAllPlatters(plattersData);

        let configData = null;
        if (configRes.ok) {
          configData = await configRes.json();
        }

        const loadedSections = (configData && configData.sections && configData.sections.length > 0)
          ? configData.sections
          : DEFAULT_SECTIONS;

        setSections(loadedSections);
        
        // --- Read useCmsLayout toggle ---
        const cmsEnabled = configData && configData.useCmsLayout !== undefined
          ? configData.useCmsLayout
          : true; // default to true
        setUseCmsLayout(cmsEnabled);

        // If classic layout mode is active, trigger the classic data fetch
        if (!cmsEnabled) {
          fetchClassicData();
        }
      } catch (err) {
        console.error("Error loading layout data:", err);
        setSections(DEFAULT_SECTIONS);
        setUseCmsLayout(true);
      } finally {
        setPageLoading(false);
      }
    };

    loadPageData();

    return () => {
      Object.values(observers.current).forEach(obs => obs.disconnect());
      Object.values(loadingTimeouts.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  // Fetch data for sections dynamically when layout changes
  useEffect(() => {
    if (sections.length === 0) return;

    sections.forEach((section) => {
      if (!section.isVisible) return;
      if (section.type !== 'grid' && section.type !== 'slider') return;

      // Skip if already loading or loaded
      if (sectionAllItems[section.id] !== undefined || sectionLoading[section.id]) return;

      const loadSectionData = async () => {
        setSectionLoading(prev => ({ ...prev, [section.id]: true }));
        try {
          if (section.props.sourceType === 'category') {
            if (section.props.itemType === 'platter') {
              // Platter Category: filter from preloaded allPlatters
              const filtered = allPlatters.filter(
                (p: any) => p.platterCategory === section.props.categoryId
              );
              setSectionAllItems(prev => ({ ...prev, [section.id]: filtered }));
              setSectionHasMore(prev => ({ ...prev, [section.id]: false }));
              loadItemsProgressively(filtered, section.id);
            } else {
              // Menu Category: fetch via API with limit 12
              const res = await fetch(
                `/api/getitems?category=${encodeURIComponent(section.props.categoryId || '')}&page=1&limit=12`
              );
              const data = await res.json();
              setSectionAllItems(prev => ({ ...prev, [section.id]: data }));
              setSectionPages(prev => ({ ...prev, [section.id]: 2 }));
              setSectionHasMore(prev => ({ ...prev, [section.id]: data.length === 12 }));
              loadItemsProgressively(data, section.id);
            }
          } else if (section.props.sourceType === 'manual' && section.props.itemIds && section.props.itemIds.length > 0) {
            // Manual Items: POST to new get-items-by-ids API
            const res = await fetch("/api/get-items-by-ids", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: section.props.itemIds }),
            });
            if (res.ok) {
              const data = await res.json();
              // Keep original sorting from selection
              const sorted = (section.props.itemIds || [])
                .map(id => data.find((item: any) => (item._id === id || item.id === id)))
                .filter(Boolean);

              setSectionAllItems(prev => ({ ...prev, [section.id]: sorted }));
              setSectionHasMore(prev => ({ ...prev, [section.id]: false }));
              loadItemsProgressively(sorted, section.id);
            } else {
              setSectionAllItems(prev => ({ ...prev, [section.id]: [] }));
              setSectionHasMore(prev => ({ ...prev, [section.id]: false }));
            }
          } else {
            // No valid settings
            setSectionAllItems(prev => ({ ...prev, [section.id]: [] }));
            setSectionHasMore(prev => ({ ...prev, [section.id]: false }));
          }
        } catch (error) {
          console.error(`Error loading data for section ${section.id}:`, error);
        } finally {
          setSectionLoading(prev => ({ ...prev, [section.id]: false }));
        }
      };

      loadSectionData();
    });
  }, [sections, allPlatters]);

  // Infinite scroll load more
  const loadMoreForSection = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    if (sectionLoading[sectionId] || !sectionHasMore[sectionId]) return;

    setSectionLoading(prev => ({ ...prev, [sectionId]: true }));
    try {
      const nextPage = sectionPages[sectionId] || 1;
      const res = await fetch(
        `/api/getitems?category=${encodeURIComponent(section.props.categoryId || '')}&page=${nextPage}&limit=12`
      );
      const data = await res.json();

      if (data.length > 0) {
        setSectionAllItems(prev => ({
          ...prev,
          [sectionId]: [...(prev[sectionId] || []), ...data]
        }));
        setSectionPages(prev => ({ ...prev, [sectionId]: nextPage + 1 }));
        setSectionHasMore(prev => ({ ...prev, [sectionId]: data.length === 12 }));
        loadItemsProgressively(data, sectionId);
      } else {
        setSectionHasMore(prev => ({ ...prev, [sectionId]: false }));
      }
    } catch (error) {
      console.error(`Error pagination loading for section ${sectionId}:`, error);
    } finally {
      setSectionLoading(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  const handleLastItemRef = (sectionId: string, node: HTMLDivElement | null) => {
    if (sectionLoading[sectionId] || !sectionHasMore[sectionId]) return;

    if (observers.current[sectionId]) {
      observers.current[sectionId].disconnect();
    }

    observers.current[sectionId] = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreForSection(sectionId);
      }
    });

    if (node) {
      observers.current[sectionId].observe(node);
    }
  };

  if (pageLoading) {
    return (
      <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <div className="h-[40vh] w-full bg-neutral-150 dark:bg-neutral-800 animate-pulse rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <SkeletonLoader key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  // --- Classic Layout Conditional Render ---
  if (!useCmsLayout) {
    const heroSection = sections.find(s => s.type === 'hero');
    return (
      <div className="bg-white text-black min-h-screen pb-20">
        <Hero 
          title={heroSection?.title}
          {...(heroSection?.props || {})}
        />
        <div className="flex justify-center mt-4 gap-4">
        </div>

        {/* Platters First */}
        <div>
          {defaultPlatterCategoryOrder.map((category) => {
            const allPlattersList = classicPlatters[category] || [];
            const displayedPlatters = classicLoadedPlatters[category] || [];
            const isLoading = classicPlatterLoading && displayedPlatters.length === 0;

            return (
              <div key={category} className="mt-8">
                <div className="w-full flex justify-center mb-4">
                  <h1 className="text-3xl font-semibold text-white bg-gradient-to-r from-[#741052] to-[#d0269b] shadow-lg hover:shadow-pink-500/40 py-3 px-6 rounded-lg text-center">
                    {category}
                  </h1>
                </div>
                <div className="grid grid-cols-2 gap-4 pr-6 pl-1 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
                  <AnimatePresence>
                    {isLoading ? (
                      [...Array(4)].map((_, i) => <SkeletonLoader key={i} />)
                    ) : (
                      displayedPlatters.map((platter, index) => (
                        <motion.div
                          key={`classic-platter-${category}-${platter.id}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            duration: 0.5,
                            delay: index * 0.1,
                            ease: "easeOut"
                          }}
                        >
                          <PlatterItem platter={platter as any} />
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>

                  {/* Show skeleton for remaining items that are still loading */}
                  {allPlattersList.length > displayedPlatters.length && (
                    [...Array(Math.min(4, allPlattersList.length - displayedPlatters.length))].map((_, i) => (
                      <motion.div
                        key={`classic-loading-platter-${category}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SkeletonLoader />
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Menu Items Below Platters */}
        <div>
          {defaultMenuCategoryOrder.map((category) => {
            const allItemsList = classicMenu[category] || [];
            const displayedItems = classicLoadedItems[category] || [];
            const isLoading = classicMenuLoading[category] && displayedItems.length === 0;

            return (
              <div key={category} className="mt-8">
                <div className="w-full flex justify-center mb-4">
                  <h1 className="text-3xl font-semibold text-white bg-gradient-to-r from-[#741052] to-[#d0269b] py-3 px-6 rounded-lg shadow-md text-center">
                    {category}
                  </h1>
                </div>
                <div className="grid grid-cols-2 gap-4 pr-6 pl-1 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
                  <AnimatePresence>
                    {isLoading ? (
                      [...Array(4)].map((_, i) => <SkeletonLoader key={i} />)
                    ) : (
                      displayedItems.map((item, index) => (
                        <motion.div
                          key={`classic-menu-${category}-${item.id || (item as any)._id}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            duration: 0.5,
                            delay: index * 0.08,
                            ease: "easeOut"
                          }}
                        >
                          <MenuItem item={item as any} />
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>

                  {/* Intersection observer for infinite scroll */}
                  {displayedItems.length > 0 && (
                    <div
                      ref={(node) => lastClassicMenuItemRef(category, node)}
                      className="col-span-full h-4"
                    />
                  )}

                  {/* Show skeleton for remaining items that are still loading */}
                  {allItemsList.length > displayedItems.length && classicMenuLoading[category] && (
                    [...Array(Math.min(4, allItemsList.length - displayedItems.length))].map((_, i) => (
                      <motion.div
                        key={`classic-loading-menu-${category}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SkeletonLoader />
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen">
      {/* Hide Scrollbars Style tag */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {sections.map((section, idx) => {
        if (!section.isVisible) return null;

        const displayedItems = sectionLoadedItems[section.id] || [];
        const isLoading = sectionLoading[section.id] || false;

        // Render target anchor just before the first non-hero visible section
        const renderAnchor = idx > 0 && sections[idx - 1].type === 'hero';

        return (
          <div key={section.id}>
            {renderAnchor && <div id="menu-content" className="scroll-mt-20" />}
            {(() => {
              switch (section.type) {
                case 'hero':
                  return <HeroSection section={section} />;
                
                case 'banner':
                  return <PromoBanner section={section} />;
                
                case 'rich-content':
                  return <ChefStoryRow section={section} />;
                
                case 'divider':
                  return <SpacerDivider section={section} />;
                
                case 'testimonials':
                  return <TestimonialsStrip section={section} />;
                
                case 'grid':
                  return (
                    <ItemGridSection
                      section={section}
                      items={displayedItems}
                      isLoading={isLoading}
                      onLastItemRef={(node) => handleLastItemRef(section.id, node)}
                    />
                  );
                
                case 'slider':
                  return (
                    <ItemSliderSection
                      section={section}
                      items={displayedItems}
                      isLoading={isLoading}
                    />
                  );
                
                default:
                  return null;
              }
            })()}
          </div>
        );
      })}
    </div>
  );
}

// --- Section Inline Components ---

// 1. Hero Section
const HeroSection = ({ section }: { section: PageSection }) => {
  const {
    subtitle = "Authentic Pakistani & Karachi Cuisines",
    backgroundImage = "/bg-hero.webp",
    mobileBackgroundImage = "",
    overlayOpacity = 0.4,
    ctaText = "Order Now",
    ctaAction = "scroll",
    ctaLink = "",
    align = "center",
    textColor = "white",
    displayMode = "overlay",
    bannerSize = "large",
    showText = true,
  } = section.props;

  const handleCtaClick = (e: React.MouseEvent) => {
    if (ctaAction === 'scroll') {
      e.preventDefault();
      document.getElementById('menu-content')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getAlignClass = () => {
    if (align === 'left') return 'text-left justify-start items-start';
    if (align === 'right') return 'text-right justify-end items-end';
    return 'text-center justify-center items-center';
  };

  const getTextColorClass = () => {
    if (textColor === 'black') return 'text-neutral-900';
    if (textColor === 'fuchsia') return 'text-[#741052]';
    return 'text-white';
  };

  const getContainerHeightClass = () => {
    if (bannerSize === 'freesize') return '';
    switch (bannerSize) {
      case 'small':
        return 'min-h-[30vh] sm:min-h-[40vh]';
      case 'medium':
        return 'min-h-[50vh] sm:min-h-[60vh]';
      case 'large':
      default:
        return 'min-h-[70vh] sm:min-h-[85vh]';
    }
  };

  // Render Direct Image mode (no text overlays)
  if (displayMode === 'direct') {
    if (bannerSize === 'freesize') {
      return (
        <div className="w-full relative select-none">
          <img 
            src={backgroundImage} 
            alt={section.title || "Banner"} 
            className="w-full h-auto hidden md:block" 
          />
          <img 
            src={mobileBackgroundImage || backgroundImage} 
            alt={section.title || "Banner"} 
            className="w-full h-auto md:hidden" 
          />
        </div>
      );
    }

    return (
      <div className={`relative flex items-center justify-center overflow-hidden w-full select-none ${getContainerHeightClass()}`}>
        {/* Background Image - PC */}
        <div 
          className="absolute inset-0 bg-cover bg-center hidden md:block"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        {/* Background Image - Mobile */}
        <div 
          className="absolute inset-0 bg-cover bg-center md:hidden"
          style={{ backgroundImage: `url(${mobileBackgroundImage || backgroundImage})` }}
        />
      </div>
    );
  }

  // Overlay Mode (Text on top of background image)
  const renderTextContent = showText !== false && (
    <div className={`relative z-10 w-full max-w-6xl mx-auto px-4 flex flex-col ${getAlignClass()} ${getTextColorClass()}`}>
      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight drop-shadow-lg mb-4 font-poppins"
      >
        {section.title || "Little Karachi Express"}
      </motion.h1>
      
      {subtitle && (
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg sm:text-2xl md:text-3xl font-light opacity-90 drop-shadow-md mb-8 max-w-3xl leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}

      {ctaText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
        >
          {ctaAction === 'link' && ctaLink ? (
            <Link 
              href={ctaLink}
              className="inline-block bg-gradient-to-r from-[#741052] to-[#d0269b] hover:from-[#5c0b40] hover:to-[#b01e82] text-white font-semibold py-3.5 px-10 rounded-full shadow-xl hover:shadow-pink-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              {ctaText}
            </Link>
          ) : (
            <a 
              href="#menu-content"
              onClick={handleCtaClick}
              className="inline-block bg-gradient-to-r from-[#741052] to-[#d0269b] hover:from-[#5c0b40] hover:to-[#b01e82] text-white font-semibold py-3.5 px-10 rounded-full shadow-xl hover:shadow-pink-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              {ctaText}
            </a>
          )}
        </motion.div>
      )}
    </div>
  );

  if (bannerSize === 'freesize') {
    return (
      <div className="relative w-full overflow-hidden select-none">
        {/* Desktop Image */}
        <img 
          src={backgroundImage} 
          alt="Desktop Background" 
          className="w-full h-auto hidden md:block z-0" 
        />
        {/* Mobile Image */}
        <img 
          src={mobileBackgroundImage || backgroundImage} 
          alt="Mobile Background" 
          className="w-full h-auto md:hidden z-0" 
        />

        {/* Dark overlay */}
        <div 
          className="absolute inset-0 bg-black z-[5]" 
          style={{ opacity: overlayOpacity }}
        />

        {/* Text container overlaid */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {renderTextContent}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden w-full select-none ${getContainerHeightClass()}`}
    >
      {/* Background Image - PC */}
      <div 
        className="absolute inset-0 bg-cover bg-center hidden md:block"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      {/* Background Image - Mobile */}
      <div 
        className="absolute inset-0 bg-cover bg-center md:hidden"
        style={{ backgroundImage: `url(${mobileBackgroundImage || backgroundImage})` }}
      />
      
      {/* Dark overlay */}
      <div 
        className="absolute inset-0 bg-black" 
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Content */}
      {renderTextContent}
    </div>
  );
};

// 2. Countdown Timer helper for PromoBanner
const CountdownTimer = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(endTime) - +new Date();
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!timeLeft) return null;

  return (
    <div className="flex gap-3 items-center justify-center md:justify-start mt-4">
      <span className="text-xs sm:text-sm uppercase tracking-wider font-semibold opacity-90 flex items-center gap-1.5">
        <Clock size={16} className="animate-pulse" /> Offer ends in:
      </span>
      <div className="flex gap-1.5 items-center">
        <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg font-mono font-bold text-sm shadow-inner min-w-[2.5rem] text-center">
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="font-bold opacity-80">:</span>
        <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg font-mono font-bold text-sm shadow-inner min-w-[2.5rem] text-center">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="font-bold opacity-80">:</span>
        <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg font-mono font-bold text-sm shadow-inner min-w-[2.5rem] text-center">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};

// Promo Banner Section
const PromoBanner = ({ section }: { section: PageSection }) => {
  const {
    subtitle = "Limited time offer! Use code CLK20 at checkout.",
    bannerBg = "linear-gradient(135deg, #741052 0%, #d0269b 100%)",
    bannerTextColor = "#ffffff",
    ctaText = "",
    ctaLink = "",
    hasCountdown = false,
    countdownEnd = ""
  } = section.props;

  const isGradient = bannerBg.startsWith('linear-gradient') || bannerBg.startsWith('radial-gradient') || bannerBg.includes('gradient');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full relative overflow-hidden shadow-lg border-y border-[#741052]/10"
      style={{
        background: isGradient ? bannerBg : undefined,
        backgroundColor: !isGradient ? bannerBg : undefined,
        color: bannerTextColor
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex-1 text-center md:text-left">
          {section.title && (
            <h3 className="text-xl sm:text-2xl font-bold font-poppins mb-1.5 tracking-tight">
              {section.title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm sm:text-base opacity-90 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
          {hasCountdown && countdownEnd && <CountdownTimer endTime={countdownEnd} />}
        </div>
        
        {ctaText && ctaLink && (
          <div className="shrink-0">
            <Link 
              href={ctaLink}
              className="inline-flex items-center gap-2 bg-white text-[#741052] font-semibold py-3 px-7 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 text-sm"
            >
              {ctaText} <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
      
      {/* Decorative background sparkles */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
    </motion.div>
  );
};

// 3. Story Row Section
const ChefStoryRow = ({ section }: { section: PageSection }) => {
  const {
    description = "",
    image = "/cafe-banner.webp",
    mediaAlign = "right",
    bgColor = "default"
  } = section.props;

  const isLeftImage = mediaAlign === 'left';

  return (
    <div className={`w-full overflow-hidden transition-colors duration-300 ${getBgColorClass(bgColor)} py-12 md:py-16`}>
      <div className={`max-w-6xl mx-auto px-4 flex flex-col ${isLeftImage ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
        {/* Image side */}
        <div className="w-full md:w-1/2">
          <div className="relative group overflow-hidden rounded-2xl shadow-xl aspect-[4/3] w-full">
            <Image 
              src={image || "/cafe-banner.webp"} 
              alt={section.title || "Our Story"} 
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              unoptimized={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
        
        {/* Text side */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          {section.title && (
            <h2 className={`text-3xl sm:text-4xl font-extrabold font-poppins mb-4 tracking-tight ${headingColorClass(bgColor)}`}>
              {section.title}
            </h2>
          )}
          {description && (
            <p className={`leading-relaxed text-base sm:text-lg whitespace-pre-line ${bgColor === 'dark-fuchsia' ? 'text-white/90' : 'text-gray-650 dark:text-neutral-300'}`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// 4. Spacer Divider Section
const SpacerDivider = ({ section }: { section: PageSection }) => {
  const {
    dividerHeight = "medium",
    dividerStyle = "fuchsia-line"
  } = section.props;

  const getHeightClass = () => {
    switch (dividerHeight) {
      case 'small': return 'py-4';
      case 'large': return 'py-12';
      case 'medium':
      default:
        return 'py-8';
    }
  };

  return (
    <div className={`w-full flex items-center justify-center ${getHeightClass()} px-4 sm:px-6`}>
      {dividerStyle === 'solid' && (
        <hr className="w-full max-w-6xl border-t border-neutral-200 dark:border-neutral-800" />
      )}
      {dividerStyle === 'dashed' && (
        <hr className="w-full max-w-6xl border-t border-dashed border-neutral-300 dark:border-neutral-700" />
      )}
      {dividerStyle === 'gold-border' && (
        <div className="relative w-full max-w-6xl flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
          </div>
          <span className="relative bg-white dark:bg-black px-4 text-xs font-semibold text-[#D4AF37] tracking-widest uppercase">
            ✦ CLK SPECIAL ✦
          </span>
        </div>
      )}
      {dividerStyle === 'fuchsia-line' && (
        <div className="relative w-full max-w-6xl flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#741052] to-transparent"></div>
          </div>
          <span className="relative bg-white dark:bg-black px-3 text-[#741052] dark:text-[#d0269b]">
            ✦
          </span>
        </div>
      )}
      {dividerStyle === 'none' && <div className="h-0" />}
    </div>
  );
};

// 5. Customer Feedback Section
const TestimonialsStrip = ({ section }: { section: PageSection }) => {
  const {
    testimonials = []
  } = section.props;

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <div className="w-full py-10 overflow-hidden bg-neutral-50 dark:bg-neutral-900 border-y border-neutral-100 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4">
        {section.title && (
          <h2 className="text-3xl font-extrabold text-center text-[#741052] dark:text-[#d0269b] font-poppins mb-8 tracking-tight">
            {section.title}
          </h2>
        )}
        
        {/* Horizontal scroll reviews */}
        <div className="flex gap-6 overflow-x-auto pb-6 pt-2 px-1 scrollbar-hide snap-x snap-mandatory">
          {testimonials.map((t: any) => (
            <div 
              key={t.id} 
              className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0 snap-start bg-white/70 dark:bg-neutral-800/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Rating stars */}
                <div className="flex gap-0.5 mb-3 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      className={i < t.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-neutral-300 dark:text-neutral-600"} 
                    />
                  ))}
                </div>
                
                {/* Comment quote */}
                <p className="text-gray-600 dark:text-neutral-300 text-sm sm:text-base leading-relaxed italic mb-4">
                  &ldquo;{t.comment}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 border-t border-neutral-100 dark:border-neutral-700 pt-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#741052]/20 to-[#d0269b]/20 flex items-center justify-center text-lg shadow-sm shrink-0">
                  {t.avatar || "👤"}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-[#741052] dark:text-[#d0269b] text-sm truncate">
                    {t.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                    Verified Customer
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper interface for item sections
interface ItemSectionProps {
  section: PageSection;
  items: any[];
  isLoading: boolean;
  onLastItemRef?: (node: HTMLDivElement | null) => void;
}

// 6. Product Grid Section
const ItemGridSection = ({ section, items, isLoading, onLastItemRef }: ItemSectionProps) => {
  const {
    columns = 4,
    cardStyle = 'gourmet',
    bgColor = 'default',
    spacingY = 'medium'
  } = section.props;

  const isPlatter = (item: any) => {
    return item && (item.platterCategory !== undefined || item.basePrice !== undefined);
  };

  const getGridColsClass = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-2 md:grid-cols-3';
      case 4:
      default:
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  return (
    <div className={`w-full transition-colors duration-300 ${getBgColorClass(bgColor)} ${getSpacingYClass(spacingY, 'grid')}`}>
      <div className="max-w-6xl mx-auto px-4">
        {section.title && (
          <div className="w-full flex flex-col items-center mb-8">
            <h2 className={`text-3xl font-extrabold font-poppins tracking-tight text-center ${headingColorClass(bgColor)}`}>
              {section.title}
            </h2>
            <div className="w-16 h-1 mt-2.5 bg-gradient-to-r from-[#741052] to-[#d0269b] rounded-full"></div>
          </div>
        )}

        <div className={`grid gap-4 sm:gap-6 ${getGridColsClass()}`}>
          <AnimatePresence>
            {isLoading && items.length === 0 ? (
              [...Array(columns)].map((_, i) => <SkeletonLoader key={i} />)
            ) : (
              items.map((item, index) => (
                <motion.div
                  key={`${section.id}-${item.id || item._id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                >
                  {isPlatter(item) ? (
                    <PlatterItem platter={item} cardStyle={cardStyle} />
                  ) : (
                    <MenuItem item={item as any} cardStyle={cardStyle} />
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {/* Show observer target element for infinite scroll */}
          {items.length > 0 && onLastItemRef && (
            <div
              ref={onLastItemRef}
              className="col-span-full h-1"
            />
          )}

          {/* Show skeletons if loading more */}
          {isLoading && items.length > 0 && (
            [...Array(4)].map((_, i) => (
              <motion.div
                key={`loading-more-${section.id}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SkeletonLoader />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// 7. Product Slider Section
const ItemSliderSection = ({ section, items, isLoading }: ItemSectionProps) => {
  const {
    cardStyle = 'gourmet',
    bgColor = 'default',
    spacingY = 'medium'
  } = section.props;

  const isPlatter = (item: any) => {
    return item && (item.platterCategory !== undefined || item.basePrice !== undefined);
  };

  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <div className={`w-full transition-colors duration-300 ${getBgColorClass(bgColor)} ${getSpacingYClass(spacingY, 'slider')}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex flex-col">
            {section.title ? (
              <h2 className={`text-2xl sm:text-3xl font-extrabold font-poppins tracking-tight ${headingColorClass(bgColor)}`}>
                {section.title}
              </h2>
            ) : (
              <div className="h-6 w-12 bg-transparent"></div>
            )}
            <div className="w-12 h-1 mt-2 bg-gradient-to-r from-[#741052] to-[#d0269b] rounded-full"></div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button 
              onClick={scrollLeft}
              className="p-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors shadow-sm text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-950"
              aria-label="Previous items"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={scrollRight}
              className="p-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors shadow-sm text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-950"
              aria-label="Next items"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="relative">
          {isLoading && items.length === 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-4 pt-2 scrollbar-hide">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-[280px] sm:w-[320px] shrink-0">
                  <SkeletonLoader />
                </div>
              ))}
            </div>
          ) : (
            <div 
              ref={sliderRef}
              className="flex gap-6 overflow-x-auto pb-6 pt-2 px-1 scrollbar-hide snap-x snap-mandatory scroll-smooth"
            >
              {items.map((item, index) => (
                <div key={`${section.id}-${item.id || item._id}-${index}`} className="w-[280px] sm:w-[320px] shrink-0 snap-start">
                  {isPlatter(item) ? (
                    <PlatterItem platter={item} cardStyle={cardStyle} />
                  ) : (
                    <MenuItem item={item as any} cardStyle={cardStyle} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
