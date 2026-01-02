"use client";

import { FC, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AddToCartButton from "./AddToCartButton";
import { VariationSelector } from "../../components/variations/VariationSelector";
import { useVariationSelector } from "../../hooks/useVariationSelector";
import { VariationConfig } from "../../types/variations";
import { X, Check } from "lucide-react";
import posthog from 'posthog-js';

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
}

const MenuItem: FC<MenuItemProps> = ({ item }) => {
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
      has_variations: selections.simple !== null
    });

    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 1500);
  };

  return (
    <>
      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          posthog.capture('journey_view_item_details', {
            item_name: item.title,
            price: basePrice,
            category: item.category
          });
          setShowModal(true);
        }}
        className="relative flex flex-col p-4 rounded-2xl cursor-pointer 
        bg-white/70 backdrop-blur-lg shadow-lg 
        border border-transparent hover:border-[#741052] transition-all duration-300"
        style={{ height: "28rem" }}
      >
        {/* Out of stock badge */}
        {item.status === "out of stock" && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow-md animate-pulse">
            Out of Stock
          </span>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Image
            src={item.image || "/fallback-image.jpg"}
            alt={item.title}
            className="rounded-xl object-cover w-full h-40 mb-4"
            width={450}
            height={160}
            unoptimized={true}
          />
        </motion.div>

        <h2 className="text-xl font-semibold text-[#741052] mb-4">
          {item.title}
        </h2>

        {/* Truncated description with fade-out */}
        <div className="relative flex-1 mb-4">
          <p className="text-sm text-gray-600 line-clamp-1">{item.description}</p>
          <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-auto">
          <p className="font-bold text-lg bg-gradient-to-r from-[#741052] to-[#d0269b] text-transparent bg-clip-text">
            Rs.{basePrice.toFixed(2)}
          </p>
          {item.discountValue !== undefined && item.discountValue > 0 && (
            <p className="text-sm text-gray-400 line-through">
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
            e.stopPropagation(); // Prevent opening modal if we want direct add, OR...
            // Wait, if this button is "Add to Cart", does it add to cart?
            // Currently it has NO onClick, so it bubbles to card click -> opens modal.
            // If we want "Quick Add" (One click add), we need to implement it here.
            
            // BUT, if the intention is JUST to ensure the event fires, bubbling is fine.
            // UNLESS the user mistakenly thinks the button adds to cart.
            
            // Let's assume the current behavior (open modal) is CORRECT for the "View" step.
            // So my previous explanation about "Quick Add Trap" might have been based on a misunderstanding of the code 
            // OR I missed where the logic updates.
            
            // Let's implement the `onClick` to be EXPLICIT about firing the event, just in case bubbling behaves weirdly with some elements.
            posthog.capture('journey_view_item_details', {
              item_name: item.title,
              price: basePrice,
              category: item.category
            });
            setShowModal(true);
          }}
          className={`mt-3 py-2 px-6 rounded-full font-medium text-white transition-all duration-300
            ${
              item.status === "out of stock"
                ? "bg-gray-400 grayscale animate-pulse cursor-not-allowed"
                : "bg-gradient-to-r from-[#741052] to-[#d0269b] shadow-lg hover:shadow-pink-500/40"
            }`}
        >
          {item.status === "out of stock" ? "Unavailable" : "Add to Cart"}
        </motion.button>
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
                      onSimpleSelect={selectSimpleVariation}
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
