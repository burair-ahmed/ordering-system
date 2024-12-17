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
  status: "in stock" | "out of stock"; // Add status field
}

interface MenuItemProps {
  item: MenuItemData;
}

const MenuItem: FC<MenuItemProps> = ({ item }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [showAddedMessage, setShowAddedMessage] = useState(false);

  const itemId = item.id ? item.id.toString() : "0";
  const basePrice = typeof item.price === "number" ? item.price : 0;
  const variationPrice = selectedVariation ? parseFloat(selectedVariation.price || "0") : 0;
  const totalPrice = basePrice + variationPrice;

  const handleVariationChange = (variation: Variation) => {
    setSelectedVariation(variation);
  };

  const handleItemAdded = () => {
    setShowAddedMessage(true);
    setTimeout(() => {
      setShowAddedMessage(false);
      setTimeout(() => setShowModal(false), 200);
    }, 200);
  };

  return (
    <>
      {/* Menu Item Card */}
      <div
        className="menu-item-card bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-transform transform hover:scale-105 flex flex-col"
        onClick={() => setShowModal(true)}
        style={{ height: "24rem" }}
      >
        <Image
          src={item.image || "/fallback-image.jpg"}
          alt={item.title}
          className="rounded-lg object-cover w-full h-40 mb-4"
          width={450}
          height={150}
        />
        <h2 className="font-bold text-xl text-gray-800 mb-2">{item.title}</h2>
        <p
          className="text-sm text-gray-600 mb-4 overflow-hidden text-ellipsis"
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            overflow: "hidden",
          }}
        >
          {item.description}
        </p>
        <p className="font-semibold text-lg text-[#741052] mt-auto">Rs.{basePrice.toFixed(2)}</p>

        {/* Conditionally disable the button based on item stock */}
        <button
          className={`mt-2 py-2 px-4 rounded-lg transition ${
            item.status === "out of stock"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#741052] hover:bg-[#5e0d41]"
          } text-white`}
          disabled={item.status === "out of stock"}
        >
          ADD TO CART
        </button>

        {/* Display "Out of Stock" message if the item is out of stock */}
        {item.status === "out of stock" && (
          <p className="mt-2 text-center text-red-500 font-semibold">Out of Stock</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full relative flex flex-col lg:flex-row border-4 border-[#741052]">
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
                className="p-2 g-0 rounded-[15px] object-cover w-full h-[350px]"
                width={356}
                height={350}
              />
            </div>

            {/* Right Column - Details */}
            <div className="lg:w-1/2 px-4">
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
              <div className="flex gap-4 items-center align-center">
                <AddToCartButton
                  id={itemId}
                  title={item.title}
                  price={totalPrice}
                  image={item.image}
                  selectedVariations={selectedVariation ? [`${selectedVariation.name}`] : undefined}
                  onClick={handleItemAdded}
                  className=""
                  disabled={item.status === "out of stock"} // Disable the Add to Cart button in modal as well
                />
                {showAddedMessage && (
                  <p className="text-sm text-green-500 flex items-center text-center mt-4">{item.title} added to cart</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItem;
