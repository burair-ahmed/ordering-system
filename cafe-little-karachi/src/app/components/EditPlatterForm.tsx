/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useMemo } from "react";
import Preloader from "./Preloader";
import { VariationConfig } from "../../types/variations";
import { toast } from "sonner";
import CreateCategoryModal from "./CreateCategoryModal";
import CreatePlatterCategoryModal from "./CreatePlatterCategoryModal";
import { v4 as uuidv4 } from "uuid";
import { X, Plus, Trash2, Upload } from "lucide-react";

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
  const [imageUploading, setImageUploading] = useState(false);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setImageUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, folder: 'cafe-little-karachi/platters' }),
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData({ ...formData, image: data.url });
      toast.success('Image uploaded to Cloudinary!');
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
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

  const handleAdditionalChoiceHeadingChange = (index: number, value: string) => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      const idx = (prev.categories?.filter(cat => cat.required).length || 0) + index;
      if (updatedCategories[idx]) {
        updatedCategories[idx] = { ...updatedCategories[idx], name: value };
      }
      return { ...prev, categories: updatedCategories };
    });
  };

  const handleAdditionalOptionChange = (choiceIndex: number, optionIndex: number, value: string) => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      const idx = (prev.categories?.filter(cat => cat.required).length || 0) + choiceIndex;
      if (updatedCategories[idx]?.options[optionIndex]) {
        const updatedOptions = [...updatedCategories[idx].options];
        updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], name: value };
        updatedCategories[idx] = { ...updatedCategories[idx], options: updatedOptions };
      }
      return { ...prev, categories: updatedCategories };
    });
  };

  const addOptionToChoice = (choiceIndex: number) => {
    setVariationConfig(prev => {
      const updatedCategories = [...(prev.categories || [])];
      const idx = (prev.categories?.filter(cat => cat.required).length || 0) + choiceIndex;
      if (updatedCategories[idx]) {
        updatedCategories[idx] = {
          ...updatedCategories[idx],
          options: [
            ...updatedCategories[idx].options,
            { id: uuidv4(), name: "", price: 0, available: true }
          ]
        };
      }
      return { ...prev, categories: updatedCategories };
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
          options: [{ id: uuidv4(), name: "", price: 0, available: true }]
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

  const inputCls = "w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-[#741052]/40 focus:border-[#741052] focus:outline-none transition-colors placeholder:text-neutral-400";
  const labelCls = "block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1";

  const SectionHeading = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 mb-3 mt-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#741052] shrink-0">{title}</span>
      <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden border border-neutral-100 dark:border-neutral-800">
        {loading && <Preloader />}

        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 tracking-tight">Edit Platter</h2>
            <p className="text-[11px] text-neutral-400 mt-0.5 truncate max-w-xs">{item.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form onSubmit={handleSubmit} id="edit-platter-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ── LEFT COLUMN ── */}
              <div className="space-y-4">

                <SectionHeading title="Basic Info" />

                <div>
                  <label className={labelCls}>Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputCls} placeholder="Platter name" />
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    className={inputCls + " resize-none"}
                    placeholder="Short description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Base Price (Rs.)</label>
                    <input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Category</label>
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
                      className={inputCls}
                    >
                      <option value="">Select category</option>
                      {availablePlatterCategories.map((cat) => (
                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                      ))}
                      <option value="__new__">+ New category</option>
                    </select>
                  </div>
                </div>

                <SectionHeading title="Discount" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Value</label>
                    <input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} placeholder="0" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Type</label>
                    <select name="discountType" value={formData.discountType} onChange={handleChange} className={inputCls}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (Rs.)</option>
                    </select>
                  </div>
                </div>

                <SectionHeading title="Availability" />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'in stock' ? 'out of stock' : 'in stock' }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      formData.status === 'in stock'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400'
                        : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
                    }`}
                  >
                    {formData.status === 'in stock' ? 'In Stock' : 'Out of Stock'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isVisible: !prev.isVisible }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      formData.isVisible
                        ? 'bg-[#741052]/8 border-[#741052]/30 text-[#741052] dark:border-[#d0269b]/40 dark:text-[#d0269b]'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:border-neutral-700'
                    }`}
                  >
                    {formData.isVisible ? 'Visible on Menu' : 'Hidden from Menu'}
                  </button>
                </div>

                <SectionHeading title="Image" />
                {formData.image && (
                  <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                    <img
                      src={formData.image}
                      alt="Current platter image"
                      className="w-full h-28 object-cover"
                    />
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[10px] font-semibold bg-black/55 text-white px-2 py-0.5 rounded-full">Current image</span>
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2.5 cursor-pointer w-full border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2.5 hover:border-[#741052]/60 hover:bg-[#741052]/[0.02] transition-colors group">
                  <Upload size={13} className="text-neutral-400 group-hover:text-[#741052] transition-colors shrink-0" />
                  <span className="text-xs text-neutral-500 group-hover:text-[#741052] transition-colors">
                    {imageUploading ? "Uploading..." : formData.image ? "Replace image" : "Upload image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="hidden"
                  />
                  {imageUploading && (
                    <span className="ml-auto animate-spin w-3 h-3 border-2 border-t-transparent border-[#741052] rounded-full inline-block" />
                  )}
                </label>
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className="space-y-4">

                {/* Additional Choices */}
                <SectionHeading title="Additional Choices" />
                <div className="space-y-3">
                  {additionalChoices.map((choice, index) => (
                    <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 bg-neutral-50/60 dark:bg-neutral-800/40">
                      {/* Choice heading row */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <input
                          type="text"
                          value={choice.heading}
                          onChange={(e) => handleAdditionalChoiceHeadingChange(index, e.target.value)}
                          placeholder="Choice heading (e.g. Sauce, Drinks)"
                          className={inputCls + " flex-1 font-medium"}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveChoice(index)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                          title="Remove this choice"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Options */}
                      <div className="space-y-1.5 pl-1">
                        {choice.options.map((option, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[9px] font-bold text-neutral-500 shrink-0">
                              {i + 1}
                            </span>
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) => handleAdditionalOptionChange(index, i, e.target.value)}
                              placeholder="Option name"
                              className={inputCls + " flex-1"}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(index, i)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                              title="Remove option"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addOptionToChoice(index)}
                        className="mt-2 ml-1 flex items-center gap-1 text-[11px] font-semibold text-[#741052] hover:text-[#d0269b] transition-colors"
                      >
                        <Plus size={11} /> Add option
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addChoice}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[#741052]/40 text-[#741052] text-xs font-semibold hover:bg-[#741052]/5 hover:border-[#741052]/70 transition-all"
                  >
                    <Plus size={13} /> Add Choice
                  </button>
                </div>

                {/* Categories */}
                <SectionHeading title="Categories" />
                <div className="space-y-3">
                  {categories.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 bg-neutral-50/60 dark:bg-neutral-800/40">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#741052]">Category {categoryIndex + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSelectionTypeChange(categoryIndex, 'category')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                              (category as any).selectionType === 'category'
                                ? 'bg-[#741052] text-white'
                                : 'bg-white dark:bg-neutral-900 text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                            }`}
                          >
                            Category
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectionTypeChange(categoryIndex, 'items')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                              (category as any).selectionType === 'items'
                                ? 'bg-[#741052] text-white'
                                : 'bg-white dark:bg-neutral-900 text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                            }`}
                          >
                            Items
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(categoryIndex)}
                            className="w-6 h-6 ml-1 rounded-md flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {(category as any).selectionType === 'category' ? (
                        <div className="space-y-2">
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
                            className={inputCls}
                          >
                            <option value="">Select a category</option>
                            {availableCategories.map((cat) => (
                              <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                            <option value="__new__">+ Create new category</option>
                          </select>
                          {category.options.length > 0 && (
                            <div className="space-y-1.5">
                              <label className={labelCls}>Options</label>
                              {category.options.map((option, optionIndex) => (
                                <input
                                  key={optionIndex}
                                  type="text"
                                  value={option.name}
                                  onChange={(e) => handleCategoryOptionChange(categoryIndex, optionIndex, e.target.value)}
                                  placeholder="Option name"
                                  className={inputCls}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className={labelCls}>Select items</label>
                            <span className="text-[10px] bg-[#741052]/10 text-[#741052] px-2 py-0.5 rounded-full font-bold">
                              {(category as any).itemIds?.length || 0} selected
                            </span>
                          </div>
                          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg max-h-44 overflow-y-auto bg-white dark:bg-neutral-950 divide-y divide-neutral-100 dark:divide-neutral-800">
                            {allMenuItems.map((menuItem) => (
                              <label
                                key={menuItem._id}
                                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                                  (category as any).itemIds?.includes(menuItem._id)
                                    ? 'bg-[#741052]/5 dark:bg-[#741052]/10'
                                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={(category as any).itemIds?.includes(menuItem._id)}
                                  onChange={(e) => {
                                    const currentIds = [...((category as any).itemIds || [])];
                                    if (e.target.checked) {
                                      handleItemIdsChange(categoryIndex, [...currentIds, menuItem._id]);
                                    } else {
                                      handleItemIdsChange(categoryIndex, currentIds.filter(id => id !== menuItem._id));
                                    }
                                  }}
                                  className="w-3.5 h-3.5 rounded border-neutral-300 text-[#741052] focus:ring-[#741052]"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 truncate">{menuItem.title}</p>
                                  <p className="text-[10px] text-neutral-400 uppercase tracking-wide truncate">{menuItem.category}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addCategory}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[#741052]/40 text-[#741052] text-xs font-semibold hover:bg-[#741052]/5 hover:border-[#741052]/70 transition-all"
                  >
                    <Plus size={13} /> Add Category
                  </button>
                </div>

                <CreateCategoryModal
                  isOpen={isCategoryModalOpen}
                  onClose={() => { setIsCategoryModalOpen(false); setActiveCategoryIndex(null); }}
                  onCategoryCreated={handleCategoryCreated}
                />
                <CreatePlatterCategoryModal
                  isOpen={isPlatterCategoryModalOpen}
                  onClose={() => setIsPlatterCategoryModalOpen(false)}
                  onCategoryCreated={handlePlatterCategoryCreated}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Sticky footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-neutral-100 dark:border-neutral-800 shrink-0 bg-neutral-50/60 dark:bg-neutral-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-platter-form"
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#741052] to-[#d0269b] hover:opacity-90 transition-all shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPlatterForm;
