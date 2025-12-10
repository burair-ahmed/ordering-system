import React, { useState, useMemo } from "react";
import { VariationConfig, SimpleVariation } from "../../types/variations";
import { toast } from "sonner";

interface LegacyVariation {
  name: string;
  price: number;
}

interface EditMenuItemFormProps {
  item: {
    _id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    image: string; // Base64 string
    variations: LegacyVariation[];
    status: "in stock" | "out of stock";
  };
  onClose: () => void;
  onUpdate: () => void;
}

const EditMenuItemForm: React.FC<EditMenuItemFormProps> = ({
  item,
  onClose,
  onUpdate,
}) => {
  // Convert legacy variations to VariationConfig
  const variationConfig = useMemo((): VariationConfig => ({
    simpleVariations: (item.variations || []).map((v, index) => ({
      id: `variation-${index}`,
      name: v.name,
      price: v.price
    })),
    simpleSelection: 'single',
    allowMultipleCategories: false,
  }), [item.variations]);

  const [currentVariationConfig, setCurrentVariationConfig] = useState<VariationConfig>(variationConfig);

  const [formData, setFormData] = useState({
    title: item.title || "",
    description: item.description || "",
    price: item.price || 0,
    category: item.category || "",
    image: item.image || "",
    status: item.status || "in stock",
  });

  const [loading, setLoading] = useState(false);

  // Computed properties for backward compatibility
  const variations = currentVariationConfig.simpleVariations || [];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
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

  const handleVariationChange = (
    index: number,
    field: keyof SimpleVariation,
    value: string | number
  ) => {
    setCurrentVariationConfig(prev => {
      const currentVariations = prev.simpleVariations || [];
      const updatedVariations = currentVariations.map((variation, i) =>
        i === index ? {
          ...variation,
          [field]: field === 'price' ? (typeof value === 'string' ? parseFloat(value) || 0 : value) : value
        } : variation
      );
      return {
        ...prev,
        simpleVariations: updatedVariations
      };
    });
  };

  const addVariation = () => {
    setCurrentVariationConfig(prev => ({
      ...prev,
      simpleVariations: [
        ...(prev.simpleVariations || []),
        { id: `variation-${Date.now()}`, name: "", price: 0 }
      ]
    }));
  };

  const removeVariation = (index: number) => {
    setCurrentVariationConfig(prev => ({
      ...prev,
      simpleVariations: (prev.simpleVariations || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert VariationConfig to API format
      const apiVariations = variations
        .filter((v) => v.name.trim() !== "" && v.price > 0)
        .map((v) => ({ name: v.name, price: v.price }));

      const response = await fetch("/api/updateItem", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item._id,
          ...formData,
          variations: apiVariations,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      toast.success("Menu item updated successfully!");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update menu item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        ✏️ Edit Menu Item
      </h2>
    </div>

    {/* Body (scrollable) */}
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 
                         focus:ring-2 focus:ring-[#741052] focus:outline-none transition"
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 
                         focus:ring-2 focus:ring-[#741052] focus:outline-none transition"
            />
          </div>
          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Price (Rs.)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 
                         focus:ring-2 focus:ring-[#741052] focus:outline-none transition"
            />
          </div>
          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 
                         focus:ring-2 focus:ring-[#741052] focus:outline-none transition"
            />
          </div>
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full text-sm text-gray-600 dark:text-gray-400 
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-lg file:border-0
                         file:text-sm file:font-semibold
                         file:bg-[#741052] file:text-white
                         hover:file:bg-[#5c0d40]"
            />
          </div>
          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 
                         focus:ring-2 focus:ring-[#741052] focus:outline-none transition"
            >
              <option value="in stock">✅ In Stock</option>
              <option value="out of stock">❌ Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Right Column (Variations) */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Variations
          </label>
          <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
            {variations.map((variation, index) => (
              <div
                key={variation.id}
                className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl shadow-sm"
              >
                <input
                  type="text"
                  value={variation.name}
                  onChange={(e) =>
                    handleVariationChange(index, "name", e.target.value)
                  }
                  placeholder="Variation Name"
                  className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2
                             focus:ring-2 focus:ring-[#741052] focus:outline-none transition"
                />
                <input
                  type="number"
                  value={variation.price}
                  onChange={(e) =>
                    handleVariationChange(index, "price", e.target.value)
                  }
                  placeholder="Price"
                  className="w-24 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2
                             focus:ring-2 focus:ring-[#741052] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => removeVariation(index)}
                  className="text-red-500 hover:text-red-700 transition text-lg"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addVariation}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow 
                       hover:from-green-600 hover:to-green-700 transition"
          >
            Add Variation
          </button>
        </div>
      </form>
    </div>

    {/* Footer (sticky) */}
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
<button
  type="button"
  onClick={onClose}
  className="px-4 py-2 rounded-lg shadow text-white font-semibold
             bg-gradient-to-r from-[#741052] to-pink-600
             hover:opacity-90 transition-all duration-200"
>
  Cancel
</button>

<button
  type="submit"
  disabled={loading}
 onClick={handleSubmit}
  className={`px-4 py-2 rounded-lg shadow text-white font-semibold
    bg-gradient-to-r from-[#741052] to-pink-600 
    hover:opacity-90 transition-all duration-200
    ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
>
  {loading ? (
    <span className="animate-spin">⏳ Updating...</span>
  ) : (
    "Update"
  )}
</button>


    </div>
  </div>
</div>

  );
};

export default EditMenuItemForm;
