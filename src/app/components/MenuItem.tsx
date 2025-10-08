"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AddToCartButton from "./AddToCartButton";
import { X, Check } from "lucide-react";

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
  status: "in stock" | "out of stock";
}

interface MenuItemProps {
  item: MenuItemData;
}

const MenuItem: FC<MenuItemProps> = ({ item }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(
    null
  );
  const [showAddedMessage, setShowAddedMessage] = useState(false);

  const itemId = item.id ? item.id.toString() : "0";
  const basePrice = typeof item.price === "number" ? item.price : 0;
  const variationPrice = selectedVariation
    ? parseFloat(selectedVariation.price || "0")
    : 0;
  const totalPrice = basePrice + variationPrice;

  const handleVariationChange = (variation: Variation) => {
    setSelectedVariation(variation);
  };

  const handleItemAdded = () => {
    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 1500);
  };

  return (
    <>
      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowModal(true)}
        className="relative flex flex-col p-4 rounded-2xl cursor-pointer 
        bg-white/70 dark:bg-neutral-900/70 backdrop-blur-lg shadow-lg 
        border border-transparent hover:border-[#741052] transition-all duration-300"
        style={{ height: "26rem" }}
      >
        {/* Out of stock badge */}
        {item.status === "out of stock" && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow-md animate-pulse">
            Out of Stock
          </span>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Image
            src={item.image || "/fallback-image.jpg"}
            alt={item.title}
            className="rounded-xl object-cover w-full h-40 mb-4"
            width={450}
            height={160}
          />
        </motion.div>

        <h2 className="text-xl font-semibold text-[#741052] mb-2">
          {item.title}
        </h2>

        {/* Truncated description with fade-out */}
        <div className="relative flex-1 mb-4">
          <p className="text-sm text-gray-600 line-clamp-3">{item.description}</p>
          <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent"></div>
        </div>

        {/* Price */}
        <p className="font-bold text-lg bg-gradient-to-r from-[#741052] to-[#d0269b] text-transparent bg-clip-text mt-auto">
          Rs.{basePrice.toFixed(2)}
        </p>

        {/* Add to cart button */}
        <motion.button
          whileHover={item.status === "in stock" ? { scale: 1.05 } : {}}
          whileTap={item.status === "in stock" ? { scale: 0.97 } : {}}
          disabled={item.status === "out of stock"}
          className={`mt-3 py-2 px-6 rounded-full font-medium text-white transition-all duration-300
            ${
              item.status === "out of stock"
                ? "bg-gray-400 grayscale animate-pulse cursor-not-allowed"
                : "bg-gradient-to-r from-[#741052] to-[#d0269b] shadow-lg hover:shadow-pink-500/40"
            }`}
        >
          {item.status === "out of stock" ? "Unavailable" : "Add to Cart"}
        </motion.button>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl 
              rounded-2xl p-6 max-w-4xl w-full flex flex-col lg:flex-row shadow-2xl"
            >
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full 
                border border-gray-300 dark:border-gray-700 hover:bg-gradient-to-r from-[#741052] to-[#d0269b] hover:text-white transition"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>

              {/* Left Column - Image */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="lg:w-1/2 flex justify-center items-center mb-6 lg:mb-0"
              >
                <Image
                  src={item.image || "/fallback-image.jpg"}
                  alt={item.title}
                  className="rounded-xl object-cover w-full h-[350px]"
                  width={356}
                  height={350}
                />
              </motion.div>

              {/* Right Column - Details */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:w-1/2 px-4"
              >
                <h2 className="text-2xl font-semibold text-[#741052]">
                  {item.title}
                </h2>
                <p className="text-gray-600 mt-3">{item.description}</p>

                <p className="text-xl font-bold mt-4 bg-gradient-to-r from-[#741052] to-[#d0269b] text-transparent bg-clip-text">
                  Rs.{totalPrice.toFixed(2)}
                </p>

                {/* Variations */}
                {item.variations?.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Variations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.variations.map((variation, index) => (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleVariationChange(variation)}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
                            ${
                              selectedVariation?.name === variation.name
                                ? "border-2 border-transparent bg-gradient-to-r from-[#741052] to-[#d0269b] text-white"
                                : "border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-neutral-800/60 hover:border-[#741052]"
                            }`}
                        >
                          {variation.name} (+Rs.
                          {parseFloat(variation.price).toFixed(2)})
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add to Cart */}
                <div className="mt-6 flex items-center gap-4">
                  <AddToCartButton
                    id={itemId}
                    title={item.title}
                    price={totalPrice}
                    image={item.image}
                    selectedVariations={
                      selectedVariation ? [selectedVariation.name] : undefined
                    }
                    onClick={handleItemAdded}
                    disabled={item.status === "out of stock"}
                    className=""
                  />
                  {showAddedMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex items-center gap-1 text-green-600 text-sm"
                    >
                      <Check size={16} /> Added to cart
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MenuItem;
