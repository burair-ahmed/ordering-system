// AddToCartButton.tsx
import { FC } from "react";
import { useCart } from "../context/CartContext"; 

interface AddToCartButtonProps {
  id: string;
  title: string;
  price: number;
  image: string;
  selectedVariations: string[] | undefined; // Matches expected type
}



const AddToCartButton: FC<AddToCartButtonProps> = ({ id, title, price, image, selectedVariations = [] }) => {
  const { addToCart } = useCart(); 

  const handleAddToCart = () => {
    addToCart({
      id,
      title,
      price,
      quantity: 1,
      image,  // Pass image here
      variations: selectedVariations,
    });    
  };

  return (
    <button
      onClick={handleAddToCart}
      className="bg-[#741052] rounded-[5px] px-4 py-1 mt-4"
    >
      <div className="flex items-center gap-2 mx-auto">
        <h1 className="text-[18px] font-bold text-white">Add to Cart</h1>
      </div>
    </button>
  );
};

export default AddToCartButton;
