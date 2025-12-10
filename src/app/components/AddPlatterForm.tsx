'use client';

import { useState, useMemo } from "react";
import { VariationConfig } from "../../types/variations";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";


const AddPlatterForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [image, setImage] = useState<string | null>(null);
  const [platterCategory, setPlatterCategory] = useState("");

  // Convert legacy structure to VariationConfig
  const [variationConfig, setVariationConfig] = useState<VariationConfig>({
    categories: [
      // Default category (can be removed by user)
      {
        id: `category-${Date.now()}`,
        name: "",
        type: 'single' as const,
        required: true,
        options: []
      }
    ],
    allowMultipleCategories: true,
  });

  // Computed properties for backward compatibility with existing UI
  const categories = useMemo(() =>
    variationConfig.categories?.map(cat => ({
      categoryName: cat.name,
      options: cat.options.map(opt => ({ name: opt.name }))
    })) || [],
    [variationConfig.categories]
  );

  const additionalChoices = useMemo(() => {
    // Additional choices are categories that are not required and have type 'single'
    const additionalCats = variationConfig.categories?.filter(cat => !cat.required) || [];
    return additionalCats.map(cat => ({
      heading: cat.name,
      options: cat.options.map(opt => ({ name: opt.name, uuid: opt.id }))
    }));
  }, [variationConfig.categories]);

  const handleCategoryChange = (index: number, value: string) => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      if (updatedCategories[index]) {
        updatedCategories[index] = {
          ...updatedCategories[index],
          name: value
        };
      }
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };

  const handleAddCategory = () => {
    setVariationConfig(prev => ({
      ...prev,
      categories: [
        ...(prev.categories || []),
        {
          id: `category-${Date.now()}`,
          name: "",
          type: 'single' as const,
          required: true,
          options: []
        }
      ]
    }));
  };

  const handleRemoveCategory = (index: number) => {
    setVariationConfig(prev => ({
      ...prev,
      categories: (prev.categories || []).filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Additional choice handlers (work with non-required categories)
  const handleChoiceHeadingChange = (index: number, value: string) => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      // Additional choices start after main categories (required ones)
      const additionalChoiceIndex = (prev.categories?.filter(cat => cat.required).length || 0) + index;
      if (updatedCategories[additionalChoiceIndex]) {
        updatedCategories[additionalChoiceIndex] = {
          ...updatedCategories[additionalChoiceIndex],
          name: value
        };
      }
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };

  const handleOptionNameChange = (choiceIndex: number, optionIndex: number, value: string) => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      const additionalChoiceIndex = (prev.categories?.filter(cat => cat.required).length || 0) + choiceIndex;
      if (updatedCategories[additionalChoiceIndex] && updatedCategories[additionalChoiceIndex].options[optionIndex]) {
        const updatedOptions = [...updatedCategories[additionalChoiceIndex].options];
        updatedOptions[optionIndex] = {
          ...updatedOptions[optionIndex],
          name: value
        };
        updatedCategories[additionalChoiceIndex] = {
          ...updatedCategories[additionalChoiceIndex],
          options: updatedOptions
        };
      }
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };

  const handleAddOption = (choiceIndex: number) => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      const additionalChoiceIndex = (prev.categories?.filter(cat => cat.required).length || 0) + choiceIndex;
      if (updatedCategories[additionalChoiceIndex]) {
        updatedCategories[additionalChoiceIndex] = {
          ...updatedCategories[additionalChoiceIndex],
          options: [
            ...updatedCategories[additionalChoiceIndex].options,
            {
              id: uuidv4(),
              name: "",
              price: 0,
              available: true
            }
          ]
        };
      }
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };

  const handleAddChoice = () => {
    setVariationConfig(prev => ({
      ...prev,
      categories: [
        ...(prev.categories || []),
        {
          id: `additional-${Date.now()}`,
          name: "",
          type: 'single' as const,
          required: false,
          options: [{
            id: uuidv4(),
            name: "",
            price: 0,
            available: true
          }]
        }
      ]
    }));
  };

  const handleRemoveChoice = (index: number) => {
    setVariationConfig(prev => {
      const requiredCategories = prev.categories?.filter(cat => cat.required) || [];
      const additionalCategories = prev.categories?.filter(cat => !cat.required) || [];
      additionalCategories.splice(index, 1);
      return {
        ...prev,
        categories: [...requiredCategories, ...additionalCategories]
      };
    });
  };

  const handleRemoveOption = (choiceIndex: number, optionIndex: number) => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      const additionalChoiceIndex = (prev.categories?.filter(cat => cat.required).length || 0) + choiceIndex;
      if (updatedCategories[additionalChoiceIndex]) {
        const updatedOptions = updatedCategories[additionalChoiceIndex].options.filter((_, i) => i !== optionIndex);
        updatedCategories[additionalChoiceIndex] = {
          ...updatedCategories[additionalChoiceIndex],
          options: updatedOptions
        };
      }
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !basePrice || !platterCategory || !image) {
      toast.error("All fields are required!");
      return;
    }

    // Convert VariationConfig back to API format
    const requiredCategories = variationConfig.categories?.filter(cat => cat.required) || [];
    const additionalCategories = variationConfig.categories?.filter(cat => !cat.required) || [];

    const apiCategories = requiredCategories.map(cat => ({
      categoryName: cat.name,
      options: cat.options.map(opt => ({ name: opt.name }))
    }));

    const apiAdditionalChoices = additionalCategories.map(cat => ({
      heading: cat.name,
      options: cat.options.map(opt => ({ name: opt.name, uuid: opt.id }))
    }));

    const platterData = {
      title,
      description,
      basePrice,
      image,
      platterCategory,
      categories: apiCategories,
      additionalChoices: apiAdditionalChoices,
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
        toast.success("Platter added successfully!");
        // Reset form
        setTitle("");
        setDescription("");
        setBasePrice(0);
        setImage(null);
        setPlatterCategory("");
        setVariationConfig({
          categories: [{
            id: `category-${Date.now()}`,
            name: "",
            type: 'single' as const,
            required: true,
            options: []
          }],
          allowMultipleCategories: true,
        });
      } else {
        toast.error("Failed to add platter.");
      }
    } catch (error) {
      console.error("Error adding platter:", error);
      toast.error("Error adding platter.");
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
              />
              <button
                type="button"
                onClick={() => handleRemoveChoice(index)}
                className="mb-2 p-2 bg-red-500 text-white rounded"
              >
                Remove Heading
              </button>
              {choice.options.map((option, optIndex) => (
                <div key={optIndex} className="flex gap-4 mb-2">
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) => handleOptionNameChange(index, optIndex, e.target.value)}
                    placeholder="Option Name"
                    className="p-2 border rounded w-full"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index, optIndex)}
                    className="p-2 bg-red-500 text-white rounded"
                  >
                    Remove Option
                  </button>
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

        <button type="submit" className="mt-4 p-3 bg-blue-600 text-white rounded w-full">
          Add Platter
        </button>
      </form>
    </div>
  );
};

export default AddPlatterForm;
