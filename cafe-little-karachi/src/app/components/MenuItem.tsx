"use client";

import { FC, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AddToCartButton from "./AddToCartButton";
import { VariationSelector } from "../../components/variations/VariationSelector";
import { useVariationSelector } from "../../hooks/useVariationSelector";
import { VariationConfig, SelectedVariation } from "../../types/variations";
import { X, Check } from "lucide-react";
import posthog from 'posthog-js';
import { trackEvent } from '../lib/analytics';

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
}

const MenuItem: FC<MenuItemProps> = ({ item, cardStyle = 'gourmet' }) => {
  const [showModal, setShowModal] = useState(false);
  const [showAddedMessage, setShowAddedMessage] = useState(false);

  const itemId = item.id ? item.id.toString() : "0";
  const originalPrice = typeof item.price === "number" ? item.price : 0;

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
    simpleSelection: 'single', // Menu items typically allow single variation selection
    allowMultipleCategories: false, // Not applicable for simple variations
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
    // Track Add to Cart Journey Event
    posthog.capture('journey_add_item', {
      item_id: itemId,
      item_name: item.title,
      price: totalPrice,
      has_variations: selections.simple.length > 0
    });

    trackEvent('journey_add_item', {
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
          posthog.capture('journey_view_item_details', {
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
            : { height: "28rem" } // gourmet
        }
      >
        {cardStyle === 'list' ? (
          <>
            {/* Out of stock badge */}
            {item.status === "out of stock" && (
              <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-md animate-pulse">
                Out of Stock
              </span>
            )}

            {/* Left Side: Image */}
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

            {/* Right/Center Side: Info */}
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
                  <p className="font-bold text-sm sm:text-base bg-gradient-to-r from-[#741052] to-[#d0269b] text-transparent bg-clip-text">
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
                    setShowModal(true);
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
            {/* Out of stock badge */}
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
                unoptimized={true}
              />
            </div>

            <h2 className={`font-semibold text-[#741052] ${
              cardStyle === 'minimal' ? 'text-sm mb-1 truncate' : cardStyle === 'compact' ? 'text-base mb-1 truncate' : 'text-xl mb-3'
            }`}>
              {item.title}
            </h2>

            {/* Truncated description */}
            <div className="relative flex-1 mb-3 overflow-hidden">
              <p className={`text-gray-500 ${
                cardStyle === 'minimal' ? 'text-[11px] line-clamp-1' : cardStyle === 'compact' ? 'text-xs line-clamp-2' : 'text-sm line-clamp-2'
              }`}>{item.description}</p>
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
              {item.discountValue !== undefined && item.discountValue > 0 && (
                <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                  Rs.{originalPrice.toFixed(2)}
                </p>
              )}
            </div>

            {/* Add to cart button */}
            <motion.button
              whileHover={item.status === "in stock" ? { scale: 1.05 } : {}}
              whileTap={item.status === "in stock" ? { scale: 0.97 } : {}}
              disabled={item.status === "out of stock"}
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

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
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
              rounded-2xl p-6 max-w-4xl w-full flex flex-col lg:flex-row shadow-2xl"
            >
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full 
                border border-gray-300 hover:bg-gradient-to-r from-[#741052] to-[#d0269b] hover:text-white transition"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>

              {/* Left Column - Image */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="lg:w-1/2 flex justify-center items-center mb-6 lg:mb-0"
              >
                <Image
                  src={item.image || "/fallback-image.jpg"}
                  alt={item.title}
                  className="rounded-xl object-cover w-full h-[350px]"
                  width={356}
                  height={350}
                  unoptimized={true}
                />
              </motion.div>

              {/* Right Column - Details */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:w-1/2 px-4"
              >
                <h2 className="text-2xl font-semibold text-[#741052]">
                  {item.title}
                </h2>
                <p className="text-gray-600 mt-3">{item.description}</p>

                <div className="flex items-center gap-3 mt-4">
                  <p className="text-xl font-bold bg-gradient-to-r from-[#741052] to-[#d0269b] text-transparent bg-clip-text">
                    Rs.{totalPrice.toFixed(2)}
                  </p>
                  {item.discountValue !== undefined && item.discountValue > 0 && selections.simple === null && (
                    <p className="text-sm text-gray-400 line-through">
                      Rs.{originalPrice.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Variations */}
                {variationConfig.simpleVariations && variationConfig.simpleVariations.length > 0 && (
                  <div className="mt-6">
                    <VariationSelector
                      config={variationConfig}
                      selections={selections}
                      onSimpleSelect={handleSimpleSelect}
                      onCategorySelect={() => {}} // Not used for simple variations
                      errors={validation.errors}
                      warnings={validation.warnings}
                    />
                  </div>
                )}

                {/* Add to Cart */}
                <div className="mt-6 flex items-center gap-4">
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

export default MenuItem;
