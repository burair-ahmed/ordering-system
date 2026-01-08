/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useMemo } from "react";
import Preloader from "./Preloader"; // Adjust the import path if needed
import { VariationConfig } from "../../types/variations";
import { toast } from "sonner";
import CreateCategoryModal from "./CreateCategoryModal";
import CreatePlatterCategoryModal from "./CreatePlatterCategoryModal";
import { v4 as uuidv4 } from "uuid";

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
  selectionType?: 'category' | 'items';
  itemIds?: string[];
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
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
    isVisible?: boolean;
  };
  onClose: () => void;
  onUpdate: () => void;
}

const EditPlatterForm: React.FC<EditPlatterFormProps> = ({ item, onClose, onUpdate }) => {
  // Item Categories (Old)
  const [availableCategories, setAvailableCategories] = useState<{ _id: string, name: string }[]>([]);
  // Platter Categories (New)
  const [availablePlatterCategories, setAvailablePlatterCategories] = useState<{ _id: string, name: string }[]>([]);
  // All Menu Items (for individual selection)
  const [allMenuItems, setAllMenuItems] = useState<{ _id: string, title: string, category: string }[]>([]);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPlatterCategoryModalOpen, setIsPlatterCategoryModalOpen] = useState(false);
  
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  useEffect(() => {
    // Fetch Item Categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setAvailableCategories(data))
      .catch(err => console.error("Error fetching categories:", err));

    // Fetch Platter Categories
    fetch('/api/platter-categories')
      .then(res => res.json())
      .then(data => setAvailablePlatterCategories(data))
      .catch(err => console.error("Error fetching platter categories:", err));

    // Fetch All Menu Items
    fetch('/api/getitemsadmin')
      .then(res => res.json())
      .then(data => setAllMenuItems(data))
      .catch(err => console.error("Error fetching menu items:", err));
  }, []);

  // Handler for Item Categories - only for indices >= 0
  const handleCategoryCreated = (newCat: { _id: string, name: string }) => {
    setAvailableCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
    if (activeCategoryIndex !== null && activeCategoryIndex >= 0) {
      handleCategoryChange(activeCategoryIndex, newCat.name);
      setActiveCategoryIndex(null);
    }
  };

  // Handler for Platter Categories
  const handlePlatterCategoryCreated = (newCat: { _id: string, name: string }) => {
    setAvailablePlatterCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
    setFormData(prev => ({ ...prev, platterCategory: newCat.name }));
  };
  // Convert existing platter data to VariationConfig format
  const initialVariationConfig: VariationConfig = useMemo(() => {
    const categories: any[] = [];
    const additionalCategories: any[] = [];

    // Convert main categories (required)
    (item.categories || []).forEach((category, index) => {
      categories.push({
        id: `category-${index}`,
        name: category.categoryName,
        type: 'single' as const,
        required: true,
        options: category.options.map((opt: any) => ({
          id: opt.name, // Use name as ID for backward compatibility
          name: opt.name,
          price: 0,
          available: true
        })),
        selectionType: (category as any).selectionType || 'category',
        itemIds: (category as any).itemIds || []
      } as any);
    });

    // Convert additional choices (optional)
    (item.additionalChoices || []).forEach((choice, index) => {
      additionalCategories.push({
        id: `additional-${index}`,
        name: choice.heading,
        type: 'single' as const,
        required: false,
        options: choice.options.map((opt: any) => ({
          id: opt.uuid || `option-${index}-${Math.random()}`,
          name: opt.name,
          price: 0,
          available: true
        }))
      });
    });

    return {
      categories: [...categories, ...additionalCategories],
      allowMultipleCategories: true,
    };
  }, [item.categories, item.additionalChoices]);

  const [variationConfig, setVariationConfig] = useState<VariationConfig>(initialVariationConfig);

  const [formData, setFormData] = useState({
    title: item.title || "",
    description: item.description || "",
    basePrice: item.basePrice || 0,
    platterCategory: item.platterCategory || "",
    image: item.image || "",
    status: item.status || "in stock",
    discountType: item.discountType || "percentage",
    discountValue: item.discountValue || 0,
    isVisible: item.isVisible !== undefined ? item.isVisible : true,
  });

  const [loading, setLoading] = useState(false);

  // Computed properties for backward compatibility with existing UI
  const categories = useMemo(() =>
    variationConfig.categories?.filter(cat => cat.required).map(cat => ({
      categoryName: cat.name,
      options: cat.options.map(opt => ({ name: opt.name })),
      selectionType: (cat as any).selectionType || 'category',
      itemIds: (cat as any).itemIds || []
    })) || [],
    [variationConfig.categories]
  );

  const additionalChoices = useMemo(() =>
    variationConfig.categories?.filter(cat => !cat.required).map(cat => ({
      heading: cat.name,
      options: cat.options.map(opt => ({ name: opt.name, uuid: opt.id })),
      selectionType: (cat as any).selectionType || 'category',
      itemIds: (cat as any).itemIds || []
    })) || [],
    [variationConfig.categories]
  );

  const handleSelectionTypeChange = (index: number, type: 'category' | 'items') => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      if (updatedCategories[index]) {
        updatedCategories[index] = {
          ...updatedCategories[index],
          selectionType: type,
          // Reset relevant fields when switching
          name: '',
          itemIds: []
        } as any;
      }
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };

  const handleItemIdsChange = (index: number, itemIds: string[]) => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      if (updatedCategories[index]) {
        updatedCategories[index] = {
          ...updatedCategories[index],
          itemIds: itemIds
        } as any;
      }
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };

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

  const handleCategoryOptionChange = (categoryIndex: number, optionIndex: number, value: string) => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      if (updatedCategories[categoryIndex] && updatedCategories[categoryIndex].options[optionIndex]) {
        const updatedOptions = [...updatedCategories[categoryIndex].options];
        updatedOptions[optionIndex] = {
          ...updatedOptions[optionIndex],
          name: value
        };
        updatedCategories[categoryIndex] = {
          ...updatedCategories[categoryIndex],
          options: updatedOptions
        };
      }
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };

  const addCategory = () => {
    setVariationConfig(prev => ({
      ...prev,
      categories: [
        ...(prev.categories || []),
        {
          id: `category-${Date.now()}`,
          name: "",
          type: 'single' as const,
           required: true,
           options: [],
           selectionType: 'category' as 'category' | 'items',
           itemIds: []
         } as any
       ]
     }));
   };

  const handleAdditionalChoiceChange = (index: number, field: string, value: string, optionIndex?: number) => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      // Additional choices start after main categories
      const additionalChoiceIndex = (prev.categories?.filter(cat => cat.required).length || 0) + index;

      if (optionIndex !== undefined) {
        // Update option name
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
      } else {
        // Update heading
        if (updatedCategories[additionalChoiceIndex]) {
          updatedCategories[additionalChoiceIndex] = {
            ...updatedCategories[additionalChoiceIndex],
            name: value
          };
        }
      }
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };

  const addChoice = () => {
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

  const handleRemoveCategory = (index: number) => {
    setVariationConfig(prev => ({
      ...prev,
      categories: (prev.categories || []).filter((_, i) => i !== index)
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
    setLoading(true);

    try {
      // Convert VariationConfig back to API format
      const requiredCategories = variationConfig.categories?.filter(cat => cat.required) || [];
      const additionalCategories = variationConfig.categories?.filter(cat => !cat.required) || [];

       const apiCategories = requiredCategories.map(cat => ({
         categoryName: cat.name,
         options: cat.options.map(opt => ({ name: opt.name })),
         selectionType: (cat as any).selectionType || 'category',
         itemIds: (cat as any).itemIds || []
       }));

      const apiAdditionalChoices = additionalCategories.map(cat => ({
        heading: cat.name,
        options: cat.options.map(opt => ({ name: opt.name, uuid: opt.id }))
      }));

      const response = await fetch("/api/updatePlatter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           id: item._id,
           ...formData,
           categories: apiCategories,
           additionalChoices: apiAdditionalChoices
         }),
       });

      const data = await response.json();
      if (!response.ok) throw new Error("Failed to update platter");

      toast.success("Platter updated successfully!");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating platter:", error);
      toast.error("There was an issue updating the platter. Please try again.");
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

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#741052] focus:outline-none"
                />
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#741052] focus:outline-none bg-white"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Visibility
              </label>
              <div 
                className="flex items-center gap-3 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 cursor-pointer"
                onClick={() => setFormData(prev => ({ ...prev, isVisible: !prev.isVisible }))}
              >
                 <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
                  className="w-4 h-4 text-[#741052] focus:ring-[#741052] cursor-pointer"
                />
                <span className="text-sm text-gray-700 select-none">
                  {formData.isVisible ? "Visible on Menu" : "Hidden from Menu"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                name="platterCategory"
                value={formData.platterCategory}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setIsPlatterCategoryModalOpen(true);
                  } else {
                    handleChange(e);
                  }
                }}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#741052] focus:outline-none bg-white"
              >
                <option value="">Select a Category</option>
                {availablePlatterCategories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
                <option value="__new__" className="font-semibold text-[#741052]">+ Create New Platter Category</option>
              </select>
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
              {additionalChoices.map((choice, index) => (
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
              {categories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-black uppercase tracking-widest text-[#741052]">
                      Category {categoryIndex + 1}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectionTypeChange(categoryIndex, 'category')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          (category as any).selectionType === 'category'
                            ? 'bg-[#741052] text-white'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        Category
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectionTypeChange(categoryIndex, 'items')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          (category as any).selectionType === 'items'
                            ? 'bg-[#741052] text-white'
                            : 'bg-white dark:bg-gray-900 text-gray-400 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        Items
                      </button>
                    </div>
                  </div>

                  {(category as any).selectionType === 'category' ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1">
                          Item Category
                        </label>
                        <select
                          value={category.categoryName}
                          onChange={(e) => {
                            if (e.target.value === '__new__') {
                              setActiveCategoryIndex(categoryIndex);
                              setIsCategoryModalOpen(true);
                            } else {
                              handleCategoryChange(categoryIndex, e.target.value);
                            }
                          }}
                          className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#741052] focus:outline-none bg-white dark:bg-gray-900 text-sm"
                        >
                          <option value="">Select a Category</option>
                          {availableCategories.map((cat) => (
                            <option key={cat._id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                          <option value="__new__" className="font-semibold text-[#741052]">+ Create New Category</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1">
                          Options Preview
                        </label>
                        {category.options.map((option, optionIndex) => (
                          <input
                            key={optionIndex}
                            type="text"
                            value={option.name}
                            onChange={(e) =>
                              handleCategoryOptionChange(categoryIndex, optionIndex, e.target.value)
                            }
                            placeholder="Option Name"
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#741052] focus:outline-none dark:bg-gray-900 text-sm"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Select Specific Items
                        </label>
                        <span className="text-[10px] bg-[#741052]/10 text-[#741052] px-2 py-0.5 rounded-full font-bold">
                          {(category as any).itemIds?.length || 0} Selected
                        </span>
                      </div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl max-h-60 overflow-y-auto p-2 bg-white dark:bg-gray-950">
                        <div className="grid grid-cols-1 gap-1.5 focus:outline-none">
                          {allMenuItems.map((item) => (
                             <label 
                              key={item._id} 
                              className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${
                                (category as any).itemIds?.includes(item._id)
                                  ? 'border-[#741052] bg-[#741052]/5 dark:bg-[#741052]/10'
                                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-900'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={(category as any).itemIds?.includes(item._id)}
                                onChange={(e) => {
                                  const currentIds = [...((category as any).itemIds || [])];
                                  if (e.target.checked) {
                                    handleItemIdsChange(categoryIndex, [...currentIds, item._id]);
                                  } else {
                                    handleItemIdsChange(categoryIndex, currentIds.filter(id => id !== item._id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-[#741052] focus:ring-[#741052]"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{item.title}</span>
                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider truncate">{item.category}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(categoryIndex)}
                    className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                  >
                    Remove Category
                  </button>
                </div>
              ))}
              
              <CreateCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => {
                  setIsCategoryModalOpen(false);
                  setActiveCategoryIndex(null);
                }}
                onCategoryCreated={handleCategoryCreated}
              />
              
              <CreatePlatterCategoryModal
                isOpen={isPlatterCategoryModalOpen}
                onClose={() => setIsPlatterCategoryModalOpen(false)}
                onCategoryCreated={handlePlatterCategoryCreated}
              />
              
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
