import { FC } from "react";
import { useCart } from "../context/CartContext"; 
import { isOpenAt } from "../lib/restaurantStatus";
import { toast } from "sonner";

interface AddToCartButtonProps {
  id: string;
  title: string;
  price: number;
  image: string;
  selectedVariations: string[] | undefined;
  onClick: () => void;
  className: string;
  disabled: boolean;
}

const AddToCartButton: FC<AddToCartButtonProps> = ({
  id,
  title,
  price,
  image,
  selectedVariations = [],
  onClick,
  className,
  disabled,
}) => {
  const { addToCart } = useCart(); 
  const isRestaurantOpen = isOpenAt();

  const handleAddToCart = () => {
    if (!isRestaurantOpen) {
      toast.error("Cafe Little Karachi is currently closed. Ordering opens at 6:30 PM!");
      return;
    }

    if (!disabled) {
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
  };

  const isBtnDisabled = disabled || !isRestaurantOpen;

  return (
    <button
      onClick={handleAddToCart}
      className={`relative overflow-hidden rounded-full px-6 py-2 mt-4 transition-all duration-300 ease-in-out ${
        isBtnDisabled
          ? "bg-slate-600 cursor-not-allowed opacity-75 text-gray-200"
          : "bg-gradient-to-r from-[#5c0d40] to-[#8a1c5a] hover:scale-105 hover:shadow-lg text-white"
      } ${className}`}
      disabled={disabled}
    >
      <div className="flex items-center gap-2 mx-auto">
        <h1 className="text-[16px] font-bold">
          {!isRestaurantOpen ? "Closed (Opens 6:30 PM)" : "Add to Cart"}
        </h1>
      </div>
    </button>
  );
};

export default AddToCartButton;
