'use client'

import { FC } from "react";
import { useCart } from "../context/CartContext"; // Assuming you're using a CartContext for managing the cart state

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
    categories: Category[]; // Ensure platter has categories
    additionalChoices: AdditionalChoice[];
  };
  selectedVariations: string[]; // Flattened variations array
  onClick: () => void; // Function to trigger the action when clicked (e.g., close the modal)
  className: string; // Add any custom class for styling
  disabled: boolean; // Disable the button if required
}

const AddToCartButtonForPlatters: FC<AddToCartButtonForPlattersProps> = ({
  platter,
  selectedVariations,
  onClick,
  className,
  disabled,
}) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      id: platter.id,
      title: platter.title,
      price: platter.basePrice,
      quantity: 1,
      image: platter.image,
      variations: selectedVariations,
    });
    onClick(); // Trigger parent action after adding to cart (e.g., closing the modal)
  };

  return (
  <button
  onClick={handleAddToCart}
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
