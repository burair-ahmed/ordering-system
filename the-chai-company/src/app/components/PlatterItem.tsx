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
        options: (categoryItems[category.categoryName] || []).map(opt => ({
          ...opt,
          price: 0 // Main platter category options are included in base price
        }))
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
        whileHover={{ scale: 1.02, translateY: -8 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowModal(true)}
        className="relative flex flex-col p-4 rounded-[24px] cursor-pointer 
        bg-white border border-[#E3D6C6]/60 shadow-[0_10px_30px_-10px_rgba(107,63,42,0.05)]
        hover:shadow-[0_40px_80px_-20px_rgba(196,106,71,0.15)] hover:border-[#C46A47]/40 transition-all duration-500 group overflow-hidden h-full min-h-[420px]"
      >
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C46A47]/5 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-[#C46A47]/10 transition-colors" />

        {/* Out of stock badge */}
        {platter.status === "out of stock" && (
          <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md text-white text-[10px] uppercase font-bold px-4 py-1.5 rounded-full shadow-lg border border-white/10">
            Sold Out
          </div>
        )}

        {/* Image Container */}
        <div className="relative overflow-hidden rounded-[20px] mb-6 aspect-[4/3] w-full shrink-0">
          <Image
            src={platter.image || "/fallback-image.jpg"}
            alt={platter.title}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000 ease-out"
            width={450}
            height={340}
            unoptimized={true}
          />
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Title & Badge */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="text-lg md:text-2xl font-bold text-[#6B3F2A] leading-[1.1] group-hover:text-[#C46A47] transition-colors line-clamp-2">
            {platter.title}
          </h3>
          <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#FAF3E6] flex items-center justify-center text-[#C46A47] group-hover:bg-[#C46A47] group-hover:text-white transition-all shadow-sm">
            <Check size={14} className="md:w-[16px] md:h-[16px]" />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-[#6F5A4A]/80 line-clamp-2 mb-4 md:mb-6 leading-relaxed font-light">
          {platter.description}
        </p>

        {/* Price & Action */}
        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="text-[10px] md:text-xs text-[#C46A47] font-bold uppercase tracking-widest block mb-0.5 opacity-60">Price</span>
            <p className="font-black text-xl md:text-2xl text-[#C46A47] flex items-baseline gap-1">
              <span className="text-xs md:text-sm font-bold">Rs.</span>
              {platter.basePrice.toFixed(0)}
            </p>
          </div>
          
          <div className="px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl bg-[#FAF3E6] text-[#6B3F2A] font-bold text-[10px] md:text-xs uppercase tracking-tighter group-hover:bg-[#C46A47] group-hover:text-white transition-all">
            Customize
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
            >
              {/* Persistent Close Button */}
              <button
                className="absolute top-4 right-4 md:top-6 md:right-6 z-[60] p-2 md:p-2.5 rounded-full bg-white/40 hover:bg-[#C46A47] text-[#2E1C14] hover:text-white transition-all backdrop-blur-md border border-white/20 shadow-lg"
                onClick={() => setShowModal(false)}
              >
                <X size={20} className="md:w-[24px] md:h-[24px]" />
              </button>

              <div className="flex flex-col lg:flex-row bg-[#FAF3E6] rounded-[32px] overflow-hidden border border-white/20 flex-1 min-h-0">
                {/* Left Column - Hero Image */}
                <div className="lg:w-1/2 relative min-h-[350px] lg:min-h-[600px] lg:self-stretch overflow-hidden shrink-0">
                  <Image
                    src={platter.image || "/fallback-image.jpg"}
                    alt={platter.title}
                    className="object-cover"
                    fill
                    priority
                    unoptimized={true}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#FAF3E6]" />
                </div>

                {/* Right Column - Deep Craft Details */}
                <div className="lg:w-1/2 flex flex-col h-full bg-[#FAF3E6] min-h-0">
                  {/* Header - Persistent */}
                  <div className="p-6 md:p-10 lg:p-14 lg:pb-6 pb-4 shrink-0 bg-[#FAF3E6] z-10">
                    <span className="inline-block text-[#C46A47] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-3">
                      Signature Selection
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#6B3F2A] tracking-tighter leading-tight mb-2">
                      {platter.title}
                    </h2>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-[10px] md:text-xs text-[#C46A47] font-bold uppercase tracking-widest opacity-60">Price</span>
                      <div className="h-[1px] flex-grow bg-[#E3D6C6]" />
                      <p className="text-2xl md:text-3xl font-black text-[#6B3F2A] flex items-baseline gap-1">
                        <span className="text-sm md:text-base font-bold">Rs.</span>
                        {totalPrice.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Body - Scrollable */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 lg:px-14 py-2">
                    <p className="text-[#6F5A4A] text-base md:text-lg lg:text-xl font-light leading-relaxed mb-6 opacity-80">
                      {platter.description}
                    </p>

                    {/* Variations Selector - Modern Styling */}
                    <div className="mb-6 p-4 md:p-6 rounded-2xl bg-white/40 border border-[#E3D6C6]/50">
                      <VariationSelector
                        config={variationConfig}
                        selections={selections}
                        onSimpleSelect={() => {}} // Not used for platters
                        onCategorySelect={selectCategoryVariation}
                        errors={validation.errors}
                        warnings={validation.warnings}
                      />
                    </div>
                  </div>

                  {/* Footer - Persistent */}
                  <div className="p-6 md:p-10 lg:p-14 lg:pt-6 pt-4 bg-[#FAF3E6] z-10 border-t border-[#E3D6C6]/20 shrink-0">
                    <div className="flex items-center gap-4 md:gap-6">
                      <AddToCartButtonForPlatters
                        platter={platter}
                        selectedVariations={getFlattenedVariations()}
                        onClick={handleItemAdded}
                        disabled={platter.status === "out of stock" || !isValid}
                        className="w-full sm:w-auto !mt-0 !px-8 md:!px-12 !py-4 md:!py-5 !rounded-2xl !text-lg md:!text-xl shadow-[0_20px_40px_-10px_rgba(196,106,71,0.4)]"
                      />
                      
                      <AnimatePresence>
                        {showAddedMessage && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2 text-[#C46A47] font-bold"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#C46A47] text-white flex items-center justify-center shadow-lg">
                              <Check size={18} />
                            </div>
                            <span className="text-sm md:text-base">Added to Bag</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
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
