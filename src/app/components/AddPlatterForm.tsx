'use client'

import { useState } from "react";

interface Category {
  categoryName: string; // Only store category name (no options needed)
}

const AddPlatterForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [image, setImage] = useState("");
  const [platterCategory, setPlatterCategory] = useState(""); // Category for the platter
  const [categories, setCategories] = useState<Category[]>([
    { categoryName: "" },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const platterData = {
      title,
      description,
      basePrice,
      image,
      platterCategory, // Include platterCategory in the form submission
      categories,
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
            Image URL
          </label>
          <input
            id="image"
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
            required
          />
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
