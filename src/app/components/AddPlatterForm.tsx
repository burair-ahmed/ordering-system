'use client';

import { useState } from "react";

interface Category {
  categoryName: string; // Only store category name (no options needed)
}

interface AdditionalChoice {
  heading: string;
  options: { name: string }[];
}

const AddPlatterForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [image, setImage] = useState<string | null>(null); // Image as base64 string
  const [platterCategory, setPlatterCategory] = useState(""); // Category for the platter
  const [categories, setCategories] = useState<Category[]>([
    { categoryName: "" },
  ]);
  const [additionalChoices, setAdditionalChoices] = useState<AdditionalChoice[]>([
    { heading: "", options: [{ name: "" }] },
  ]);

  // Handle category name input
  const handleCategoryChange = (index: number, value: string) => {
    const updatedCategories = [...categories];
    updatedCategories[index].categoryName = value;
    setCategories(updatedCategories);
  };

  // Add a new category input
  const handleAddCategory = () => {
    setCategories([...categories, { categoryName: "" }]);
  };

  // Remove a category input
  const handleRemoveCategory = (index: number) => {
    const updatedCategories = [...categories];
    updatedCategories.splice(index, 1);
    setCategories(updatedCategories);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string); // Set image as base64 string
      };
      reader.readAsDataURL(file); // Read file as base64 string
    }
  };

  // Handle additional choice heading change
  const handleChoiceHeadingChange = (index: number, value: string) => {
    const updatedChoices = [...additionalChoices];
    updatedChoices[index].heading = value;
    setAdditionalChoices(updatedChoices);
  };

  // Handle option name change
  const handleOptionNameChange = (choiceIndex: number, optionIndex: number, value: string) => {
    const updatedChoices = [...additionalChoices];
    updatedChoices[choiceIndex].options[optionIndex].name = value;
    setAdditionalChoices(updatedChoices);
  };

  // Add new option under a choice
  const handleAddOption = (choiceIndex: number) => {
    const updatedChoices = [...additionalChoices];
    updatedChoices[choiceIndex].options.push({ name: "" });
    setAdditionalChoices(updatedChoices);
  };

  // Add new additional choice section
  const handleAddChoice = () => {
    setAdditionalChoices([...additionalChoices, { heading: "", options: [{ name: "" }] }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const platterData = {
      title,
      description,
      basePrice,
      image,
      platterCategory,
      categories,
      additionalChoices, // Include additional choices
    };

    try {
      const res = await fetch("/api/platter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(platterData),
      });

      if (res.ok) {
        alert("Platter added successfully!");
      } else {
        alert("Failed to add platter.");
      }
    } catch (error) {
      console.error("Error adding platter:", error);
      alert("Error adding platter.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 border rounded-md shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Add New Platter</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
            Base Price (in Rs)
          </label>
          <input
            id="basePrice"
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(parseFloat(e.target.value))}
            className="mt-1 p-2 border rounded w-full"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Image
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#731351] hover:file:bg-blue-100"
          />
          {image && (
            <div className="mt-2">
              <img src={image} alt="Platter Preview" className="w-40 h-40 object-cover rounded" />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="platterCategory" className="block text-sm font-medium text-gray-700">
            Platter Category
          </label>
          <input
            id="platterCategory"
            type="text"
            value={platterCategory}
            onChange={(e) => setPlatterCategory(e.target.value)}
            placeholder="e.g., Sharing Platter, Chinese Platter"
            className="mt-1 p-2 border rounded w-full"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Categories</label>
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={category.categoryName}
                  onChange={(e) => handleCategoryChange(categoryIndex, e.target.value)}
                  placeholder="Category Name"
                  className="p-2 border rounded w-full"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(categoryIndex)}
                  className="p-2 bg-red-500 text-white rounded"
                >
                  Remove Category
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddCategory}
            className="mt-2 p-2 bg-green-500 text-white rounded"
          >
            Add Category
          </button>
        </div>

        {/* Additional Choices Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Additional Choices</label>
          {additionalChoices.map((choice, index) => (
            <div key={index} className="border p-4 mb-4 rounded">
              <input
                type="text"
                value={choice.heading}
                onChange={(e) => handleChoiceHeadingChange(index, e.target.value)}
                placeholder="Choice Heading"
                className="p-2 border rounded w-full mb-2"
                required
              />
              {choice.options.map((option, optIndex) => (
                <div key={optIndex} className="flex gap-4 mb-2">
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) => handleOptionNameChange(index, optIndex, e.target.value)}
                    placeholder="Option Name"
                    className="p-2 border rounded w-full"
                    required
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddOption(index)}
                className="mt-2 p-2 bg-blue-500 text-white rounded"
              >
                Add Option
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddChoice}
            className="mt-2 p-2 bg-green-500 text-white rounded"
          >
            Add Choice
          </button>
        </div>

        <button
          type="submit"
          className="mt-4 p-3 bg-blue-600 text-white rounded w-full"
        >
          Add Platter
        </button>
      </form>
    </div>
  );
};

export default AddPlatterForm;
