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
  };
}

const PlatterItem: FC<PlatterItemProps> = ({ platter }) => {
  const [showModal, setShowModal] = useState(false);
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [categoryItems, setCategoryItems] = useState<{
    [key: string]: any[];
  }>({});

  // Convert platter structure to unified variation config
  const variationConfig: VariationConfig = useMemo(() => ({
    categories: [
      // Main categories (dynamic from API)
      ...platter.categories.map((category, index) => ({
        id: `category-${index}`,
        name: category.categoryName,
        type: 'single' as const,
        required: true, // Platter categories are typically required
        options: categoryItems[category.categoryName] || []
      })),
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

  // Use the variation selector hook
  const {
    selections,
    totalPrice,
    validation,
    selectCategoryVariation,
    getFlattenedVariations,
    isValid
  } = useVariationSelector(variationConfig, platter.basePrice);

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

  useEffect(() => {
    if (showModal) {
      const fetchItemsForCategories = async () => {
        const itemsForCategories: { [key: string]: any[] } = {};
        for (const category of platter.categories) {
          const items = await fetchCategoryItems(category.categoryName);
          itemsForCategories[category.categoryName] = items;
        }
        setCategoryItems(itemsForCategories);
      };
      fetchItemsForCategories();
    }
  }, [showModal, fetchCategoryItems, platter.categories]);

  const handleItemAdded = () => {
    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 1500);
  };

  return (
    <>
      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowModal(true)}
        className="relative flex flex-col p-5 rounded-[18px] cursor-pointer 
        bg-white border border-[#E3D6C6] shadow-[0_4px_20px_rgba(0,0,0,0.04)]
        hover:shadow-[0_20px_40px_rgba(107,63,42,0.12)] hover:border-[#C46A47] transition-all duration-500 group"
        style={{ height: "30rem" }}
      >
        {/* Out of stock badge */}
        {platter.status === "out of stock" && (
          <span className="absolute top-3 left-3 z-10 bg-[#8B2E2E] text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg">
            Out of Stock
          </span>
        )}

        <div className="overflow-hidden rounded-[14px] mb-5">
          <Image
            src={platter.image || "/fallback-image.jpg"}
            alt={platter.title}
            className="object-cover w-full h-44 group-hover:scale-110 transition-transform duration-700"
            width={450}
            height={180}
            unoptimized={true}
          />
        </div>

        <h3 className="text-xl font-bold text-[#6B3F2A] mb-2 leading-tight group-hover:text-[#C46A47] transition-colors">
          {platter.title}
        </h3>

        {/* Truncated description */}
        <p className="text-sm text-[#6F5A4A] line-clamp-2 mb-4 leading-relaxed">
          {platter.description}
        </p>

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#E3D6C6]/50">
          <p className="font-extrabold text-xl text-[#C46A47]">
            Rs.{platter.basePrice.toFixed(0)}
          </p>
          <div className="w-10 h-10 rounded-full bg-[#FAF3E6] flex items-center justify-center text-[#C46A47] group-hover:bg-[#C46A47] group-hover:text-white transition-all">
            <Check size={20} />
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-[#2E1C14]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-[#FAF3E6] rounded-[24px] p-4 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col lg:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-[#E3D6C6]"
            >
              {/* Close Button */}
              <button
                className="absolute top-5 right-5 z-20 w-10 h-10 flex items-center justify-center rounded-full 
                bg-white/80 backdrop-blur-sm border border-[#E3D6C6] text-[#2E1C14] hover:bg-[#C46A47] hover:text-white transition-all shadow-sm"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
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
                <h2 className="text-3xl font-bold text-[#6B3F2A] tracking-tight">
                  {platter.title}
                </h2>
                <div className="w-12 h-1 bg-[#C46A47] mt-3 mb-6 rounded-full"></div>
                <p className="text-[#6F5A4A] leading-relaxed text-lg">{platter.description}</p>
                <p className="text-3xl font-extrabold mt-8 text-[#C46A47]">
                  Rs.{totalPrice.toFixed(0)}
                </p>

                {/* Variations */}
                <div className="mt-6">
                  <VariationSelector
                    config={variationConfig}
                    selections={selections}
                    onSimpleSelect={() => {}} // Not used for platters
                    onCategorySelect={selectCategoryVariation}
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
