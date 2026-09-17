/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import { VariationConfig, SimpleVariation } from "../../types/variations";
import { toast } from "sonner";
import { X, Plus, Trash2, Upload, UtensilsCrossed, Info, Image as ImageIcon } from "lucide-react";
import CreateCategoryModal from "./CreateCategoryModal";
import Preloader from "./Preloader";
import MediaGallery from "./MediaGallery";

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
    image: string;
    variations: LegacyVariation[];
    status: "in stock" | "out of stock";
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
    isVisible?: boolean;
  };
  onClose: () => void;
  onUpdate: () => void;
}

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 shrink-0">
      {children}
    </span>
    <div className="h-px bg-neutral-100 dark:bg-neutral-800 flex-1" />
  </div>
);

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
    discountType: item.discountType || "percentage",
    discountValue: item.discountValue || 0,
    isVisible: item.isVisible !== undefined ? item.isVisible : true,
  });

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
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

  const variations = currentVariationConfig.simpleVariations || [];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        body: JSON.stringify({ image: base64, folder: 'cafe-little-karachi/menu_items' }),
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData(prev => ({ ...prev, image: data.url }));
      toast.success('Image uploaded successfully!');
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden border border-neutral-100 dark:border-neutral-800">
        {loading && <Preloader />}

        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#741052] to-[#d0269b] flex items-center justify-center text-white shadow-sm">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">Edit Menu Item</h2>
              <p className="text-xs text-neutral-400">Update item details, pricing, discount, and variations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form id="edit-item-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Basic Info, Pricing, Discount, Visibility & Image */}
            <div className="space-y-5">
              
              {/* Basic Info */}
              <div>
                <SectionHeading>Basic Information</SectionHeading>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Item Title <span className="text-[#741052]">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Chicken Biryani Single"
                      required
                      className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#741052]/30 focus:border-[#741052] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief culinary description of the dish..."
                      rows={3}
                      className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#741052]/30 focus:border-[#741052] transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        Base Price (Rs.) <span className="text-[#741052]">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                        className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#741052]/30 focus:border-[#741052] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        Category <span className="text-[#741052]">*</span>
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setIsCategoryModalOpen(true);
                          } else {
                            handleChange(e);
                          }
                        }}
                        required
                        className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#741052]/30 focus:border-[#741052] transition-colors"
                      >
                        <option value="">Select category</option>
                        {availableCategories.map((cat) => (
                          <option key={cat._id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                        <option value="__new__">+ Create New Category</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount */}
              <div>
                <SectionHeading>Discount & Promotion</SectionHeading>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#741052]/30 focus:border-[#741052] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Discount Type
                    </label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleChange}
                      className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#741052]/30 focus:border-[#741052] transition-colors"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (Rs.)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Availability & Visibility */}
              <div>
                <SectionHeading>Availability & Visibility</SectionHeading>
                <div className="grid grid-cols-2 gap-3">
                  {/* Status Toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Stock Status
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, status: 'in stock' }))}
                        className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                          formData.status === 'in stock'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        In Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, status: 'out of stock' }))}
                        className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                          formData.status === 'out of stock'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        Out
                      </button>
                    </div>
                  </div>

                  {/* Visibility Toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Menu Visibility
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, isVisible: true }))}
                        className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                          formData.isVisible
                            ? 'bg-[#741052] text-white shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        Visible
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, isVisible: false }))}
                        className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                          !formData.isVisible
                            ? 'bg-neutral-600 text-white shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        Hidden
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Image */}
              <div>
                <SectionHeading>Item Image</SectionHeading>
                <div className="space-y-3">
                  <input
                    id="edit-menu-item-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="hidden"
                  />

                  {formData.image ? (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                      <div className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                        <img
                          src={formData.image}
                          alt="Current item image"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-[#741052] dark:text-[#d0269b] uppercase tracking-wider">Current Image</p>
                        <p className="text-[11px] text-neutral-400 truncate max-w-[200px] mt-0.5">{formData.image}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            type="button"
                            onClick={() => setShowMediaGallery(true)}
                            className="text-[11px] font-semibold text-[#741052] dark:text-fuchsia-400 hover:underline"
                          >
                            Choose Gallery
                          </button>
                          <span className="text-neutral-300 dark:text-neutral-700">•</span>
                          <button
                            type="button"
                            onClick={() => document.getElementById('edit-menu-item-file-input')?.click()}
                            disabled={imageUploading}
                            className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:underline"
                          >
                            {imageUploading ? 'Uploading...' : 'Upload New'}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Remove image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMediaGallery(true)}
                        className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-[#741052]/30 dark:border-[#d0269b]/40 bg-[#741052]/5 dark:bg-[#741052]/10 hover:bg-[#741052]/10 text-[#741052] dark:text-fuchsia-300 text-xs font-semibold transition-all"
                      >
                        <ImageIcon size={15} />
                        <span>Select Gallery</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => document.getElementById('edit-menu-item-file-input')?.click()}
                        disabled={imageUploading}
                        className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#741052] text-neutral-600 dark:text-neutral-300 hover:text-[#741052] text-xs font-semibold transition-all bg-neutral-50/50 dark:bg-neutral-800/30"
                      >
                        {imageUploading ? (
                          <span className="animate-pulse">Uploading...</span>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>Upload New</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Variations (Sizes / Portions / Options) */}
            <div className="space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <SectionHeading>Variations (Sizes / Portions)</SectionHeading>
                <button
                  type="button"
                  onClick={addVariation}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#741052] dark:text-[#d0269b] border border-[#741052]/30 dark:border-[#d0269b]/30 rounded-lg hover:bg-[#741052]/5 dark:hover:bg-[#d0269b]/10 transition-colors mb-3 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Variation
                </button>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                {variations.length === 0 ? (
                  <div className="border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-6 text-center text-neutral-400 dark:text-neutral-500">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-2 text-neutral-400">
                      <Plus className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">No variations configured</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Add sizes or portions (e.g. Half, Full, 1 Pc, 2 Pcs) with their respective prices</p>
                  </div>
                ) : (
                  variations.map((variation, index) => (
                    <div
                      key={variation.id}
                      className="flex items-center gap-2 p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-100 dark:border-neutral-700/60 hover:border-neutral-200 dark:hover:border-neutral-600 transition-colors"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          value={variation.name}
                          onChange={(e) =>
                            handleVariationChange(index, "name", e.target.value)
                          }
                          placeholder="Variation name (e.g. Half, Full, Large)"
                          className="w-full text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#741052] focus:border-[#741052]"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          value={variation.price}
                          onChange={(e) =>
                            handleVariationChange(index, "price", e.target.value)
                          }
                          placeholder="Price (Rs.)"
                          min="0"
                          step="0.01"
                          className="w-full text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#741052] focus:border-[#741052]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariation(index)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                        title="Delete variation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Info banner */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-100 dark:border-neutral-800 flex items-start gap-2.5 shrink-0">
                <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Variations let customers pick specific portions or sizes with separate pricing. If no variations are set, the base price applies.
                </p>
              </div>
            </div>

            <CreateCategoryModal
              isOpen={isCategoryModalOpen}
              onClose={() => setIsCategoryModalOpen(false)}
              onCategoryCreated={handleCategoryCreated}
            />
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
            form="edit-item-form"
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#741052] to-[#d0269b] hover:opacity-90 transition-all shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Media Gallery Picker Modal */}
      {showMediaGallery && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#741052] dark:text-fuchsia-400" />
                Select Image from Media Gallery
              </h3>
              <button
                type="button"
                onClick={() => setShowMediaGallery(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MediaGallery
                isPicker={true}
                onSelectImage={(url) => {
                  setFormData(prev => ({ ...prev, image: url }));
                  setShowMediaGallery(false);
                  toast.success("Image selected from Media Gallery!");
                }}
                onClosePicker={() => setShowMediaGallery(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditMenuItemForm;
