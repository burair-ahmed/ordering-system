'use client'

import { FC } from "react";
import { useCart } from "../context/CartContext"; // Assuming you're using a CartContext for managing the cart state

// Define CategoryOption and Category types
interface CategoryOption {
  name: string;
  price: number;
}

interface Category {
  categoryName: string;
  options: CategoryOption[];
}

interface AddToCartButtonForPlattersProps {
  platter: {
    id: string;
    title: string;
    basePrice: number;
    image: string;
    description: string;
    categories: Category[]; // Ensure platter has categories
  };
  selectedOptions: { [key: string]: string }; // The selected options (variations)
  onClick: () => void; // Function to trigger the action when clicked (e.g., close the modal)
  className: string; // Add any custom class for styling
  disabled: boolean; // Disable the button if required
}

const AddToCartButtonForPlatters: FC<AddToCartButtonForPlattersProps> = ({
  platter,
  selectedOptions,
  onClick,
  className,
  disabled,
}) => {
  const { addToCart } = useCart(); // Assuming this is a hook to handle cart operations

  // Calculate the total price based on selected options
  const calculateTotalPrice = (): number => {
    let totalPrice = platter.basePrice;

    // Loop through selected options and calculate price adjustments
    Object.entries(selectedOptions).forEach(([categoryName, optionName]) => {
      const category = platter.categories.find((cat) => cat.categoryName === categoryName);
      if (category) {
        const selectedOption = category.options.find((opt) => opt.name === optionName);
        if (selectedOption) {
          totalPrice += selectedOption.price;
        }
      }
    });

    return totalPrice;
  };

  const handleAddToCart = () => {
    const totalPrice = calculateTotalPrice();
    addToCart({
      id: platter.id,
      title: platter.title,
      price: totalPrice,
      quantity: 1,
      image: platter.image,
      variations: Object.values(selectedOptions), // Pass selected options as variations
    });
    onClick(); // Trigger parent action after adding to cart (e.g., closing the modal)
  };

  return (
    <button
      onClick={handleAddToCart}
      className={`bg-[#741052] rounded-[5px] px-4 py-1 mt-4 ${className} ${disabled ? "bg-gray-400 cursor-not-allowed" : ""}`} // Apply disabled styles
      disabled={disabled} // Disable the button if `disabled` is true
    >
      <div className="flex items-center gap-2 mx-auto">
        <h1 className="text-[18px] font-bold text-white">Add to Cart</h1>
      </div>
    </button>
  );
};

export default AddToCartButtonForPlatters;
