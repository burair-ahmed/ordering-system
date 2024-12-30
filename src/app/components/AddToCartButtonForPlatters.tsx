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
  selectedOptions: { [key: string]: string }; // The selected options (categories)
  selectedAdditionalChoices: { [key: string]: string }; // Selected additional choices by UUID
  onClick: () => void; // Function to trigger the action when clicked (e.g., close the modal)
  className: string; // Add any custom class for styling
  disabled: boolean; // Disable the button if required
}

const AddToCartButtonForPlatters: FC<AddToCartButtonForPlattersProps> = ({
  platter,
  selectedOptions,
  selectedAdditionalChoices,
  onClick,
  className,
  disabled,
}) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    const variations = [
      ...Object.entries(selectedOptions).map(([key, value]) => {
        const category = platter.categories.find((cat) => cat.categoryName === key);
        return category ? `${category.categoryName}: ${value}` : value;
      }),
      ...Object.entries(selectedAdditionalChoices).map(([uuid, value]) => {
        const additionalChoice = platter.additionalChoices.find((choice) => 
          choice.options.some((opt) => opt.uuid === uuid)
        );
        return additionalChoice ? `${additionalChoice.heading}: ${value}` : value;
      }),
    ];

    addToCart({
      id: platter.id,
      title: platter.title,
      price: platter.basePrice, // No price adjustment for additional choices
      quantity: 1,
      image: platter.image,
      variations,
    });
    onClick(); // Trigger parent action after adding to cart (e.g., closing the modal)
  };

  return (
    <button
      onClick={handleAddToCart}
      className={`bg-[#741052] rounded-[5px] px-4 py-1 mt-4 ${className} ${disabled ? "bg-gray-400 cursor-not-allowed" : ""}`}
      disabled={disabled}
    >
      <div className="flex items-center gap-2 mx-auto">
        <h1 className="text-[18px] font-bold text-white">Add to Cart</h1>
      </div>
    </button>
  );
};

export default AddToCartButtonForPlatters;
