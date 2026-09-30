'use client'

import { FC } from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

interface AddToCartButtonProps {
  id: string;
  title: string;
  price: number;
  image: string;
  selectedVariations: string[] | undefined;
  onClick: () => void;
  onAddRequest?: () => void;
  className: string;
  disabled: boolean;
  showAdded?: boolean;
}

const AddToCartButton: FC<AddToCartButtonProps> = ({
  id,
  title,
  price,
  image,
  selectedVariations = [],
  onClick,
  onAddRequest,
  className,
  disabled,
  showAdded = false,
}) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (!disabled) {
      if (onAddRequest) {
        onAddRequest();
      } else {
        addToCart({
          id,
          title,
          price,
          quantity: 1,
          image,
          variations: selectedVariations,
        });
        onClick();
      }
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      className={`relative overflow-hidden rounded-full px-6 py-2 mt-4 transition-all duration-300 ease-in-out ${
        disabled
          ? "bg-slate-600 cursor-not-allowed opacity-75 text-gray-200"
          : "bg-gradient-to-r from-[#5c0d40] to-[#8a1c5a] hover:scale-105 hover:shadow-lg text-white active:scale-95"
      } ${className}`}
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
              <span className="text-[16px] font-bold text-white tracking-wide">Added!</span>
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
              <span className="text-[16px] font-bold text-white tracking-wide">Add to Cart</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
};

export default AddToCartButton;
