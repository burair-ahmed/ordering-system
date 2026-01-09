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
}

interface MenuItemModalProps {
  item: MenuItemData;
  isOpen: boolean;
  onClose: () => void;
}

export const MenuItemModal: FC<MenuItemModalProps> = ({ item, isOpen, onClose }) => {
  const [showAddedMessage, setShowAddedMessage] = useState(false);

  const itemId = item.id ? item.id.toString() : "0";
  const basePrice = typeof item.price === "number" ? item.price : (typeof (item as any).basePrice === "number" ? (item as any).basePrice : 0);

  const variationConfig: VariationConfig = useMemo(() => ({
    simpleVariations: item.variations?.map((v, index) => ({
      id: `variation-${index}`,
      name: v.name,
      price: parseFloat(v.price) || 0
    })),
    simpleSelection: 'single',
    allowMultipleCategories: false,
  }), [item.variations]);

  const {
    selections,
    totalPrice,
    validation,
    selectSimpleVariation,
    getFlattenedVariations,
    isValid
  } = useVariationSelector(variationConfig, basePrice);

  const handleItemAdded = () => {
    posthog.capture('tcc_journey_add_item', {
      item_id: itemId,
      item_name: item.title,
      price: totalPrice,
      has_variations: selections.simple !== null
    });
    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
          >
            <button
              className="absolute top-4 right-4 md:top-6 md:right-6 z-[60] p-2 md:p-2.5 rounded-full bg-white/40 hover:bg-[#C46A47] text-[#2E1C14] hover:text-white transition-all backdrop-blur-md border border-white/20 shadow-lg"
              onClick={onClose}
            >
              <X size={20} className="md:w-[24px] md:h-[24px]" />
            </button>

            <div className="flex flex-col lg:flex-row bg-[#FAF3E6] rounded-[32px] overflow-hidden border border-white/20 flex-1 min-h-0">
              <div className="lg:w-1/2 relative min-h-[350px] lg:min-h-[600px] lg:self-stretch overflow-hidden shrink-0">
                <Image
                  src={item.image || "/fallback-image.jpg"}
                  alt={item.title}
                  className="object-cover"
                  fill
                  priority
                  unoptimized={true}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#FAF3E6]" />
              </div>

              <div className="lg:w-1/2 flex flex-col h-full bg-[#FAF3E6] min-h-0">
                <div className="p-6 md:p-10 lg:p-14 lg:pb-6 pb-4 shrink-0 bg-[#FAF3E6] z-10">
                  <span className="inline-block text-[#C46A47] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-3">
                    Signature Selection
                  </span>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#6B3F2A] tracking-tighter leading-tight mb-2">
                    {item.title}
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

                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 lg:px-14 py-2">
                  <p className="text-[#6F5A4A] text-base md:text-lg lg:text-xl font-light leading-relaxed mb-6 opacity-80">
                    {item.description}
                  </p>

                  {variationConfig.simpleVariations && variationConfig.simpleVariations.length > 0 && (
                    <div className="mb-6 p-4 md:p-6 rounded-2xl bg-white/40 border border-[#E3D6C6]/50">
                      <VariationSelector
                        config={variationConfig}
                        selections={selections}
                        onSimpleSelect={selectSimpleVariation}
                        onCategorySelect={() => {}}
                        errors={validation.errors}
                        warnings={validation.warnings}
                      />
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-10 lg:p-14 lg:pt-6 pt-4 bg-[#FAF3E6] z-10 border-t border-[#E3D6C6]/20 shrink-0">
                  <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                    <AddToCartButton
                      id={itemId}
                      title={item.title}
                      price={totalPrice}
                      image={item.image}
                      selectedVariations={getFlattenedVariations()}
                      onClick={handleItemAdded}
                      disabled={item.status === "out of stock" || !isValid}
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
                          <span className="text-sm md:text-base">Added to Cart</span>
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
  );
};
