import React, { useState } from "react";

interface Variation {
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
    image: string;
    variations: Variation[];
  };
  onClose: () => void;
  onUpdate: () => void;
}

const EditMenuItemForm: React.FC<EditMenuItemFormProps> = ({ item, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: item.title || "",
    description: item.description || "",
    price: item.price || 0,
    category: item.category || "",
    image: item.image || "",
    variations: item.variations || [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleVariationChange = (
    index: number,
    field: keyof Variation,
    value: string | number
  ) => {
    const updatedVariations = formData.variations.map((variation, i) =>
      i === index ? { ...variation, [field]: value } : variation
    );
    setFormData({ ...formData, variations: updatedVariations });
  };

  const addVariation = () => {
    setFormData({
      ...formData,
      variations: [...formData.variations, { name: "", price: 0 }],
    });
  };

  const removeVariation = (index: number) => {
    const updatedVariations = formData.variations.filter((_, i) => i !== index);
    setFormData({ ...formData, variations: updatedVariations });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/updateItem", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item._id,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Edit Menu Item</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (Rs.)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL</label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Variations</label>
            {formData.variations.map((variation, index) => (
              <div key={index} className="flex items-center gap-4 mb-2">
                <input
                  type="text"
                  value={variation.name}
                  onChange={(e) =>
                    handleVariationChange(index, "name", e.target.value)
                  }
                  placeholder="Variation Name"
                  className="flex-1 border border-gray-300 rounded-md shadow-sm px-4 py-2"
                />
                <input
                  type="number"
                  value={variation.price}
                  onChange={(e) =>
                    handleVariationChange(index, "price", parseFloat(e.target.value))
                  }
                  placeholder="Price"
                  className="w-24 border border-gray-300 rounded-md shadow-sm px-4 py-2"
                />
                <button
                  type="button"
                  onClick={() => removeVariation(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addVariation}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Add Variation
            </button>
          </div>

          {/* Submit and Cancel */}
          <div className="col-span-1 md:col-span-2 flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMenuItemForm;
