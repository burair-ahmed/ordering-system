import { FC } from "react";
import { useCart } from "../context/CartContext"; 

interface AddToCartButtonProps {
  id: string;
  title: string;
  price: number;
  image: string;
  selectedVariations: string[] | undefined;
  onClick: () => void; // Function to trigger the action when clicked
  className: string; // Accept the class to show/hide text in parent component
  disabled: boolean; // Add the disabled prop to handle disabled state
}

const AddToCartButton: FC<AddToCartButtonProps> = ({
  id,
  title,
  price,
  image,
  selectedVariations = [],
  onClick, // Handle button click
  className, // Add class for triggering
  disabled, // Accept disabled prop
}) => {
  const { addToCart } = useCart(); 

  const handleAddToCart = () => {
    if (!disabled) {
      addToCart({
        id,
        title,
        price,
        quantity: 1,
        image, 
        variations: selectedVariations,
      });    
      onClick(); // Trigger parent action on click
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      className={`relative overflow-hidden rounded-2xl px-8 py-3 mt-6 transition-all duration-300 ease-in-out font-bold text-white shadow-lg
    ${disabled ? "bg-gray-300 cursor-not-allowed grayscale" : "bg-gradient-to-r from-[#C46A47] to-[#A65638] hover:scale-[1.03] hover:shadow-[#C46A47]/20"} 
    ${className}`}
      disabled={disabled}
    >
      <div className="flex items-center gap-2 mx-auto">
        <span className="text-lg">Add to Cart</span>
      </div>
    </button>
  );
};

export default AddToCartButton;
