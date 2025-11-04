/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import React, { useState, useEffect } from "react";
import Preloader from "./Preloader"; // Adjust the import path if needed

interface Option {
  name: string;
  uuid: string;
}

interface AdditionalChoice {
  heading: string;
  options: Option[];
}

interface Category {
  categoryName: string;
  options: { name: string }[];
}

interface EditPlatterFormProps {
  item: {
    _id: string;
    title: string;
    description: string;
    basePrice: number;
    platterCategory: string;
    image: string;
    additionalChoices: AdditionalChoice[];
    categories: Category[];
    status: "in stock" | "out of stock";
  };
  onClose: () => void;
  onUpdate: () => void;
}

const EditPlatterForm: React.FC<EditPlatterFormProps> = ({ item, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: item.title || "",
    description: item.description || "",
    basePrice: item.basePrice || 0,
    platterCategory: item.platterCategory || "",
    image: item.image || "",
    additionalChoices: item.additionalChoices || [],
    categories: item.categories || [],
    status: item.status || "in stock",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalChoiceChange = (index: number, field: string, value: string, optionIndex?: number) => {
    if (optionIndex !== undefined) {
      const updatedChoices = formData.additionalChoices.map((choice, i) =>
        i === index
          ? {
              ...choice,
              options: choice.options.map((option, j) =>
                j === optionIndex ? { ...option, name: value } : option
              ),
            }
          : choice
      );
      setFormData({ ...formData, additionalChoices: updatedChoices });
    } else {
      const updatedChoices = formData.additionalChoices.map((choice, i) =>
        i === index ? { ...choice, [field]: value } : choice
      );
      setFormData({ ...formData, additionalChoices: updatedChoices });
    }
  };

  const addChoice = () => {
    setFormData({
      ...formData,
      additionalChoices: [
        ...formData.additionalChoices,
        { heading: "", options: [{ name: "", uuid: "" }] },
      ],
    });
  };

  const addCategory = () => {
    setFormData({
      ...formData,
      categories: [
        ...formData.categories,
        { categoryName: "", options: [{ name: "" }] },
      ],
    });
  };

  const handleCategoryChange = (index: number, field: string, value: string) => {
    const updatedCategories = formData.categories.map((category, i) =>
      i === index ? { ...category, [field]: value } : category
    );
    setFormData({ ...formData, categories: updatedCategories });
  };

  const handleCategoryOptionChange = (categoryIndex: number, optionIndex: number, value: string) => {
    const updatedCategories = formData.categories.map((category, i) =>
      i === categoryIndex
        ? {
            ...category,
            options: category.options.map((option, j) =>
              j === optionIndex ? { ...option, name: value } : option
            ),
          }
        : category
    );
    setFormData({ ...formData, categories: updatedCategories });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/updatePlatter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, ...formData }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error("Failed to update platter");

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating platter:", error);
      alert("There was an issue updating the platter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 ">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[600px] overflow-y-auto">
        {loading && <Preloader />}
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">
          Edit Platter
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#741052] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#741052] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price
              </label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#741052] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <input
                type="text"
                name="platterCategory"
                value={formData.platterCategory}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#741052] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#741052] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#741052] focus:outline-none"
              >
                <option value="in stock">In Stock</option>
                <option value="out of stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Choices
              </label>
              {formData.additionalChoices.map((choice, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
                  <input
                    type="text"
                    value={choice.heading}
                    onChange={(e) =>
                      handleAdditionalChoiceChange(index, "heading", e.target.value)
                    }
                    placeholder="Choice Heading"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 mb-2 focus:ring-2 focus:ring-[#741052] focus:outline-none"
                  />
                  {choice.options.map((option, i) => (
                    <input
                      key={i}
                      type="text"
                      value={option.name}
                      onChange={(e) =>
                        handleAdditionalChoiceChange(index, "name", e.target.value, i)
                      }
                      placeholder="Option Name"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 mb-2 focus:ring-2 focus:ring-[#741052] focus:outline-none"
                    />
                  ))}
                </div>
              ))}
              <button
                type="button"
                onClick={addChoice}
                className="w-full px-4 py-2 rounded-lg shadow text-white font-semibold
                           bg-gradient-to-r from-[#741052] to-pink-600 
                           hover:opacity-90 transition-all duration-200"
              >
                + Add Choice
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Categories
              </label>
              {formData.categories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
                  <input
                    type="text"
                    value={category.categoryName}
                    onChange={(e) =>
                      handleCategoryChange(categoryIndex, "categoryName", e.target.value)
                    }
                    placeholder="Category Name"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 mb-2 focus:ring-2 focus:ring-[#741052] focus:outline-none"
                  />
                  {category.options.map((option, optionIndex) => (
                    <input
                      key={optionIndex}
                      type="text"
                      value={option.name}
                      onChange={(e) =>
                        handleCategoryOptionChange(categoryIndex, optionIndex, e.target.value)
                      }
                      placeholder="Option Name"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 mb-2 focus:ring-2 focus:ring-[#741052] focus:outline-none"
                    />
                  ))}
                </div>
              ))}
              <button
                type="button"
                onClick={addCategory}
                className="w-full px-4 py-2 rounded-lg shadow text-white font-semibold
                           bg-gradient-to-r from-[#741052] to-pink-600 
                           hover:opacity-90 transition-all duration-200"
              >
                + Add Category
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="col-span-2 flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg shadow text-white font-semibold
                         bg-gradient-to-r from-[#741052] to-pink-600 
                         hover:opacity-90 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className={`px-6 py-3 rounded-lg shadow text-white font-semibold
                          bg-gradient-to-r from-[#741052] to-pink-600 
                          hover:opacity-90 transition-all duration-200
                          ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? "⏳ Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlatterForm;
