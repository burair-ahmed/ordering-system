/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MenuItem from "../components/MenuItem";
import PlatterItem from "../components/PlatterItem";  // Assuming you have a PlatterItem component
import Hero from "../components/Hero";
import { v4 as uuidv4 } from 'uuid';
import SkeletonLoader from "../components/SkeletonLoader";

interface MenuItemData {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  variations: Variation[];
  category: string;
  status: "in stock" | "out of stock";
}

interface Variation {
  name: string;
  price: string;
}

interface Platter {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  image: string;
  platterCategory: string;  // New field for platter category
  status: "in stock" | "out of stock";
  categories: Category[];
  additionalChoices: AdditionalChoice[];
}

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

const defaultPlatterCategoryOrder = [
  "CLK Deals","Meal Boxes","Sharing Platters","BBQ Deals","Fast Food Deals",
];


const defaultMenuCategoryOrder = [
  "Chinese","Beast BBQ","Rolls Royce","Flavoured Feast","Burger-E-Karachi", "Chicken Karahis","Mutton Karahis","Handi and Qeema","Marvellous Matka Biryani Chicken/Beef","Charming Chai","Paratha Performance","Very Fast Food","Shawarmania","French Boys Fries","Rice","Beverages","Juicy Lucy","Roti Shoti","Very Extra"
];

export default function MenuPage() {
  const [menu, setMenu] = useState<{ [key: string]: MenuItemData[] }>({});
  const [platters, setPlatters] = useState<{ [key: string]: Platter[] }>({});
  const [menuLoading, setMenuLoading] = useState<{ [key: string]: boolean }>({});
  const [platterLoading, setPlatterLoading] = useState<boolean>(true);
  const [page, setPage] = useState<{ [key: string]: number }>({});
  const [hasMore, setHasMore] = useState<{ [key: string]: boolean }>({});

  // Progressive loading states
  const [loadedItems, setLoadedItems] = useState<{ [key: string]: MenuItemData[] }>({});
  const [loadedPlatters, setLoadedPlatters] = useState<{ [key: string]: Platter[] }>({});
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());

  // Separate category orders for menu items and platters
  const [platterCategoryOrder] = useState<string[]>(defaultPlatterCategoryOrder);
  const [menuCategoryOrder] = useState<string[]>(defaultMenuCategoryOrder);

  const observers = useRef<{[key: string]: IntersectionObserver}>({});
  const loadingTimeouts = useRef<{[key: string]: NodeJS.Timeout}>({});

  // Progressive loading functions
  const addItemWithAnimation = (item: MenuItemData | Platter, category: string, isPlatter: boolean = false) => {
    const itemKey = `${isPlatter ? 'platter' : 'menu'}-${category}-${item.id}`;

    if (animatingItems.has(itemKey)) return;

    setAnimatingItems(prev => new Set(prev).add(itemKey));

    const timeoutId = setTimeout(() => {
      if (isPlatter) {
        setLoadedPlatters(prev => ({
          ...prev,
          [category]: [...(prev[category] || []), item as Platter]
        }));
      } else {
        setLoadedItems(prev => ({
          ...prev,
          [category]: [...(prev[category] || []), item as MenuItemData]
        }));
      }

      setAnimatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }, Math.random() * 300 + 100); // Random delay between 100-400ms

    loadingTimeouts.current[itemKey] = timeoutId;
  };

  const loadItemsProgressively = (items: (MenuItemData | Platter)[], category: string, isPlatter: boolean = false) => {
    items.forEach((item, index) => {
      setTimeout(() => {
        addItemWithAnimation(item, category, isPlatter);
      }, index * (Math.random() * 200 + 150)); // Staggered loading with random delays
    });
  };

useEffect(() => {
  const fetchPlatters = async () => {
    setPlatterLoading(true);
    try {
      const res = await fetch("/api/platter");
      const data: Platter[] = await res.json();

      // Group platters by category
      const grouped: { [key: string]: Platter[] } = {};
      data.forEach((p) => {
        if (!grouped[p.platterCategory]) grouped[p.platterCategory] = [];
        grouped[p.platterCategory].push(p);
      });

      setPlatters(grouped);

      // Load platters progressively with animation
      Object.entries(grouped).forEach(([category, categoryPlatters]) => {
        loadItemsProgressively(categoryPlatters, category, true);
      });
    } finally {
      setPlatterLoading(false);
    }
  };

  const fetchMenuCategory = async (category: string) => {
    setMenuLoading((prev) => ({ ...prev, [category]: true }));
    try {
      const res = await fetch(`/api/getitems?page=1&limit=10&category=${category}`);
      const data = await res.json();
      setMenu((prev) => ({ ...prev, [category]: data }));
      setPage((prev) => ({ ...prev, [category]: 2 }));
      setHasMore((prev) => ({ ...prev, [category]: data.length === 10 }));

      // Load menu items progressively with animation
      loadItemsProgressively(data, category, false);
    } finally {
      setMenuLoading((prev) => ({ ...prev, [category]: false }));
    }
  };

  fetchPlatters();
  menuCategoryOrder.forEach(fetchMenuCategory);

  // Cleanup timeouts on unmount
  return () => {
    Object.values(loadingTimeouts.current).forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
  };
}, []);

  

  const loadMoreItems = async (category: string) => {
    if (menuLoading[category] || !hasMore[category]) return;

    setMenuLoading((prev) => ({ ...prev, [category]: true }));
    try {
      const nextPage = page[category] || 1;
      const res = await fetch(`/api/getitems?page=${nextPage}&limit=10&category=${category}`);
      const data = await res.json();

      if (data.length > 0) {
        setMenu((prev) => ({
          ...prev,
          [category]: [...(prev[category] || []), ...data]
        }));
        setPage((prev) => ({ ...prev, [category]: nextPage + 1 }));
        setHasMore((prev) => ({ ...prev, [category]: data.length === 10 }));

        // Load new items progressively with animation
        loadItemsProgressively(data, category, false);
      } else {
        setHasMore((prev) => ({ ...prev, [category]: false }));
      }
    } finally {
      setMenuLoading((prev) => ({ ...prev, [category]: false }));
    }
  };

  const lastMenuItemRef = (category: string, node: HTMLDivElement | null) => {
    if (menuLoading[category] || !hasMore[category]) return;

    if (!observers.current[category]) {
      observers.current[category] = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMoreItems(category);
        }
      });
    }

    if (node) observers.current[category].observe(node);
  };

  return (
    <div className="bg-[#FAF3E6] min-h-screen text-[#2E1C14]">
      <Hero />
      <div className="flex justify-center mt-4 gap-4">
      </div>

      {/* Platters First */}
      <div className="pb-8">
        {platterCategoryOrder.map((category) => {
          const allPlatters = platters[category] || [];
          const displayedPlatters = loadedPlatters[category] || [];
          const isLoading = platterLoading && displayedPlatters.length === 0;

          return (
            <div key={category} className="mt-12">
              <div className="w-full flex justify-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-[#6B3F2A] to-[#A65638] shadow-[0_8px_25px_rgba(107,63,42,0.2)] py-4 px-10 rounded-2xl text-center tracking-tight">
                  {category}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-5 pr-4 pl-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-6">
                <AnimatePresence>
                  {isLoading ? (
                    [...Array(4)].map((_, i) => <SkeletonLoader key={i} />)
                  ) : (
                    displayedPlatters.map((platter, index) => (
                      <motion.div
                        key={`platter-${category}-${platter.id}-${index}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.1,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      >
                        <PlatterItem platter={platter} />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>

                {/* Show skeleton for remaining items that are still loading */}
                {allPlatters.length > displayedPlatters.length && (
                  [...Array(Math.min(4, allPlatters.length - displayedPlatters.length))].map((_, i) => (
                    <motion.div
                      key={`loading-platter-${category}-${i}`}
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
      <div className="pb-20">
        {menuCategoryOrder.map((category) => {
          const allItems = menu[category] || [];
          const displayedItems = loadedItems[category] || [];
          const isLoading = menuLoading[category] && displayedItems.length === 0;

          return (
            <div key={category} className="mt-12">
              <div className="w-full flex justify-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-[#6B3F2A] to-[#A65638] shadow-[0_8px_25px_rgba(107,63,42,0.2)] py-4 px-10 rounded-2xl text-center tracking-tight">
                  {category}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-5 pr-4 pl-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-6">
                <AnimatePresence>
                  {isLoading ? (
                    [...Array(4)].map((_, i) => <SkeletonLoader key={i} />)
                  ) : (
                    displayedItems.map((item, index) => (
                      <motion.div
                        key={`menu-${category}-${item.id}-${index}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.08,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      >
                        <MenuItem item={item} />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>

                {/* Intersection observer for infinite scroll */}
                {displayedItems.length > 0 && (
                  <div
                    ref={(node) => lastMenuItemRef(category, node)}
                    className="col-span-full h-8"
                  />
                )}

                {/* Show skeleton for remaining items that are still loading */}
                {allItems.length > displayedItems.length && menuLoading[category] && (
                  [...Array(Math.min(4, allItems.length - displayedItems.length))].map((_, i) => (
                    <motion.div
                      key={`loading-menu-${category}-${i}`}
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
