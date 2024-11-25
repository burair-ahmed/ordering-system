// AddToCartButton.tsx
import { FC } from "react";
import { useCart } from "../context/CartContext"; // Importing Cart Context

interface AddToCartButtonProps {
  id: string;  // Ensuring the id is a string as required by the cart context
  title: string;
  price: number;
}

const AddToCartButton: FC<AddToCartButtonProps> = ({ id, title, price }) => {
  const { addToCart } = useCart(); // Destructure the addToCart function from context

  const handleAddToCart = () => {
    addToCart({
      id,       // ID of the item
      title,    // Title of the item
      price,    // Price of the item
      quantity: 1, // Default quantity is 1
    });
  };

  return (
    <button
      onClick={handleAddToCart}
      className="bg-[#741052] rounded-[5px] px-4 py-1 mt-4"
    >
      <div className="flex items-center gap-2 mx-auto ">
        <h1 className="text-[18px] font-bold text-white ">Add to Cart</h1>
      </div>
    </button>
  );
};

export default AddToCartButton;
