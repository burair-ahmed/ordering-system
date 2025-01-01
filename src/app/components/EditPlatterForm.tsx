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
    image: item.image || "", // Existing image as base64
    additionalChoices: item.additionalChoices || [],
    categories: item.categories || [],
    status: item.status || "in stock",
  });

  const [loading, setLoading] = useState(false); // Loading state

  useEffect(() => {
    // Any logic that you need to perform when the component loads can be added here
  }, []);

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
    
    setLoading(true); // Start loading state

    try {
      // Log the formData to ensure the correct values are being sent
      console.log('Submitting platter data:', {
        id: item._id,
        ...formData,
      });

      const response = await fetch("/api/updatePlatter", {  // Adjust to your correct API path
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item._id,  // Ensure _id or id from props is passed correctly
          ...formData,   // All form fields
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Error details:", data);
        throw new Error("Failed to update platter");
      }

      // Handle the update success
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating platter:", error);
      alert('There was an issue updating the platter. Please try again.');
    } finally {
      setLoading(false); // End loading state
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full">
        {/* Render Preloader if loading */}
        {loading && <Preloader />}
        
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Edit Platter</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Content */}
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                name="platterCategory"
                value={formData.platterCategory}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2"
              >
                <option value="in stock">In Stock</option>
                <option value="out of stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Additional Choices</label>
            {formData.additionalChoices.map((choice, index) => (
              <div key={index} className="mb-2">
                <div>
                  <input
                    type="text"
                    value={choice.heading}
                    onChange={(e) =>
                      handleAdditionalChoiceChange(index, "heading", e.target.value)
                    }
                    placeholder="Choice Heading"
                    className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 mb-2"
                  />
                </div>
                {choice.options.map((option, i) => (
                  <div key={i} className="flex items-center gap-4 mb-2">
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) =>
                        handleAdditionalChoiceChange(index, "name", e.target.value, i)
                      }
                      placeholder="Option Name"
                      className="flex-1 border border-gray-300 rounded-md shadow-sm px-4 py-2"
                    />
                  </div>
                ))}
              </div>
            ))}
            <button
              type="button"
              onClick={addChoice}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Add Choice
            </button>
            <div className="space-y-4 mt-6">
              <label className="block text-sm font-medium text-gray-700">Categories</label>
              {formData.categories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="mb-2">
                  <input
                    type="text"
                    value={category.categoryName}
                    onChange={(e) =>
                      handleCategoryChange(categoryIndex, "categoryName", e.target.value)
                    }
                    placeholder="Category Name"
                    className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 mb-2"
                  />
                  {category.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-4 mb-2">
                      <input
                        type="text"
                        value={option.name}
                        onChange={(e) =>
                          handleCategoryOptionChange(categoryIndex, optionIndex, e.target.value)
                        }
                        placeholder="Option Name"
                        className="flex-1 border border-gray-300 rounded-md shadow-sm px-4 py-2"
                      />
                    </div>
                  ))}
                </div>
              ))}
              <button
                type="button"
                onClick={addCategory}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Add Category
              </button>
            </div>
          </div>
          <div className="col-span-2 text-center mt-6 flex justify-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlatterForm;
