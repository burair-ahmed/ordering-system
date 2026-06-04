/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

"use client";

import { FC, useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AddToCartButtonForPlatters from "./AddToCartButtonForPlatters";
import { VariationSelector } from "../../components/variations/VariationSelector";
import { useVariationSelector } from "../../hooks/useVariationSelector";
import { VariationConfig } from "../../types/variations";
import { X, Check } from "lucide-react";
import posthog from 'posthog-js';
import { trackEvent } from '../lib/analytics';

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
}

const PlatterItem: FC<PlatterItemProps> = ({ platter, cardStyle = 'gourmet' }) => {
  const [showModal, setShowModal] = useState(false);
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [categoryItems, setCategoryItems] = useState<{
    [key: string]: any[];
  }>({});

  // Convert platter structure to unified variation config
  const variationConfig: VariationConfig = useMemo(() => ({
    categories: [
      // Main categories (dynamic from API)
      ...platter.categories.map((category, index) => {
        const categoryKey = category.categoryName || `Selection-${index}`;
        return {
          id: `category-${index}`,
          name: category.categoryName || "Select Options",
          type: 'single' as const,
          required: true, // Platter categories are typically required
          options: (categoryItems[categoryKey] || []).map(opt => ({
            ...opt,
            price: 0 // Main platter category options are included in base price
          }))
        };
      }),
      // Additional choices as optional categories
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
    allowMultipleCategories: true, // Platters can have multiple category types
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

  // Fetch category items when modal opens
  const fetchCategoryItems = useCallback(async (categoryName: string) => {
    try {
      const response = await fetch(`/api/getitems?category=${categoryName}`);
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id?.toString() || item._id,
        name: item.title,
        price: item.price || 0,
        available: item.status === 'in stock'
      }));
    } catch (error) {
      console.error("Error fetching menu items:", error);
      return [];
    }
  }, []);

  const fetchItemsByIds = useCallback(async (ids: string[]) => {
    try {
      const response = await fetch(`/api/getitems?ids=${ids.join(',')}`);
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id?.toString() || item._id,
        name: item.title,
        price: item.price || 0,
        available: item.status === 'in stock'
      }));
    } catch (error) {
      console.error("Error fetching specific items:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (showModal) {
      const fetchItemsForCategories = async () => {
        const itemsForCategories: { [key: string]: any[] } = {};
        for (const category of platter.categories) {
          let items = [];
          if (category.selectionType === 'items' && category.itemIds && category.itemIds.length > 0) {
            items = await fetchItemsByIds(category.itemIds);
          } else if (category.categoryName) {
            items = await fetchCategoryItems(category.categoryName);
          }
          const categoryKey = category.categoryName || `Selection-${platter.categories.indexOf(category)}`;
          itemsForCategories[categoryKey] = items;
        }
        setCategoryItems(itemsForCategories);
      };
      fetchItemsForCategories();
    }
  }, [showModal, fetchCategoryItems, platter.categories]);

  const handleItemAdded = () => {
    // Track Add Platter to Cart Journey Event
    posthog.capture('journey_add_item', {
      item_id: platter.id,
      item_name: platter.title,
      price: totalPrice,
      has_variations: true, // Platters always have variations/choices
      is_platter: true
    });

    trackEvent('journey_add_item', {
      item_id: platter.id,
      item_name: platter.title,
      price: totalPrice,
      has_variations: true,
      is_platter: true
    });

    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 1500);
  };

  const handleCategorySelect = (categoryId: string, option: any) => {
    selectCategoryVariation(categoryId, option);
    trackEvent('journey_variation_select', {
      item_id: platter.id,
      item_name: platter.title,
      category_id: categoryId,
      variation_name: option.name,
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
          posthog.capture('journey_view_item_details', {
            item_name: platter.title,
            price: basePrice,
            category: 'Platter', // Explicitly marking as Platter
            is_platter: true
          });
          trackEvent('journey_view_item_details', {
            item_id: platter.id,
            item_name: platter.title,
            price: basePrice,
            category: 'Platter',
            is_platter: true
          });
          setShowModal(true);
        }}
        className={
          cardStyle === 'list'
            ? "relative flex flex-row items-center gap-4 p-3 md:p-4 rounded-2xl cursor-pointer bg-white/70 backdrop-blur-lg shadow-md border border-transparent hover:border-[#741052] transition-all duration-300 w-full"
            : cardStyle === 'minimal'
            ? "relative flex flex-col p-3 rounded-xl cursor-pointer bg-transparent border border-neutral-200/60 dark:border-neutral-800 hover:border-[#741052] transition-all duration-300"
            : cardStyle === 'compact'
            ? "relative flex flex-col p-3 rounded-xl cursor-pointer bg-white/70 backdrop-blur-lg shadow-md border border-transparent hover:border-[#741052] transition-all duration-300"
            : "relative flex flex-col p-4 rounded-2xl cursor-pointer bg-white/70 backdrop-blur-lg shadow-lg border border-transparent hover:border-[#741052] transition-all duration-300" // gourmet
        }
        style={
          cardStyle === 'list'
            ? { minHeight: "8.5rem" }
            : cardStyle === 'minimal'
            ? { height: "18rem" }
            : cardStyle === 'compact'
            ? { height: "21rem" }
            : { height: "29rem" } // gourmet
        }
      >
        {cardStyle === 'list' ? (
          <>
            {/* Out of stock badge */}
            {platter.status === "out of stock" && (
              <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-md animate-pulse">
                Out of Stock
              </span>
            )}

            {/* Left Side: Image */}
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

            {/* Right/Center Side: Info */}
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
                  <p className="font-bold text-sm sm:text-base bg-gradient-to-r from-[#741052] to-[#d0269b] text-transparent bg-clip-text">
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
                    setShowModal(true);
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
            {/* Out of stock badge */}
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
                unoptimized={true}
              />
            </div>

            <h2 className={`font-semibold text-[#741052] ${
              cardStyle === 'minimal' ? 'text-sm mb-1 truncate' : cardStyle === 'compact' ? 'text-base mb-1 truncate' : 'text-xl mb-3'
            }`}>
              {platter.title}
            </h2>

            {/* Truncated description */}
            <div className="relative flex-1 mb-3 overflow-hidden">
              <p className={`text-gray-500 ${
                cardStyle === 'minimal' ? 'text-[11px] line-clamp-1' : cardStyle === 'compact' ? 'text-xs line-clamp-2' : 'text-sm line-clamp-2'
              }`}>{platter.description}</p>
              {cardStyle === 'gourmet' && (
                <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-white to-transparent"></div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-1.5 mt-auto">
              <p className={`font-bold bg-gradient-to-r from-[#741052] to-[#d0269b] text-transparent bg-clip-text ${
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

            {/* Add to cart button */}
            <motion.button
              whileHover={platter.status === "in stock" ? { scale: 1.05 } : {}}
              whileTap={platter.status === "in stock" ? { scale: 0.97 } : {}}
              disabled={platter.status === "out of stock"}
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
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

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
<motion.div
  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
className="relative bg-white/90 backdrop-blur-xl 
rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col lg:flex-row shadow-2xl"
            >
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full 
                border border-gray-300 hover:bg-gradient-to-r from-[#741052] to-[#d0269b] hover:text-white transition"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>

              {/* Left Column */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="lg:w-1/2 flex justify-center items-center mb-6 lg:mb-0"
              >
                <Image
                  src={platter.image || "/fallback-image.jpg"}
                  alt={platter.title}
                  className="rounded-xl object-cover w-full h-[350px]"
                  width={356}
                  height={350}
                  unoptimized={true}
                />
              </motion.div>

              {/* Right Column */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:w-1/2 px-4"
              >
                <h2 className="text-2xl font-semibold text-[#741052]">
                  {platter.title}
                </h2>
                <p className="text-gray-600 mt-3">{platter.description}</p>
                <div className="flex items-center gap-3 mt-4">
                  <p className="text-xl font-bold bg-gradient-to-r from-[#741052] to-[#d0269b] text-transparent bg-clip-text">
                    Rs.{totalPrice.toFixed(2)}
                  </p>
                  {platter.discountValue !== undefined && platter.discountValue > 0 && (
                    <p className="text-sm text-gray-400 line-through">
                      Rs.{(totalPrice + (originalBasePrice - basePrice)).toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Variations */}
                <div className="mt-6">
                  <VariationSelector
                    config={variationConfig}
                    selections={selections}
                    onSimpleSelect={() => {}} // Not used for platters
                    onCategorySelect={handleCategorySelect}
                    errors={validation.errors}
                    warnings={validation.warnings}
                  />
                </div>

                {/* Add to Cart */}
                <div className="mt-6 flex items-center gap-4">
                  <AddToCartButtonForPlatters
                    platter={platter}
                    selectedVariations={getFlattenedVariations()}
                    onClick={handleItemAdded}
                    className=""
                    disabled={platter.status === "out of stock" || !isValid}
                  />
                  {showAddedMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex items-center gap-1 text-green-600 text-sm"
                    >
                      <Check size={16} /> Added to cart
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PlatterItem;
