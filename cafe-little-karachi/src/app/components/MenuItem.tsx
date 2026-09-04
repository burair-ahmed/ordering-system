"use client";

import { FC, useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AddToCartButton from "./AddToCartButton";
import { VariationSelector } from "../../components/variations/VariationSelector";
import { useVariationSelector } from "../../hooks/useVariationSelector";
import { VariationConfig, SelectedVariation } from "../../types/variations";
import { X, Check } from "lucide-react";
import posthog from 'posthog-js';
import { trackEvent } from '../lib/analytics';
import { slugify } from '../lib/slugify';

interface Variation {
  name: string;
  price: string;
}

interface MenuItemData {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  variations: Variation[];
  status: "in stock" | "out of stock";
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  category: string;
}

interface MenuItemProps {
  item: MenuItemData;
  cardStyle?: 'minimal' | 'compact' | 'gourmet' | 'list';
  initialOpen?: boolean;
}

const MenuItem: FC<MenuItemProps> = ({ item, cardStyle = 'gourmet', initialOpen = false }) => {
  const [showModal, setShowModal] = useState(initialOpen);
  const [showAddedMessage, setShowAddedMessage] = useState(false);

  const itemId = item.id ? item.id.toString() : "0";
  const originalPrice = typeof item.price === "number" ? item.price : 0;
  const itemSlug = useMemo(() => slugify(item.title), [item.title]);

  // Non-blocking smooth modal open with clean URL sync
  const openModal = useCallback(() => {
    setShowModal(true);
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const targetPath = `/item/${itemSlug}`;
        if (window.location.pathname !== targetPath) {
          window.history.replaceState(null, '', targetPath);
        }
      });
    }
  }, [itemSlug]);

  // Non-blocking smooth modal close with clean URL revert
  const closeModal = useCallback(() => {
    setShowModal(false);
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        if (window.location.pathname.startsWith('/item/')) {
          window.history.replaceState(null, '', '/');
        }
      });
    }
  }, []);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path === `/item/${itemSlug}`) {
          setShowModal(true);
        } else if (!path.startsWith('/item/')) {
          setShowModal(false);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [itemSlug]);

  // Handle initialOpen property if landing directly on /item/[slug]
  useEffect(() => {
    if (initialOpen) {
      setShowModal(true);
    }
  }, [initialOpen]);

  // Calculate discounted base price
  const basePrice = useMemo(() => {
    if (!item.discountValue || item.discountValue <= 0) return originalPrice;
    if (item.discountType === 'percentage') {
      return originalPrice * (1 - item.discountValue / 100);
    } else if (item.discountType === 'fixed') {
      return Math.max(0, originalPrice - item.discountValue);
    }
    return originalPrice;
  }, [originalPrice, item.discountType, item.discountValue]);

  // Convert legacy variations to new format
  const variationConfig: VariationConfig = useMemo(() => ({
    simpleVariations: item.variations?.map((v, index) => ({
      id: `variation-${index}`,
      name: v.name,
      price: parseFloat(v.price) || 0
    })),
    simpleSelection: 'single',
    allowMultipleCategories: false,
  }), [item.variations]);

  // Use the new variation selector hook
  const {
    selections,
    totalPrice,
    validation,
    selectSimpleVariation,
    getFlattenedVariations,
    isValid
  } = useVariationSelector(variationConfig, basePrice);

  const handleItemAdded = () => {
    posthog.capture('journey_add_to_cart', {
      item_id: itemId,
      item_name: item.title,
      price: totalPrice,
      has_variations: selections.simple.length > 0
    });

    trackEvent('journey_add_to_cart', {
      item_id: itemId,
      item_name: item.title,
      price: totalPrice,
      has_variations: selections.simple.length > 0,
      variation: selections.simple.length > 0 ? selections.simple.map(s => s.optionName).join(', ') : null
    });

    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 1500);
  };

  const handleSimpleSelect = (variationId: string, option: SelectedVariation) => {
    selectSimpleVariation(variationId, option);
    trackEvent('journey_variation_select', {
      item_id: itemId,
      item_name: item.title,
      variation_name: option.optionName,
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
          posthog.capture('journey_variation_opened', {
            item_name: item.title,
            price: basePrice,
            category: item.category
          });
          posthog.capture('journey_view_item_details', {
            item_name: item.title,
            price: basePrice,
            category: item.category
          });
          trackEvent('journey_variation_opened', {
            item_id: itemId,
            item_name: item.title,
            price: basePrice,
            category: item.category
          });
          trackEvent('journey_view_item_details', {
            item_id: itemId,
            item_name: item.title,
            price: basePrice,
            category: item.category
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
            {item.status === "out of stock" && (
              <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-md animate-pulse">
                Out of Stock
              </span>
            )}

            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0">
              <Image
                src={item.image || "/fallback-image.jpg"}
                alt={item.title}
                className="rounded-xl object-cover w-full h-full"
                width={150}
                height={150}
                unoptimized={true}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col h-full justify-between py-1">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[#741052] truncate">
                  {item.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm sm:text-base text-[#741052]">
                    Rs.{basePrice.toFixed(2)}
                  </p>
                  {item.discountValue !== undefined && item.discountValue > 0 && (
                    <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                      Rs.{originalPrice.toFixed(2)}
                    </p>
                  )}
                </div>

                <motion.button
                  whileHover={item.status === "in stock" ? { scale: 1.05 } : {}}
                  whileTap={item.status === "in stock" ? { scale: 0.97 } : {}}
                  disabled={item.status === "out of stock"}
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal();
                  }}
                  className={`py-1.5 px-4 text-xs rounded-full font-medium text-white transition-all duration-300
                    ${
                      item.status === "out of stock"
                        ? "bg-gray-400 grayscale cursor-not-allowed"
                        : "bg-gradient-to-r from-[#741052] to-[#d0269b] shadow-md hover:shadow-pink-500/30"
                    }`}
                >
                  {item.status === "out of stock" ? "Unavailable" : "Add"}
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <>
            {item.status === "out of stock" && (
              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow-md animate-pulse z-10">
                Out of Stock
              </span>
            )}

            <div className="w-full">
              <Image
                src={item.image || "/fallback-image.jpg"}
                alt={item.title}
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
              {item.title}
            </h2>

            <div className="relative flex-1 mb-3 overflow-hidden">
              <p className={`text-gray-500 ${
                cardStyle === 'minimal' ? 'text-[11px] line-clamp-1' : cardStyle === 'compact' ? 'text-xs line-clamp-2' : 'text-sm line-clamp-2'
              }`}>{item.description}</p>
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
              {item.discountValue !== undefined && item.discountValue > 0 && (
                <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                  Rs.{originalPrice.toFixed(2)}
                </p>
              )}
            </div>

            <motion.button
              whileHover={item.status === "in stock" ? { scale: 1.05 } : {}}
              whileTap={item.status === "in stock" ? { scale: 0.97 } : {}}
              disabled={item.status === "out of stock"}
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
                item.status === "out of stock"
                  ? "bg-gray-200 text-gray-450 border-gray-300 grayscale animate-pulse cursor-not-allowed hover:bg-transparent hover:text-gray-450"
                  : ""
              }`}
            >
              {item.status === "out of stock" ? "Unavailable" : "Add to Cart"}
            </motion.button>
          </>
        )}
      </motion.div>

      {/* Optimized High-Performance Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
              className="relative bg-white rounded-2xl p-5 sm:p-6 max-w-4xl w-full flex flex-col lg:flex-row shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100"
              style={{ willChange: "transform, opacity" }}
            >
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full 
                border border-gray-200 bg-gray-50 hover:bg-gray-200 text-gray-700 transition z-20"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              {/* Left Column - Image */}
              <div className="lg:w-1/2 flex justify-center items-center mb-5 lg:mb-0">
                <Image
                  src={item.image || "/fallback-image.jpg"}
                  alt={item.title}
                  className="rounded-xl object-cover w-full h-[240px] sm:h-[320px]"
                  width={356}
                  height={320}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Right Column - Details */}
              <div className="lg:w-1/2 px-1 sm:px-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#741052]">
                    {item.title}
                  </h2>
                  <p className="text-gray-600 mt-2 text-sm sm:text-base leading-relaxed">{item.description}</p>

                  <div className="flex items-center gap-3 mt-3">
                    <p className="text-xl font-extrabold text-[#741052]">
                      Rs.{totalPrice.toFixed(2)}
                    </p>
                    {item.discountValue !== undefined && item.discountValue > 0 && selections.simple.length === 0 && (
                      <p className="text-sm text-gray-400 line-through">
                        Rs.{originalPrice.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Variations */}
                  {variationConfig.simpleVariations && variationConfig.simpleVariations.length > 0 && (
                    <div className="mt-4">
                      <VariationSelector
                        config={variationConfig}
                        selections={selections}
                        onSimpleSelect={handleSimpleSelect}
                        onCategorySelect={() => {}}
                        errors={validation.errors}
                        warnings={validation.warnings}
                      />
                    </div>
                  )}
                </div>

                {/* Add to Cart */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center gap-4">
                  <AddToCartButton
                    id={itemId}
                    title={item.title}
                    price={totalPrice}
                    image={item.image}
                    selectedVariations={getFlattenedVariations()}
                    onClick={handleItemAdded}
                    disabled={item.status === "out of stock" || !isValid}
                    className=""
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

export default MenuItem;
