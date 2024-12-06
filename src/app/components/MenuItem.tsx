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
  variations: Variation[];
}

interface MenuItemProps {
  item: MenuItemData;
}

const MenuItem: FC<MenuItemProps> = ({ item }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);

  const itemId = item.id ? item.id.toString() : "0"; // Ensure itemId is always a string
  const basePrice = typeof item.price === "number" ? item.price : 0; // Default to 0 if price is undefined
  const variationPrice = selectedVariation ? parseFloat(selectedVariation.price || "0") : 0;
  const totalPrice = basePrice + variationPrice;

  const handleVariationChange = (variation: Variation) => {
    setSelectedVariation(variation);
  };

  return (
    <>
      {/* Menu Item Card */}
      <div
        className="menu-item-card bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-transform transform hover:scale-105"
        onClick={() => setShowModal(true)}
      >
        <Image
          src={item.image || "/fallback-image.jpg"}
          alt={item.title}
          className="rounded-lg object-cover w-full h-48 mb-4"
          width={450}
          height={150}
        />
        <h2 className="font-bold text-xl text-gray-800 mb-2">{item.title}</h2>
        <p className="text-sm text-gray-600 mb-4">{item.description}</p>
        <p className="font-semibold text-lg text-[#741052]">Rs.{basePrice.toFixed(2)}</p>
        <button className="mt-4 py-2 px-4 bg-[#741052] text-white rounded-lg hover:bg-[#5e0d41] transition">
          ADD TO CART
        </button>
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
                src={item.image || "/fallback-image.jpg"}
                alt={item.title}
                className="p-2 g-0 rounded-[15px] object-cover"
                width={450}
                height={250}
              />
            </div>

            {/* Right Column - Details */}
            <div className="lg:w-1/2 px-4">
              {/* Dynamic Title */}
              <h2 className="text-xl font-bold mt-4 lg:mt-0">
                {item.title}
                {selectedVariation && ` (${selectedVariation.name})`}
              </h2>

              <p className="text-gray-600 mt-2">{item.description}</p>
              <p className="text-lg font-semibold mt-4 text-[#741052]">Rs.{totalPrice.toFixed(2)}</p>

              {/* Variations - Radio Buttons */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">Variations</label>
                <div className="space-y-2">
                  {item.variations && item.variations.length > 0 ? (
                    item.variations.map((variation, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="radio"
                          id={`variation-${index}`}
                          name={`variation-${item.id}`}
                          value={variation.name}
                          onChange={() => handleVariationChange(variation)}
                          checked={selectedVariation?.name === variation.name}
                          className="mr-2"
                        />
                        <label htmlFor={`variation-${index}`} className="text-sm text-gray-800">
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
                id={itemId}
                title={item.title}
                price={totalPrice}
                image={item.image}
                selectedVariations={
                  selectedVariation
                    ? [`${selectedVariation.name}`] // Only show name without price in the cart
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItem;
