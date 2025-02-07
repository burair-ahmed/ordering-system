import { FC, useState, useEffect } from "react";
import Image from "next/image";
import AddToCartButtonForPlatters from "./AddToCartButtonForPlatters";

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
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [selectedAdditionalChoices, setSelectedAdditionalChoices] = useState<{ [key: string]: string }>({});
  const [categoryItems, setCategoryItems] = useState<{ [key: string]: CategoryOption[] }>({});

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
      [categoryKey]: optionName, // Use a unique key for each category instance
    }));
  };

  const handleAdditionalChoiceChange = (choiceHeading: string, selectedOptionUuid: string) => {
    const selectedChoice = platter.additionalChoices
      .flatMap((choice) => choice.options)
      .find((option) => option.uuid === selectedOptionUuid);

    if (selectedChoice) {
      setSelectedAdditionalChoices((prev) => ({
        ...prev,
        [choiceHeading]: selectedChoice.name, // Store the name here
      }));
    }
  };

  useEffect(() => {
    if (showModal) {
      setSelectedOptions({});
      setSelectedAdditionalChoices({});
    }
  }, [showModal]);

  return (
    <>
      <div
        className="menu-item-card bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-transform transform hover:scale-105 flex flex-col"
        onClick={() => setShowModal(true)}
        style={{ height: "24rem" }}
      >
        <Image
          src={platter.image || "/fallback-image.jpg"}
          alt={platter.title}
          className="rounded-lg object-cover w-full h-40 mb-4"
          width={450}
          height={150}
        />
        <h2 className="font-bold text-xl text-gray-800 mb-2">{platter.title}</h2>
        <p
          className="text-sm text-gray-600 mb-4 overflow-hidden text-ellipsis"
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            overflow: "hidden",
          }}
        >
          {platter.description}
        </p>
        <p className="font-semibold text-lg text-[#741052] mt-auto">Rs.{platter.basePrice.toFixed(2)}</p>
        <button
          className={`mt-2 py-2 px-4 rounded-lg transition ${
            platter.status === "out of stock"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#741052] hover:bg-[#5e0d41]"
          } text-white`}
          disabled={platter.status === "out of stock"}
        >
          ADD TO CART
        </button>
        {platter.status === "out of stock" && (
          <p className="mt-2 text-center text-red-500 font-semibold">Out of Stock</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full relative flex flex-col lg:flex-row border-4 border-[#741052]">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            <div className="lg:w-1/2 flex justify-center items-center mb-4 lg:mb-0">
              <Image
                src={platter.image || "/fallback-image.jpg"}
                alt={platter.title}
                className="p-2 g-0 rounded-[15px] object-cover w-full h-[350px]"
                width={356}
                height={350}
              />
            </div>
            <div className="lg:w-1/2 px-4">
              <h2 className="text-xl font-bold mt-4 lg:mt-0">{platter.title}</h2>
              <p className="text-gray-600 mt-2">{platter.description}</p>
              <p className="text-lg font-semibold mt-4 text-[#741052]">Rs.{platter.basePrice.toFixed(2)}</p>
              <div className="mt-4">
                {platter.categories?.map((category, categoryIndex) => {
                  const categoryKey = `${category.categoryName}-${categoryIndex}`; // Unique key
                  return (
                    <div key={categoryIndex}>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        {category.categoryName}
                      </label>
                      <select
                        className="block w-full p-2 border rounded"
                        value={selectedOptions[categoryKey] || ""}
                        onChange={(e) => handleOptionChange(categoryKey, e.target.value)}
                      >
                        <option value="">Select {category.categoryName}</option>
                        {categoryItems[category.categoryName]?.map((option, idx) => (
                          <option key={idx} value={option.title}>
                            {option.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}

                {platter.additionalChoices?.map((choice, index) => (
                  <div key={index} className="mt-4">
                    <label className="block text-sm font-medium mb-2 text-gray-700">{choice.heading}</label>
                    <div className="flex flex-col">
                      {choice.options.map((option, idx) => (
                        <label key={idx} className="flex items-center mb-2">
                          <input
                            type="radio"
                            name={choice.heading}
                            value={option.uuid}
                            checked={selectedAdditionalChoices[choice.heading] === option.name}
                            onChange={(e) => handleAdditionalChoiceChange(choice.heading, e.target.value)}
                            className="mr-2"
                          />
                          {option.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 items-center align-center">
                <AddToCartButtonForPlatters
                  platter={platter}
                  selectedOptions={selectedOptions}
                  selectedAdditionalChoices={selectedAdditionalChoices}
                  onClick={() => setShowModal(false)}
                  className="w-full"
                  disabled={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlatterItem;
