import { FC } from "react";
import { useCart } from "../context/CartContext"; 

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
      onClick();
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      className={`relative overflow-hidden rounded-full px-6 py-2 mt-4 transition-all duration-300 ease-in-out ${
        disabled
          ? "bg-slate-600 cursor-not-allowed opacity-75 text-gray-200"
          : "bg-gradient-to-r from-[#5c0d40] to-[#8a1c5a] hover:scale-105 hover:shadow-lg text-white"
      } ${className}`}
      disabled={disabled}
    >
      <div className="flex items-center gap-2 mx-auto">
        <h1 className="text-[16px] font-bold">
          Add to Cart
        </h1>
      </div>
    </button>
  );
};

export default AddToCartButton;
