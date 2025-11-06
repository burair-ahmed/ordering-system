/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

"use client";

import { FC, useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AddToCartButtonForPlatters from "./AddToCartButtonForPlatters";
import { X, Check } from "lucide-react";

interface CategoryOption {
  uuid: string;
  name: string;
  title: string;
  price: number;
}

interface Category {
  categoryName: string;
  options: CategoryOption[];
}

interface AdditionalChoice {
  heading: string;
  options: CategoryOption[];
}

interface PlatterItemProps {
  platter: {
    id: string;
    title: string;
    description: string;
    basePrice: number;
    image: string;
    categories: Category[];
    additionalChoices: AdditionalChoice[];
    status: "in stock" | "out of stock";
  };
}

const PlatterItem: FC<PlatterItemProps> = ({ platter }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: string;
  }>({});
  const [selectedAdditionalChoices, setSelectedAdditionalChoices] = useState<{
    [key: string]: string;
  }>({});
  const [categoryItems, setCategoryItems] = useState<{
    [key: string]: CategoryOption[];
  }>({});
  const [showAddedMessage, setShowAddedMessage] = useState(false);

  const fetchCategoryItems = async (categoryName: string) => {
    try {
      const response = await fetch(`/api/getitems?category=${categoryName}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching menu items:", error);
      return [];
    }
  };

  useEffect(() => {
    if (showModal) {
      const fetchItemsForCategories = async () => {
        const itemsForCategories: { [key: string]: CategoryOption[] } = {};
        for (const category of platter.categories) {
          const items = await fetchCategoryItems(category.categoryName);
          itemsForCategories[category.categoryName] = items;
        }
        setCategoryItems(itemsForCategories);
      };
      fetchItemsForCategories();
    }
  }, [showModal]);

  const handleOptionChange = (categoryKey: string, optionName: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [categoryKey]: optionName,
    }));
  };

  const handleAdditionalChoiceChange = (
    choiceHeading: string,
    selectedOptionUuid: string
  ) => {
    const selectedChoice = platter.additionalChoices
      .flatMap((choice) => choice.options)
      .find((option) => option.uuid === selectedOptionUuid);

    if (selectedChoice) {
      setSelectedAdditionalChoices((prev) => ({
        ...prev,
        [choiceHeading]: selectedChoice.name,
      }));
    }
  };

  useEffect(() => {
    if (showModal) {
      setSelectedOptions({});
      setSelectedAdditionalChoices({});
    }
  }, [showModal]);

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
        bg-white/70 backdrop-blur-lg shadow-lg 
        border border-transparent hover:border-[#741052] transition-all duration-300"
        style={{ height: "29rem" }}
      >
        {/* Out of stock badge */}
        {platter.status === "out of stock" && (
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
            src={platter.image || "/fallback-image.jpg"}
            alt={platter.title}
            className="rounded-xl object-cover w-full h-40 mb-4"
            width={450}
            height={160}
            unoptimized={true}
          />
        </motion.div>

        <h2 className="text-xl font-semibold text-[#741052] mb-2">
          {platter.title}
        </h2>

        <div className="relative flex-1 mb-4">
          <p className="text-sm text-gray-600 line-clamp-1">
            {platter.description}
          </p>
          <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        <p className="font-bold text-lg bg-gradient-to-r from-[#741052] to-[#d0269b] text-transparent bg-clip-text mt-auto">
          Rs.{platter.basePrice.toFixed(2)}
        </p>

        <motion.button
          whileHover={platter.status === "in stock" ? { scale: 1.05 } : {}}
          whileTap={platter.status === "in stock" ? { scale: 0.97 } : {}}
          disabled={platter.status === "out of stock"}
          className={`mt-3 py-2 px-6 rounded-full font-medium text-white transition-all duration-300
            ${
              platter.status === "out of stock"
                ? "bg-gray-400 grayscale animate-pulse cursor-not-allowed"
                : "bg-gradient-to-r from-[#741052] to-[#d0269b] shadow-lg hover:shadow-pink-500/40"
            }`}
        >
          {platter.status === "out of stock" ? "Unavailable" : "Add to Cart"}
        </motion.button>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
<motion.div
  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
className="relative bg-white/90 backdrop-blur-xl 
rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col lg:flex-row shadow-2xl"
            >
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full 
                border border-gray-300 hover:bg-gradient-to-r from-[#741052] to-[#d0269b] hover:text-white transition"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>

              {/* Left Column */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="lg:w-1/2 flex justify-center items-center mb-6 lg:mb-0"
              >
                <Image
                  src={platter.image || "/fallback-image.jpg"}
                  alt={platter.title}
                  className="rounded-xl object-cover w-full h-[350px]"
                  width={356}
                  height={350}
                  unoptimized={true}
                />
              </motion.div>

              {/* Right Column */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:w-1/2 px-4"
              >
                <h2 className="text-2xl font-semibold text-[#741052]">
                  {platter.title}
                </h2>
                <p className="text-gray-600 mt-3">{platter.description}</p>
                <p className="text-xl font-bold mt-4 bg-gradient-to-r from-[#741052] to-[#d0269b] text-transparent bg-clip-text">
                  Rs.{platter.basePrice.toFixed(2)}
                </p>

                {/* Categories */}
                <div className="mt-4 space-y-4">
                  {platter.categories?.map((category, categoryIndex) => {
                    const categoryKey = `${category.categoryName}-${categoryIndex}`;
                    return (
                      <div key={categoryIndex}>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          {category.categoryName}
                        </label>
                        <select
                          className="block w-full p-2 border rounded-xl bg-white/70"
                          value={selectedOptions[categoryKey] || ""}
                          onChange={(e) =>
                            handleOptionChange(categoryKey, e.target.value)
                          }
                        >
                          <option value="">Select {category.categoryName}</option>
                          {categoryItems[category.categoryName]?.map(
                            (option, idx) => (
                              <option key={idx} value={option.title}>
                                {option.title}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    );
                  })}

                  {/* Additional Choices */}
                  {platter.additionalChoices?.map((choice, index) => (
                    <div key={index} className="mt-4">
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        {choice.heading}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {choice.options.map((option, idx) => (
                          <motion.button
                            key={idx}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              handleAdditionalChoiceChange(
                                choice.heading,
                                option.uuid
                              )
                            }
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
                              ${
                                selectedAdditionalChoices[choice.heading] ===
                                option.name
                                  ? "border-2 border-transparent bg-gradient-to-r from-[#741052] to-[#d0269b] text-white"
                                  : "border border-gray-300 bg-white/60 hover:border-[#741052]"
                              }`}
                          >
                            {option.name}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add to Cart */}
                <div className="mt-6 flex items-center gap-4">
                  <AddToCartButtonForPlatters
                    platter={platter}
                    selectedOptions={selectedOptions}
                    selectedAdditionalChoices={selectedAdditionalChoices}
                    onClick={handleItemAdded}
                    className=""
                    disabled={platter.status === "out of stock"}
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

export default PlatterItem;
