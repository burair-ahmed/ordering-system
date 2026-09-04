/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

"use client";

import { FC, useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AddToCartButtonForPlatters from "./AddToCartButtonForPlatters";
import { VariationSelector } from "../../components/variations/VariationSelector";
import { useVariationSelector } from "../../hooks/useVariationSelector";
import { VariationConfig, SelectedVariation } from "../../types/variations";
import { X, Check } from "lucide-react";
import posthog from 'posthog-js';
import { trackEvent } from '../lib/analytics';
import { slugify } from '../lib/slugify';
import { useOrder } from '../context/OrderContext';
import { useCart } from '../context/CartContext';

interface CategoryOption {
  uuid: string;
  name: string;
  title: string;
  price: number;
}

interface Category {
  categoryName: string;
  options: CategoryOption[];
  selectionType?: 'category' | 'items';
  itemIds?: string[];
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
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
  };
  cardStyle?: 'minimal' | 'compact' | 'gourmet' | 'list';
  initialOpen?: boolean;
}

// Memory cache for category items to eliminate network latency on subsequent modal opens
const platterCategoryCache = new Map<string, any[]>();

const PlatterItem: FC<PlatterItemProps> = ({ platter, cardStyle = 'gourmet', initialOpen = false }) => {
  const { isLocationSet, setLocationModalOpen } = useOrder();
  const { addToCart } = useCart();

  // Stores a pending cart add that waits for order-type selection
  const pendingCartItem = useRef<{ id: string; title: string; price: number; quantity: number; image: string; variations: string[] } | null>(null);
  // Track previous isLocationSet to detect the false→true transition
  const prevIsLocationSet = useRef(isLocationSet);

  const [showModal, setShowModal] = useState(initialOpen);
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [categoryItems, setCategoryItems] = useState<{
    [key: string]: any[];
  }>({});

  const platterSlug = useMemo(() => slugify(platter.title), [platter.title]);

  // Non-blocking smooth modal open with clean URL sync
  const openModal = useCallback(() => {
    setShowModal(true);
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const targetPath = `/platter/${platterSlug}`;
        if (window.location.pathname !== targetPath) {
          window.history.replaceState(null, '', targetPath);
        }
      });
    }
  }, [platterSlug]);

  // Auto-open when the current URL already points to this platter's slug.
  // This handles hard navigations (typing URL + Enter) where the initialOpen
  // prop may not fire reliably due to progressive/async item loading.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname === `/platter/${platterSlug}`) {
      setShowModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platterSlug]);

  // Non-blocking smooth modal close with clean URL revert
  // If the order type hasn't been set yet and the user closes without adding,
  // we open the location modal so they can set their order type.
  const closeModal = useCallback(() => {
    setShowModal(false);
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        if (window.location.pathname.startsWith('/platter/')) {
          window.history.replaceState(null, '', '/');
        }
      });
    }
    // Deferred so the platter modal closes first before the location modal appears
    if (!isLocationSet) {
      setTimeout(() => setLocationModalOpen(true), 200);
    }
  }, [isLocationSet, setLocationModalOpen]);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path === `/platter/${platterSlug}`) {
          setShowModal(true);
        } else if (!path.startsWith('/platter/')) {
          setShowModal(false);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [platterSlug]);

  // Handle initialOpen prop changes (e.g. slug prop resolves after data load)
  useEffect(() => {
    if (initialOpen) {
      setShowModal(true);
    }
  }, [initialOpen]);

  // Convert platter structure to unified variation config
  const variationConfig: VariationConfig = useMemo(() => ({
    categories: [
      ...platter.categories.map((category, index) => {
        const categoryKey = category.categoryName || `Selection-${index}`;
        return {
          id: `category-${index}`,
          name: category.categoryName || "Select Options",
          type: 'single' as const,
          required: true,
          options: (categoryItems[categoryKey] || []).map(opt => ({
            ...opt,
            price: 0
          }))
        };
      }),
      ...platter.additionalChoices.map((choice, index) => ({
        id: `additional-${index}`,
        name: choice.heading,
        type: 'single' as const,
        required: false,
        options: choice.options.map(opt => ({
          id: opt.uuid,
          name: opt.name,
          price: opt.price || 0,
          available: true
        }))
      }))
    ],
    allowMultipleCategories: true,
  }), [platter.categories, platter.additionalChoices, categoryItems]);

  const originalBasePrice = platter.basePrice || 0;

  // Calculate discounted base price
  const basePrice = useMemo(() => {
    if (!platter.discountValue || platter.discountValue <= 0) return originalBasePrice;
    if (platter.discountType === 'percentage') {
      return originalBasePrice * (1 - platter.discountValue / 100);
    } else if (platter.discountType === 'fixed') {
      return Math.max(0, originalBasePrice - platter.discountValue);
    }
    return originalBasePrice;
  }, [originalBasePrice, platter.discountType, platter.discountValue]);

  // Use the variation selector hook
  const {
    selections,
    totalPrice,
    validation,
    selectCategoryVariation,
    getFlattenedVariations,
    isValid
  } = useVariationSelector(variationConfig, basePrice);

  // Fetch category items with memory caching
  const fetchCategoryItems = useCallback(async (categoryName: string) => {
    if (platterCategoryCache.has(`cat_${categoryName}`)) {
      return platterCategoryCache.get(`cat_${categoryName}`)!;
    }
    try {
      const response = await fetch(`/api/getitems?category=${encodeURIComponent(categoryName)}`);
      const data = await response.json();
      const mapped = data.map((item: any) => ({
        id: item.id?.toString() || item._id,
        name: item.title,
        price: item.price || 0,
        available: item.status === 'in stock'
      }));
      platterCategoryCache.set(`cat_${categoryName}`, mapped);
      return mapped;
    } catch (error) {
      console.error("Error fetching menu items:", error);
      return [];
    }
  }, []);

  const fetchItemsByIds = useCallback(async (ids: string[]) => {
    const key = `ids_${ids.join(',')}`;
    if (platterCategoryCache.has(key)) {
      return platterCategoryCache.get(key)!;
    }
    try {
      const response = await fetch(`/api/getitems?ids=${ids.join(',')}`);
      const data = await response.json();
      const mapped = data.map((item: any) => ({
        id: item.id?.toString() || item._id,
        name: item.title,
        price: item.price || 0,
        available: item.status === 'in stock'
      }));
      platterCategoryCache.set(key, mapped);
      return mapped;
    } catch (error) {
      console.error("Error fetching menu items by IDs:", error);
      return [];
    }
  }, []);

  // Load items when modal opens
  useEffect(() => {
    if (!showModal) return;

    let isMounted = true;
    const loadCategoryItems = async () => {
      const itemsMap: { [key: string]: any[] } = {};

      for (let i = 0; i < platter.categories.length; i++) {
        const category = platter.categories[i];
        const categoryKey = category.categoryName || `Selection-${i}`;

        if (category.selectionType === 'items' && category.itemIds && category.itemIds.length > 0) {
          itemsMap[categoryKey] = await fetchItemsByIds(category.itemIds);
        } else if (category.categoryName) {
          itemsMap[categoryKey] = await fetchCategoryItems(category.categoryName);
        }
      }

      if (isMounted) {
        setCategoryItems(itemsMap);
      }
    };

    loadCategoryItems();
    return () => {
      isMounted = false;
    };
  }, [showModal, platter.categories, fetchCategoryItems, fetchItemsByIds]);

  // Fires after the item is confirmed added (analytics + UI feedback)
  const handleItemAdded = useCallback(() => {
    posthog.capture('journey_add_platter_to_cart', {
      platter_id: platter.id,
      platter_name: platter.title,
      price: totalPrice,
      has_variations: Object.keys(selections.categories).length > 0
    });

    trackEvent('journey_add_platter_to_cart', {
      platter_id: platter.id,
      platter_name: platter.title,
      price: totalPrice,
      has_variations: Object.keys(selections.categories).length > 0,
    });

    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 1500);
  }, [platter.id, platter.title, totalPrice, selections.categories]);

  // The actual cart add — called directly when order type is already set,
  // or deferred until order type is confirmed.
  const performCartAdd = useCallback(() => {
    addToCart({
      id: platter.id,
      title: platter.title,
      price: totalPrice,
      quantity: 1,
      image: platter.image,
      variations: getFlattenedVariations(),
    });
    handleItemAdded();
  }, [addToCart, platter.id, platter.title, totalPrice, platter.image, getFlattenedVariations, handleItemAdded]);

  // Guard: called when the "Add to Cart" button is pressed.
  // If the order type is already set → add immediately.
  // If not → open the location modal and queue the add for after selection.
  const handleAddRequest = useCallback(() => {
    if (isLocationSet) {
      performCartAdd();
    } else {
      // Queue the pending cart item (capturing current variation snapshot)
      pendingCartItem.current = {
        id: platter.id,
        title: platter.title,
        price: totalPrice,
        quantity: 1,
        image: platter.image,
        variations: getFlattenedVariations(),
      };
      setLocationModalOpen(true);
    }
  }, [isLocationSet, performCartAdd, platter.id, platter.title, totalPrice, platter.image, getFlattenedVariations, setLocationModalOpen]);

  // Flush deferred cart add once the user finishes selecting an order type
  useEffect(() => {
    const wasUnset = !prevIsLocationSet.current;
    const isNowSet = isLocationSet;
    prevIsLocationSet.current = isLocationSet;

    if (wasUnset && isNowSet && pendingCartItem.current) {
      addToCart(pendingCartItem.current);
      handleItemAdded();
      pendingCartItem.current = null;
    }
  }, [isLocationSet, addToCart, handleItemAdded]);

  const handleCategorySelect = (categoryId: string, option: SelectedVariation) => {
    selectCategoryVariation(categoryId, option);
    const category = variationConfig.categories?.find(c => c.id === categoryId);
    trackEvent('journey_platter_option_select', {
      platter_id: platter.id,
      platter_name: platter.title,
      category_name: category?.name,
      option_name: option.optionName,
      price: option.price
    });
  };

  return (
    <>
      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          posthog.capture('journey_view_platter_details', {
            platter_id: platter.id,
            platter_name: platter.title,
            price: basePrice
          });
          trackEvent('journey_view_platter_details', {
            platter_id: platter.id,
            platter_name: platter.title,
            price: basePrice
          });
          openModal();
        }}
        className={
          cardStyle === 'list'
            ? "relative flex flex-row items-center gap-4 p-3 md:p-4 rounded-2xl cursor-pointer bg-white/70 backdrop-blur-md shadow-md border border-transparent hover:border-[#741052] transition-all duration-300 w-full"
            : cardStyle === 'minimal'
            ? "relative flex flex-col p-3 rounded-xl cursor-pointer bg-transparent border border-neutral-200/60 dark:border-neutral-800 hover:border-[#741052] transition-all duration-300"
            : cardStyle === 'compact'
            ? "relative flex flex-col p-3 rounded-xl cursor-pointer bg-white/70 backdrop-blur-md shadow-md border border-transparent hover:border-[#741052] transition-all duration-300"
            : "relative flex flex-col p-4 rounded-2xl cursor-pointer bg-white/70 backdrop-blur-md shadow-lg border border-transparent hover:border-[#741052] transition-all duration-300"
        }
        style={
          cardStyle === 'list'
            ? { minHeight: "8.5rem" }
            : cardStyle === 'minimal'
            ? { height: "18rem" }
            : cardStyle === 'compact'
            ? { height: "21rem" }
            : { height: "28rem" }
        }
      >
        {cardStyle === 'list' ? (
          <>
            {platter.status === "out of stock" && (
              <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-md animate-pulse">
                Out of Stock
              </span>
            )}

            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0">
              <Image
                src={platter.image || "/fallback-image.jpg"}
                alt={platter.title}
                className="rounded-xl object-cover w-full h-full"
                width={150}
                height={150}
                unoptimized={true}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col h-full justify-between py-1">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[#741052] truncate">
                  {platter.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1">
                  {platter.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm sm:text-base text-[#741052]">
                    Rs.{basePrice.toFixed(2)}
                  </p>
                  {platter.discountValue !== undefined && platter.discountValue > 0 && (
                    <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                      Rs.{originalBasePrice.toFixed(2)}
                    </p>
                  )}
                </div>

                <motion.button
                  whileHover={platter.status === "in stock" ? { scale: 1.05 } : {}}
                  whileTap={platter.status === "in stock" ? { scale: 0.97 } : {}}
                  disabled={platter.status === "out of stock"}
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal();
                  }}
                  className={`py-1.5 px-4 text-xs rounded-full font-medium text-white transition-all duration-300
                    ${
                      platter.status === "out of stock"
                        ? "bg-gray-400 grayscale cursor-not-allowed"
                        : "bg-gradient-to-r from-[#741052] to-[#d0269b] shadow-md hover:shadow-pink-500/30"
                    }`}
                >
                  {platter.status === "out of stock" ? "Unavailable" : "Add"}
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <>
            {platter.status === "out of stock" && (
              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow-md animate-pulse z-10">
                Out of Stock
              </span>
            )}

            <div className="w-full">
              <Image
                src={platter.image || "/fallback-image.jpg"}
                alt={platter.title}
                className={`rounded-xl object-cover w-full mb-3 ${
                  cardStyle === 'minimal' ? 'h-24' : cardStyle === 'compact' ? 'h-28' : 'h-40'
                }`}
                width={450}
                height={160}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            <h2 className={`font-semibold text-[#741052] ${
              cardStyle === 'minimal' ? 'text-sm mb-1 truncate' : cardStyle === 'compact' ? 'text-base mb-1 truncate' : 'text-xl mb-3'
            }`}>
              {platter.title}
            </h2>

            <div className="relative flex-1 mb-3 overflow-hidden">
              <p className={`text-gray-500 ${
                cardStyle === 'minimal' ? 'text-[11px] line-clamp-1' : cardStyle === 'compact' ? 'text-xs line-clamp-2' : 'text-sm line-clamp-2'
              }`}>{platter.description}</p>
              {cardStyle === 'gourmet' && (
                <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-white to-transparent"></div>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-auto">
              <p className={`font-bold text-[#741052] ${
                cardStyle === 'minimal' ? 'text-sm' : cardStyle === 'compact' ? 'text-base' : 'text-lg'
              }`}>
                Rs.{basePrice.toFixed(2)}
              </p>
              {platter.discountValue !== undefined && platter.discountValue > 0 && (
                <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                  Rs.{originalBasePrice.toFixed(2)}
                </p>
              )}
            </div>

            <motion.button
              whileHover={platter.status === "in stock" ? { scale: 1.05 } : {}}
              whileTap={platter.status === "in stock" ? { scale: 0.97 } : {}}
              disabled={platter.status === "out of stock"}
              onClick={(e) => {
                e.stopPropagation();
                openModal();
              }}
              className={`w-full text-center rounded-full font-medium text-white transition-all duration-300 ${
                cardStyle === 'minimal'
                  ? 'mt-2 py-1 px-3 text-xs border border-[#741052] text-[#741052] bg-transparent hover:bg-[#741052] hover:text-white'
                  : cardStyle === 'compact'
                  ? 'mt-2 py-1.5 px-4 text-xs bg-gradient-to-r from-[#741052] to-[#d0269b] shadow-md'
                  : 'mt-3 py-2 px-6 text-sm bg-gradient-to-r from-[#741052] to-[#d0269b] shadow-lg hover:shadow-pink-500/40'
              } ${
                platter.status === "out of stock"
                  ? "bg-gray-200 text-gray-450 border-gray-300 grayscale animate-pulse cursor-not-allowed hover:bg-transparent hover:text-gray-450"
                  : ""
              }`}
            >
              {platter.status === "out of stock" ? "Unavailable" : "Add to Cart"}
            </motion.button>
          </>
        )}
      </motion.div>

      {/* Optimized High-Performance Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl p-5 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col lg:flex-row shadow-2xl border border-gray-100"
              style={{ willChange: "transform, opacity" }}
            >
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full 
                border border-gray-200 bg-gray-50 hover:bg-gray-200 text-gray-700 transition z-20"
                onClick={closeModal}
                aria-label="Close platter modal"
              >
                <X size={18} />
              </button>

              {/* Left Column */}
              <div className="lg:w-1/2 flex justify-center items-center mb-5 lg:mb-0">
                <Image
                  src={platter.image || "/fallback-image.jpg"}
                  alt={platter.title}
                  className="rounded-xl object-cover w-full h-[240px] sm:h-[320px]"
                  width={356}
                  height={320}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Right Column */}
              <div className="lg:w-1/2 px-1 sm:px-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#741052]">
                    {platter.title}
                  </h2>
                  <p className="text-gray-600 mt-2 text-sm sm:text-base leading-relaxed">{platter.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <p className="text-xl font-extrabold text-[#741052]">
                      Rs.{totalPrice.toFixed(2)}
                    </p>
                    {platter.discountValue !== undefined && platter.discountValue > 0 && (
                      <p className="text-sm text-gray-400 line-through">
                        Rs.{(totalPrice + (originalBasePrice - basePrice)).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Variations */}
                  <div className="mt-4">
                    <VariationSelector
                      config={variationConfig}
                      selections={selections}
                      onSimpleSelect={() => {}}
                      onCategorySelect={handleCategorySelect}
                      errors={validation.errors}
                      warnings={validation.warnings}
                    />
                  </div>
                </div>

                {/* Add to Cart */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center gap-4">
                  <AddToCartButtonForPlatters
                    platter={platter}
                    selectedVariations={getFlattenedVariations()}
                    onAddRequest={handleAddRequest}
                    onClick={handleItemAdded}
                    className=""
                    disabled={platter.status === "out of stock" || !isValid}
                  />
                  {showAddedMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center gap-1 text-green-600 text-sm font-semibold"
                    >
                      <Check size={16} /> Added to cart
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PlatterItem;
