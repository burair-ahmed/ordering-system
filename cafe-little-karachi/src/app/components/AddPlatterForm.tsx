'use client';

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VariationConfig } from "../../types/variations";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  X,
  ImageIcon,
  DollarSign,
  Tag,
  FileText,
  Layers,
  Settings,
  Save,
  Trash2,
  Upload,
  Percent,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CreateCategoryModal from "./CreateCategoryModal";
import CreatePlatterCategoryModal from "./CreatePlatterCategoryModal";


const AddPlatterForm = () => {
  // Original Categories (for items)
  const [availableCategories, setAvailableCategories] = useState<{ _id: string, name: string }[]>([]);
  // New Platter Categories (for the platter itself)
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

  // Handler for Item Categories (Old) - Only for indices >= 0
  const handleCategoryCreated = (newCat: { _id: string, name: string }) => {
    setAvailableCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
    if (activeCategoryIndex !== null && activeCategoryIndex >= 0) {
      handleCategoryChange(activeCategoryIndex, newCat.name);
      setActiveCategoryIndex(null);
    }
  };

  // Handler for Platter Categories (New)
  const handlePlatterCategoryCreated = (newCat: { _id: string, name: string }) => {
    setAvailablePlatterCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
    setPlatterCategory(newCat.name);
  };
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [image, setImage] = useState<string | null>(null);
  const [platterCategory, setPlatterCategory] = useState("");
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [isVisible, setIsVisible] = useState(true);

  // Convert legacy structure to VariationConfig
  const [variationConfig, setVariationConfig] = useState<VariationConfig>({
    categories: [
      // Default category (can be removed by user)
      {
        id: `category-${Date.now()}`,
        name: "",
        type: 'single' as const,
        required: true,
        options: [],
        selectionType: 'category' as 'category' | 'items',
        itemIds: []
      } as any
    ],
    allowMultipleCategories: true,
  });

  // Since VariationConfig type in types/variations.ts doesn't have selectionType/itemIds,
  // we'll use a local extending type for the form state or just cast it.
  // For the sake of this form, we'll keep it in variationConfig and cast when needed.

  // Computed properties for backward compatibility with existing UI
  const categories = useMemo(() =>
    variationConfig.categories?.map(cat => ({
      categoryName: cat.name,
      options: cat.options.map(opt => ({ name: opt.name })),
      selectionType: (cat as any).selectionType || 'category',
      itemIds: (cat as any).itemIds || []
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
          options: [],
          selectionType: 'category' as 'category' | 'items',
          itemIds: []
        } as any
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
          }],
          selectionType: 'category' as 'category' | 'items',
          itemIds: []
        } as any
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
      options: cat.options.map(opt => ({ name: opt.name })),
      selectionType: (cat as any).selectionType || 'category',
      itemIds: (cat as any).itemIds || []
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
      discountType,
      discountValue: Number(discountValue),
      isVisible,
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
        setDiscountType("percentage");
        setDiscountValue("");
        setIsVisible(true);
        setVariationConfig({
          categories: [{
            id: `category-${Date.now()}`,
            name: "",
            type: 'single' as const,
            required: true,
            options: [],
            selectionType: 'category' as 'category' | 'items',
            itemIds: []
          } as any],
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="w-16 h-16 bg-gradient-to-r from-[#741052] to-[#d0269b] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#741052] to-[#d0269b] bg-clip-text text-transparent mb-2">
            Add New Platter
          </h1>
          <p className="text-gray-600">Create a beautiful platter combination for your customers</p>
        </motion.div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#741052]">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Enter the fundamental details of your platter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Platter Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Supreme BBQ Platter"
                  className="h-12 border-2 focus:border-[#741052] transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platterCategory" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Category
                </Label>
                <div className="relative">
                  <select
                    id="platterCategory"
                    value={platterCategory}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setIsPlatterCategoryModalOpen(true);
                      } else {
                        setPlatterCategory(e.target.value);
                      }
                    }}
                    className="h-12 w-full border-2 focus:border-[#741052] transition-colors rounded-md px-3 bg-white"
                    required
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your platter in detail..."
                className="min-h-24 border-2 focus:border-[#741052] transition-colors resize-none"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="basePrice" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Base Price (Rs)
                </Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value))}
                  placeholder="0"
                  className="h-12 border-2 focus:border-[#741052] transition-colors"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Platter Image
                </Label>
                <div className="relative">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image')?.click()}
                    className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-[#741052] transition-colors flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {image ? 'Change Image' : 'Upload Image'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               {/* Discount */}
               <div className="space-y-2">
                <Label htmlFor="discountValue" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Discount (Optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="discountValue"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="h-12 border-2 focus:border-[#741052] transition-colors flex-1"
                    min="0"
                  />
                  <div className="relative">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                      className="h-12 w-[120px] border-2 focus:border-[#741052] transition-colors rounded-md px-3 bg-white appearance-none"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>
                </div>
              </div>

               {/* Visibility */}
               <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Visibility
                </Label>
                <div className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl bg-gray-50 h-12">
                    <input
                    type="checkbox"
                    id="isVisible"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-[#741052] focus:ring-[#741052] focus:ring-2 cursor-pointer"
                  />
                  <Label htmlFor="isVisible" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                    {isVisible ? "Visible on Menu" : "Hidden from Menu"}
                  </Label>
                </div>
              </div>
            </div>

            {/* Image Preview */}
            <AnimatePresence>
              {image && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <img
                      src={image}
                      alt="Platter Preview"
                      className="w-48 h-48 object-cover rounded-2xl shadow-lg border-4 border-white"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                      onClick={() => setImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Categories Configuration */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#741052]">
              <Layers className="h-5 w-5" />
              Categories Configuration
            </CardTitle>
            <CardDescription>
              Define the main categories for your platter customization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {categories.map((category, categoryIndex) => (
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-4 p-4 border-2 border-gray-100 rounded-2xl bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-[#741052] ml-2">
                      Category {categoryIndex + 1}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectionTypeChange(categoryIndex, 'category')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          category.selectionType === 'category'
                            ? 'bg-[#741052] text-white'
                            : 'bg-white text-gray-400 border border-gray-200 hover:border-[#741052]/30'
                        }`}
                      >
                        Category Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectionTypeChange(categoryIndex, 'items')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          category.selectionType === 'items'
                            ? 'bg-[#741052] text-white'
                            : 'bg-white text-gray-400 border border-gray-200 hover:border-[#741052]/30'
                        }`}
                      >
                        Individual Items
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      {category.selectionType === 'category' ? (
                        <>
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">
                            Select Item Category
                          </Label>
                          <div className="relative">
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
                              className="h-12 w-full border-2 border-gray-100 focus:border-[#741052] transition-colors rounded-xl px-4 bg-white text-sm font-medium"
                              required
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
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center mb-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                              Select Specific Items
                            </Label>
                            <span className="text-[10px] bg-[#741052]/10 text-[#741052] px-2 py-0.5 rounded-full font-bold">
                              {category.itemIds?.length || 0} Selected
                            </span>
                          </div>
                          <div className="border-2 border-gray-100 rounded-xl max-h-48 overflow-y-auto p-2 bg-gray-50/30">
                            {allMenuItems.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {allMenuItems.map((item) => (
                                  <label 
                                    key={item._id} 
                                    className={`flex items-center gap-3 p-2.5 rounded-lg border-2 transition-all cursor-pointer group ${
                                      category.itemIds?.includes(item._id)
                                        ? 'border-[#741052] bg-[#741052]/5'
                                        : 'border-transparent hover:bg-white hover:shadow-sm'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={category.itemIds?.includes(item._id)}
                                      onChange={(e) => {
                                        const currentIds = [...(category.itemIds || [])];
                                        if (e.target.checked) {
                                          handleItemIdsChange(categoryIndex, [...currentIds, item._id]);
                                        } else {
                                          handleItemIdsChange(categoryIndex, currentIds.filter(id => id !== item._id));
                                        }
                                      }}
                                      className="w-4 h-4 rounded border-gray-300 text-[#741052] focus:ring-[#741052]"
                                    />
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-bold text-gray-700 truncate">{item.title}</span>
                                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider truncate">{item.category}</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <p className="text-center py-8 text-xs text-gray-400 font-medium italic">No items found</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveCategory(categoryIndex)}
                      className="h-12 w-12 border-2 border-red-50/50 hover:border-red-400 hover:bg-red-50 transition-all rounded-xl"
                    >
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

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

            <Button
              type="button"
              onClick={handleAddCategory}
              className="bg-gradient-to-r from-[#741052] to-[#d0269b] text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </CardContent>
        </Card>

        {/* Additional Choices */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#741052]">
              <Settings className="h-5 w-5" />
              Additional Choices
            </CardTitle>
            <CardDescription>
              Add optional extras and customizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence>
              {additionalChoices.map((choice, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="border-2 border-gray-200 rounded-xl p-6 bg-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-4">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Choice Heading
                      </Label>
                      <Input
                        type="text"
                        value={choice.heading}
                        onChange={(e) => handleChoiceHeadingChange(index, e.target.value)}
                        placeholder="e.g., Extra Sauces"
                        className="h-12 border-2 focus:border-[#741052] transition-colors"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveChoice(index)}
                      className="h-12 w-12 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 mt-6"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Options</Label>
                    <AnimatePresence>
                      {choice.options.map((option, optIndex) => (
                        <motion.div
                          key={optIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                          className="flex gap-3 items-center"
                        >
                          <Input
                            type="text"
                            value={option.name}
                            onChange={(e) => handleOptionNameChange(index, optIndex, e.target.value)}
                            placeholder="e.g., Garlic Sauce"
                            className="flex-1 h-10 border-2 focus:border-[#741052] transition-colors"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveOption(index, optIndex)}
                            className="h-10 w-10 border-2 border-red-200 hover:border-red-400 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAddOption(index)}
                      className="border-2 border-[#741052] text-[#741052] hover:bg-[#741052] hover:text-white transition-all duration-200 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              type="button"
              onClick={handleAddChoice}
              variant="outline"
              className="border-2 border-[#741052] text-[#741052] hover:bg-[#741052] hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Choice Group
            </Button>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center pt-6"
        >
          <Button
            type="submit"
            size="lg"
            className="bg-gradient-to-r from-[#741052] to-[#d0269b] text-white font-semibold px-12 py-4 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200 flex items-center gap-3 text-lg"
          >
            <Save className="h-5 w-5" />
            Create Platter
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default AddPlatterForm;
