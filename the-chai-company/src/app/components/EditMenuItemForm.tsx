import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VariationConfig, SimpleVariation } from "../../types/variations";
import { toast } from "sonner";
import { X, Save, Plus, Trash2, Upload, Edit, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateCategoryModal from "./CreateCategoryModal";

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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          ref={(el) => {
            if (el) {
              el.style.maxHeight = '90vh';
            }
          }}
          className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#741052] to-[#d0269b] p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit className="h-6 w-6" />
                <div>
                  <h2 className="text-2xl font-bold">Edit Menu Item</h2>
                  <p className="text-white/80 text-sm mt-1">Update your menu item details</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <motion.div
                className="space-y-6"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-lg font-semibold text-[#741052] mb-4 flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Basic Information
                  </h3>

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                        Item Title *
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter item title"
                        className="mt-1 focus:ring-[#741052] focus:border-[#741052]"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter item description"
                        rows={3}
                        className="mt-1 focus:ring-[#741052] focus:border-[#741052]"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <Label htmlFor="price" className="text-sm font-semibold text-gray-700">
                        Base Price (Rs.) *
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="mt-1 focus:ring-[#741052] focus:border-[#741052]"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <Label htmlFor="category" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Category *
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
                        <SelectTrigger className="mt-1 focus:ring-[#741052] focus:border-[#741052] h-12">
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
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
                  <h3 className="text-lg font-semibold text-[#741052] mb-4 flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Media & Status
                  </h3>

                  <div className="space-y-4">
                    {/* Image Upload */}
                    <div>
                      <Label htmlFor="image" className="text-sm font-semibold text-gray-700">
                        Item Image
                      </Label>
                      <div className="mt-1">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="file:bg-gradient-to-r file:from-[#741052] file:to-[#d0269b] file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:font-semibold hover:file:opacity-90"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Upload a high-quality image for better presentation
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                        Availability Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value as "in stock" | "out of stock" })}
                      >
                        <SelectTrigger className="mt-1 focus:ring-[#741052] focus:border-[#741052]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in stock">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              In Stock
                            </div>
                          </SelectItem>
                          <SelectItem value="out of stock">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Out of Stock
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Variations */}
              <motion.div
                className="space-y-6"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#741052] flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Variations
                    </h3>
                    <Button
                      type="button"
                      onClick={addVariation}
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {variations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No variations added yet</p>
                        <p className="text-sm">Click "Add" to create variations</p>
                      </div>
                    ) : (
                      variations.map((variation, index) => (
                        <motion.div
                          key={variation.id}
                          className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex-1">
                            <Input
                              type="text"
                              value={variation.name}
                              onChange={(e) =>
                                handleVariationChange(index, "name", e.target.value)
                              }
                              placeholder="Variation name (e.g., Small, Large)"
                              className="focus:ring-[#741052] focus:border-[#741052]"
                            />
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              value={variation.price}
                              onChange={(e) =>
                                handleVariationChange(index, "price", e.target.value)
                              }
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="focus:ring-[#741052] focus:border-[#741052]"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeVariation(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {variations.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Tip:</strong> Variations allow customers to choose different sizes, portions, or customizations with additional pricing.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 hover:border-gray-400 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-[#741052] to-[#d0269b] text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Item
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditMenuItemForm;
