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
      disabled={disabled}
      className={`group relative overflow-hidden rounded-2xl px-10 py-4 transition-all duration-500 ease-out font-black text-lg text-white tracking-tight
    ${disabled 
      ? "bg-[#6B3F2A]/10 text-[#6B3F2A]/30 cursor-not-allowed border border-[#6B3F2A]/10 shadow-none" 
      : "bg-[#C46A47] hover:bg-[#A65638] shadow-[0_20px_40px_-10px_rgba(196,106,71,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(196,106,71,0.5)] hover:scale-[1.02] active:scale-95 border-b-4 border-[#8A4A32] hover:border-[#7A412C]"
    } 
    ${className}`}
    >
      {/* Shine effect */}
      {!disabled && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer transition-transform" />
      )}
      
      <div className="relative flex items-center justify-center gap-3">
        <span>{disabled ? "Sold Out" : "Add to Cart"}</span>
      </div>
    </button>
  );
};

export default AddToCartButton;
