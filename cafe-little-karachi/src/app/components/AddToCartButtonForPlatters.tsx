'use client'

import { FC } from "react";

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
}

const AddToCartButtonForPlatters: FC<AddToCartButtonForPlattersProps> = ({
  onAddRequest,
  className,
  disabled,
}) => {
  return (
    <button
      onClick={onAddRequest}
      className={`relative overflow-hidden rounded-full px-6 py-2 mt-4 transition-all duration-300 ease-in-out 
        ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#5c0d40] to-[#8a1c5a] hover:scale-105 hover:shadow-lg"} 
        ${className}`}
      disabled={disabled}
    >
      <div className="flex items-center gap-2 mx-auto">
        <h1 className="text-[16px] font-semibold text-white tracking-wide">
          Add to Cart
        </h1>
      </div>
    </button>
  );
};

export default AddToCartButtonForPlatters;
