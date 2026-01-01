"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VariationConfig, SimpleVariation } from "../../types/variations";
import { toast } from "sonner";
import {
  Plus,
  X,
  ImageIcon,
  DollarSign,
  Tag,
  FileText,
  Settings,
  Save,
  Trash2,
  Upload,
  Layers,
  Percent,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateCategoryModal from "./CreateCategoryModal";
import { useEffect } from "react";

const AddMenuItemForm = () => {
  const [variationConfig, setVariationConfig] = useState<VariationConfig>({
    simpleVariations: [],
    simpleSelection: 'single',
    allowMultipleCategories: false,
  });

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    image: null as File | string | null,
    description: "",
    category: "",
    discountType: "percentage",
    discountValue: "",
    isVisible: true,
  });

  // Computed properties for backward compatibility
  const enableVariations = variationConfig.simpleVariations && variationConfig.simpleVariations.length > 0;
  const variations = variationConfig.simpleVariations || [];

  const [availableCategories, setAvailableCategories] = useState<{ _id: string, name: string }[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setAvailableCategories(data))
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  const handleCategoryCreated = (newCat: { _id: string, name: string }) => {
    setAvailableCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
    setFormData(prev => ({ ...prev, category: newCat.name }));
  };

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
    field: keyof SimpleVariation,
    value: string | number
  ) => {
    setVariationConfig(prev => {
      const currentVariations = prev.simpleVariations || [];
      const updatedVariations = currentVariations.map((variation, i) =>
        i === index ? { ...variation, [field]: field === 'price' ? parseFloat(value as string) || 0 : value } : variation
      );
      return {
        ...prev,
        simpleVariations: updatedVariations
      };
    });
  };

  const addVariation = () => {
    setVariationConfig(prev => ({
      ...prev,
      simpleVariations: [
        ...(prev.simpleVariations || []),
        { id: `variation-${Date.now()}`, name: "", price: 0 }
      ]
    }));
  };

  const removeVariation = (index: number) => {
    setVariationConfig(prev => ({
      ...prev,
      simpleVariations: (prev.simpleVariations || []).filter((_, i) => i !== index)
    }));
  };

  const toggleVariations = (enabled: boolean) => {
    setVariationConfig(prev => ({
      ...prev,
      simpleVariations: enabled ? [{ id: `variation-${Date.now()}`, name: "", price: 0 }] : []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.image || !formData.description || !formData.category) {
      toast.error("All fields except variations are required!");
      return;
    }

    // Convert VariationConfig to API format
    const apiVariations = enableVariations
      ? variations
          .filter((v) => v.name.trim() !== "" && v.price > 0)
          .map((v) => ({ name: v.name, price: v.price.toString() }))
      : [];

    const menuItemData = {
      ...formData,
      variations: apiVariations,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      isVisible: formData.isVisible,
    };

    try {
      const response = await fetch("/api/menuitems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menuItemData),
      });

      if (response.ok) {
        toast.success("Menu item added successfully!");
        setFormData({
          title: "",
          price: "",
          image: null,
          description: "",
          category: "",
          discountType: "percentage",
          discountValue: "",
          isVisible: true,
        });
        setVariationConfig({
          simpleVariations: [],
          simpleSelection: 'single',
          allowMultipleCategories: false,
        });
      } else {
        const errorData = await response.json();
        toast.error(`Failed to add menu item: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred. Please try again.");
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
            Add Menu Item
          </h1>
          <p className="text-gray-600">Create a delicious menu item for your customers</p>
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
              Enter the fundamental details of your menu item
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Item Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Chicken Biryani"
                  className="h-12 border-2 focus:border-[#741052] transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price (Rs)
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="h-12 border-2 focus:border-[#741052] transition-colors"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* Discount and Visibility */}
            <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                <Label htmlFor="discountValue" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Discount (Optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="discountValue"
                    name="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="h-12 border-2 focus:border-[#741052] transition-colors flex-1"
                    min="0"
                  />
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value }))}
                  >
                    <SelectTrigger className="w-[120px] h-12 border-2 focus:border-[#741052] transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  {formData.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Visibility
                </Label>
                <div className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl bg-gray-50 h-12">
                   <input
                    type="checkbox"
                    id="isVisible"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-[#741052] focus:ring-[#741052] focus:ring-2 cursor-pointer"
                  />
                  <Label htmlFor="isVisible" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                    {formData.isVisible ? "Visible on Menu" : "Hidden from Menu"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Category
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => {
                  if (value === '__new__') {
                    setIsCategoryModalOpen(true);
                  } else {
                    setFormData(prev => ({ ...prev, category: value }));
                  }
                }}
              >
                <SelectTrigger className="h-12 border-2 focus:border-[#741052] transition-colors">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat._id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__" className="text-[#741052] font-semibold">
                    + Create New Category
                  </SelectItem>
                </SelectContent>
              </Select>
              <CreateCategoryModal 
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onCategoryCreated={handleCategoryCreated}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Item Image
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
                    {formData.image ? 'Change Image' : 'Upload Image'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Variations
                </Label>
                <div className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                  <input
                    type="checkbox"
                    id="enableVariations"
                    checked={enableVariations}
                    onChange={(e) => toggleVariations(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-[#741052] focus:ring-[#741052] focus:ring-2"
                  />
                  <Label htmlFor="enableVariations" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Enable size/portion variations
                  </Label>
                </div>
              </div>
            </div>

            {/* Image Preview */}
            <AnimatePresence>
              {formData.image && typeof formData.image === 'string' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <img
                      src={formData.image}
                      alt="Menu Item Preview"
                      className="w-48 h-48 object-cover rounded-2xl shadow-lg border-4 border-white"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                      onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your menu item in detail..."
                className="min-h-24 border-2 focus:border-[#741052] transition-colors resize-none"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Variations Section */}
        <AnimatePresence>
          {enableVariations && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-[#741052]">
                    <Settings className="h-5 w-5" />
                    Item Variations
                  </CardTitle>
                  <CardDescription>
                    Add different sizes, portions, or customizations with their respective prices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatePresence>
                    {variations.map((variation, index) => (
                      <motion.div
                        key={variation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex gap-3 items-end"
                      >
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-600 mb-2 block">
                            Variation {index + 1}
                          </Label>
                          <Input
                            type="text"
                            value={variation.name}
                            onChange={(e) => handleVariationChange(index, "name", e.target.value)}
                            placeholder="e.g., Large, Small, Family Size"
                            className="h-12 border-2 focus:border-[#741052] transition-colors"
                          />
                        </div>
                        <div className="w-32">
                          <Label className="text-sm font-medium text-gray-600 mb-2 block">
                            Price (Rs)
                          </Label>
                          <Input
                            type="number"
                            value={variation.price}
                            onChange={(e) => handleVariationChange(index, "price", e.target.value)}
                            placeholder="0"
                            className="h-12 border-2 focus:border-[#741052] transition-colors"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        {variations.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeVariation(index)}
                            className="h-12 w-12 border-2 border-red-200 hover:border-red-400 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <Button
                    type="button"
                    onClick={addVariation}
                    className="bg-gradient-to-r from-[#741052] to-[#d0269b] text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Variation
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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
            Create Menu Item
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default AddMenuItemForm;
