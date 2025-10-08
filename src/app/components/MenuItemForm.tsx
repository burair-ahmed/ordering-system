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
    "Mutton Karahis", "Handi and Qeema", "Beverages", "Juicy Lucy", "Very Extra", 
    "Marvellous Matka Biryani Chicken/Beef", "BBQ Deals", "Fast Food Deals",
    "Fast Food Platter", "Dawat Deal", "Dhamaka Discount Platter", "Sharing Platters", 
    "Soup", "Gravy", "Rice",
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
<div
  className="max-w-xl mx-auto p-8 rounded-2xl shadow-2xl max-h-[500px]
    bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md border border-white/20 
    transition-all duration-300"
>
  <h2 className="text-3xl font-bold mb-6 text-center 
    bg-gradient-to-r from-[#5c0d40] to-pink-600 bg-clip-text text-transparent">
    Add Menu Item
  </h2>

  {/* Scrollable form */}
  <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#5c0d40] scrollbar-track-transparent">
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="w-full rounded-xl px-4 py-2 border border-neutral-300 dark:border-neutral-700 
            bg-white/70 dark:bg-neutral-800/70 shadow-sm 
            focus:ring-2 focus:ring-[#5c0d40] focus:outline-none transition-all"
          placeholder="Enter menu item title"
          required
        />
      </div>

      {/* Price */}
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300"
        >
          Price (Rs.)
        </label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          className="w-full rounded-xl px-4 py-2 border border-neutral-300 dark:border-neutral-700 
            bg-white/70 dark:bg-neutral-800/70 shadow-sm 
            focus:ring-2 focus:ring-[#5c0d40] focus:outline-none transition-all"
          placeholder="Enter price"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300"
        >
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="w-full rounded-xl px-4 py-2 border border-neutral-300 dark:border-neutral-700 
            bg-white/70 dark:bg-neutral-800/70 shadow-sm 
            focus:ring-2 focus:ring-[#5c0d40] focus:outline-none transition-all"
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
        <label
          htmlFor="image"
          className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300"
        >
          Image
        </label>
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
            file:rounded-full file:border-0 file:text-sm file:font-semibold 
            file:bg-gradient-to-r file:from-[#5c0d40] file:to-pink-600 
            file:text-white hover:file:opacity-90 cursor-pointer"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300"
        >
          Short Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="w-full rounded-xl px-4 py-2 border border-neutral-300 dark:border-neutral-700 
            bg-white/70 dark:bg-neutral-800/70 shadow-sm 
            focus:ring-2 focus:ring-[#5c0d40] focus:outline-none transition-all"
          placeholder="Enter a short description"
          required
        ></textarea>
      </div>

      {/* Enable Variations */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={enableVariations}
          onChange={(e) => setEnableVariations(e.target.checked)}
          className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 
            text-[#5c0d40] focus:ring-[#5c0d40]"
        />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Enable Variations
        </span>
      </div>

      {/* Variations */}
      {enableVariations && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Variations
          </label>
          {variations.map((variation, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/60 dark:bg-neutral-800/60 
                shadow-sm hover:shadow-md transition-all"
            >
              <input
                type="text"
                value={variation.name}
                onChange={(e) =>
                  handleVariationChange(index, "name", e.target.value)
                }
                placeholder={`Variation ${index + 1}`}
                className="flex-1 rounded-lg px-3 py-2 border border-neutral-300 dark:border-neutral-700 
                  bg-transparent focus:ring-2 focus:ring-[#5c0d40] focus:outline-none"
              />
              <input
                type="number"
                value={variation.price}
                onChange={(e) =>
                  handleVariationChange(index, "price", e.target.value)
                }
                placeholder="Price"
                className="w-28 rounded-lg px-3 py-2 border border-neutral-300 dark:border-neutral-700 
                  bg-transparent focus:ring-2 focus:ring-[#5c0d40] focus:outline-none"
              />
              {variations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariation(index)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addVariation}
            className="text-sm font-semibold text-[#5c0d40] hover:underline"
          >
            + Add Variation
          </button>
        </div>
      )}
    </form>
  <button
    type="submit"
    className="w-full mt-4 px-6 py-3 rounded-xl font-semibold shadow-lg 
      bg-gradient-to-r from-[#5c0d40] to-pink-600 text-white 
      hover:opacity-90 transition-all"
  >
    Add Menu Item
  </button>
  </div>

  {/* Submit fixed at bottom */}
</div>

  );
};

export default AddMenuItemForm;
