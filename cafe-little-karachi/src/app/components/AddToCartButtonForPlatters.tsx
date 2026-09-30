'use client'

import { FC } from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Define CategoryOption and Category types
interface CategoryOption {
  name: string;
}

interface Category {
  categoryName: string;
  options: CategoryOption[];
}

interface AdditionalChoiceOption {
  name: string;
  uuid: string;
}

interface AdditionalChoice {
  heading: string;
  options: AdditionalChoiceOption[];
}

interface AddToCartButtonForPlattersProps {
  platter: {
    id: string;
    title: string;
    basePrice: number;
    image: string;
    description: string;
    categories: Category[];
    additionalChoices: AdditionalChoice[];
  };
  selectedVariations: string[];
  /**
   * Called when the button is pressed. The parent (PlatterItem) is responsible
   * for checking whether an order type is already set before actually calling
   * addToCart. If the order type is not set, PlatterItem will open the location
   * modal and queue the cart add for later.
   */
  onAddRequest: () => void;
  onClick: () => void; // analytics / "added" message callback (fires AFTER cart add)
  className: string;
  disabled: boolean;
  showAdded?: boolean;
}

const AddToCartButtonForPlatters: FC<AddToCartButtonForPlattersProps> = ({
  onAddRequest,
  className,
  disabled,
  showAdded = false,
}) => {
  return (
    <button
      onClick={onAddRequest}
      className={`relative overflow-hidden rounded-full px-6 py-2 mt-4 transition-all duration-300 ease-in-out 
        ${disabled
          ? "bg-gray-400 cursor-not-allowed text-gray-200"
          : "bg-gradient-to-r from-[#5c0d40] to-[#8a1c5a] hover:scale-105 hover:shadow-lg text-white active:scale-95"
        } 
        ${className}`}
      disabled={disabled}
    >
      <div className="flex items-center justify-center min-h-[24px]">
        <AnimatePresence mode="wait" initial={false}>
          {showAdded ? (
            <motion.div
              key="added"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center justify-center gap-1.5"
            >
              <Check size={17} strokeWidth={2.5} className="text-white" />
              <span className="text-[16px] font-semibold text-white tracking-wide">Added!</span>
            </motion.div>
          ) : (
            <motion.div
              key="add-to-cart"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <span className="text-[16px] font-semibold text-white tracking-wide">Add to Cart</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
};

export default AddToCartButtonForPlatters;
