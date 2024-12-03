"use client";

import { useState } from "react";

const AddMenuItemForm = () => {
  const [enableVariations, setEnableVariations] = useState(false);
  const [variations, setVariations] = useState<{ name: string; price: string }[]>([
    { name: "", price: "" },
  ]);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    image: null as File | string | null,
    description: "",
    category: "",
  });

  const categories = [
    "Charming Chai", "Paratha Performance", "Beast BBQ", "Rolls Royce",
    "Very Fast Food", "Burger-E-Karachi", "Woodfired Pizza", "Shawarmania",
    "French Boys Fries", "Dashing Desserts", "Chicken Karahis",
    "Mutton Karahis", "Handi & Qeema", "Beverages", "Juicy Lucy", "Very Extra",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVariationChange = (
    index: number,
    field: keyof { name: string; price: string },
    value: string
  ) => {
    const updatedVariations = [...variations];
    updatedVariations[index][field] = value;
    setVariations(updatedVariations);
  };

  const addVariation = () => {
    setVariations((prev) => [...prev, { name: "", price: "" }]);
  };

  const removeVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.image || !formData.description || !formData.category) {
      alert("All fields except variations are required!");
      return;
    }

    const menuItemData = {
      ...formData,
      variations: enableVariations
        ? variations.filter((v) => v.name.trim() !== "" && v.price.trim() !== "")
        : [],
    };

    try {
      const response = await fetch("/api/menuitems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menuItemData),
      });

      if (response.ok) {
        alert("Menu item added successfully!");
        setFormData({
          title: "",
          price: "",
          image: null,
          description: "",
          category: "",
        });
        setEnableVariations(false);
        setVariations([{ name: "", price: "" }]);
      } else {
        const errorData = await response.json();
        alert(`Failed to add menu item: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred. Please try again.");
    }
  };
  
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-4">Add Menu Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="border rounded px-4 py-2 w-full"
            placeholder="Enter menu item title"
            required
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-1">
            Price (Rs.)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            className="border rounded px-4 py-2 w-full"
            placeholder="Enter price"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="border rounded px-4 py-2 w-full"
            required
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Image */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-1">
            Image
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#731351] hover:file:bg-blue-100"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Short Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="border rounded px-4 py-2 w-full"
            placeholder="Enter a short description"
            rows={3}
            required
          ></textarea>
        </div>

        {/* Enable Variations */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enableVariations}
              onChange={(e) => setEnableVariations(e.target.checked)}
              className="custom-checkbox"
            />
            <span className="text-sm font-medium">Variations</span>
          </label>
        </div>

        {/* Variations */}
        {enableVariations && (
          <div>
            <label className="block text-sm font-medium mb-1">Variations</label>
            {variations.map((variation, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={variation.name}
                  onChange={(e) => handleVariationChange(index, "name", e.target.value)}
                  className="border rounded px-4 py-2 w-1/2"
                  placeholder={`Variation ${index + 1}`}
                />
                <input
                  type="number"
                  value={variation.price}
                  onChange={(e) => handleVariationChange(index, "price", e.target.value)}
                  className="border rounded px-4 py-2 w-1/3"
                  placeholder="Price (Rs.)"
                />
                {variations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariation(index)}
                    className="text-[#731351] font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addVariation}
              className="text-[#731351] font-bold text-sm"
            >
              + Add Variation
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-[#731351] text-white px-4 py-2 rounded font-bold w-full"
        >
          Add Menu Item
        </button>
      </form>
    </div>
  );
};

export default AddMenuItemForm;
