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
      className={`bg-[#741052] rounded-[5px] px-4 py-1 mt-4 ${className} ${disabled ? "bg-gray-400 cursor-not-allowed" : ""}`} // Apply disabled styles
      disabled={disabled} // Disable the button if `disabled` is true
    >
      <div className="flex items-center gap-2 mx-auto">
        <h1 className="text-[18px] font-bold text-white">Add to Cart</h1>
      </div>
    </button>
  );
};

export default AddToCartButton;
