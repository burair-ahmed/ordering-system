import { FC, useState } from "react";
import Image from "next/image";
import AddToCartButton from "./AddToCartButton";

interface MenuItemData {
  id: number;
  name: string;
  description: string;
  price: number;
}

interface MenuItemProps {
  item: MenuItemData;
}

const MenuItem: FC<MenuItemProps> = ({ item }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Menu Item Card */}
      <div
        className="menu-item-card"
        onClick={() => setShowModal(true)} // Open modal on click
      >
        <Image
          src="/items/platter.jpeg"
          alt={item.name}
          className="p-2 g-0 rounded-[15px]"
          width={450}
          height={150}
        />
        <h2 className="font-extrabold text-lg">{item.name}</h2>
        <p className="text-xs mb-3">{item.description}</p>
        <p className="font-bold mb-2">${item.price}</p>
        <button className="cartBtn">ADD TO CART</button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full relative flex flex-col lg:flex-row">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-800"
              onClick={() => setShowModal(false)} // Close modal
            >
              ✕
            </button>

            {/* Left Column - Image */}
            <div className="lg:w-1/2 flex justify-center items-center mb-4 lg:mb-0">
              <Image
                src="/items/platter.jpeg"
                alt={item.name}
                className="rounded-md"
                width={300}
                height={300}
              />
            </div>

            {/* Right Column - Details */}
            <div className="lg:w-1/2 px-4">
              <h2 className="text-xl font-bold mt-4 lg:mt-0">{item.name}</h2>
              <p className="text-gray-600 mt-2">{item.description}</p>
              <p className="text-lg font-bold mt-4">${item.price.toFixed(2)}</p>

              {/* Variations */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Variations</label>
                <select className="border rounded px-4 py-2 w-full">
                  <option>Small</option>
                  <option>Medium</option>
                  <option>Large</option>
                </select>
              </div>

              {/* Add to Cart Button */}
              <AddToCartButton
                id={item.id.toString()} // Use item.id as a string
                title={item.name}
                price={item.price}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItem;
