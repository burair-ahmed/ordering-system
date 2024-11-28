import { FC, useState } from "react";
import Image from "next/image";
import AddToCartButton from "./AddToCartButton";

interface Variation {
  name: string;
  price: string;
}

interface MenuItemData {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  variations: Variation[]; // Updated type for variations
}

interface MenuItemProps {
  item: MenuItemData;
}

const MenuItem: FC<MenuItemProps> = ({ item }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<Variation[]>([]);

  // Ensure price is a number before using toFixed
  const price = typeof item.price === "number" ? item.price : parseFloat(item.price);

  // Check if item.id is defined before using toString()
  const itemId = item.id ? item.id.toString() : "";

  // Handle checkbox state for variations
  const handleVariationChange = (event: React.ChangeEvent<HTMLInputElement>, variation: Variation) => {
    if (selectedVariations.includes(variation)) {
      setSelectedVariations(selectedVariations.filter((v) => v.name !== variation.name));
    } else {
      setSelectedVariations([...selectedVariations, variation]);
    }
  };

  return (
    <>
      {/* Menu Item Card */}
      <div className="menu-item-card" onClick={() => setShowModal(true)}>
        <Image
          src={item.image || '/fallback-image.jpg'}
          alt={item.title}
          className="p-2 g-0 rounded-[15px]"
          width={450}
          height={150}
        />
        <h2 className="font-extrabold text-lg">{item.title}</h2>
        <p className="text-xs mb-3">{item.description}</p>
        <p className="font-bold mb-2">Rs.{price.toFixed(2)}</p>
        <button className="cartBtn">ADD TO CART</button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full relative flex flex-col lg:flex-row">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            {/* Left Column - Image */}
            <div className="lg:w-1/2 flex justify-center items-center mb-4 lg:mb-0">
              <Image
                src={item.image || '/fallback-image.jpg'}
                alt={item.title}
                className="p-2 g-0 rounded-[15px]"
                width={450}
                height={150}
              />
            </div>

            {/* Right Column - Details */}
            <div className="lg:w-1/2 px-4">
              <h2 className="text-xl font-bold mt-4 lg:mt-0">{item.title}</h2>
              <p className="text-gray-600 mt-2">{item.description}</p>
              <p className="text-lg font-bold mt-4">Rs.{price.toFixed(2)}</p>

              {/* Variations - Checkboxes */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Variations</label>
                <div className="space-y-2">
                  {item.variations && item.variations.length > 0 ? (
                    item.variations.map((variation, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`variation-${index}`}
                          value={variation.name}
                          onChange={(e) => handleVariationChange(e, variation)}
                          checked={selectedVariations.some((v) => v.name === variation.name)}
                          className="mr-2"
                        />
                        <label htmlFor={`variation-${index}`} className="text-sm">
                          {variation.name} (+Rs.{parseFloat(variation.price).toFixed(2)})
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No variations available.</p>
                  )}
                </div>
              </div>

              {/* Add to Cart Button */}
              <AddToCartButton
                id={itemId} // Pass itemId safely
                title={item.title}
                price={price} // Pass price as a number
                selectedVariations={selectedVariations.map((v) => `${v.name} (+${v.price})`)} // Pass selected variations as strings
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItem;
