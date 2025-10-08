/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash, Upload } from "lucide-react";

interface Category {
  categoryName: string;
}

interface AdditionalChoice {
  heading: string;
  options: { name: string }[];
}

const AddPlatterForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [image, setImage] = useState<string | null>(null);
  const [platterCategory, setPlatterCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([{ categoryName: "" }]);
  const [additionalChoices, setAdditionalChoices] = useState<AdditionalChoice[]>([
    { heading: "", options: [{ name: "" }] },
  ]);

  // Category Handlers
  const handleCategoryChange = (index: number, value: string) => {
    const updated = [...categories];
    updated[index].categoryName = value;
    setCategories(updated);
  };

  const handleAddCategory = () => {
    setCategories([...categories, { categoryName: "" }]);
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Choices Handlers
  const handleChoiceHeadingChange = (index: number, value: string) => {
    const updated = [...additionalChoices];
    updated[index].heading = value;
    setAdditionalChoices(updated);
  };

  const handleOptionNameChange = (cIndex: number, oIndex: number, value: string) => {
    const updated = [...additionalChoices];
    updated[cIndex].options[oIndex].name = value;
    setAdditionalChoices(updated);
  };

  const handleAddOption = (cIndex: number) => {
    const updated = [...additionalChoices];
    updated[cIndex].options.push({ name: "" });
    setAdditionalChoices(updated);
  };

  const handleAddChoice = () => {
    setAdditionalChoices([...additionalChoices, { heading: "", options: [{ name: "" }] }]);
  };

  const handleRemoveChoice = (index: number) => {
    setAdditionalChoices(additionalChoices.filter((_, i) => i !== index));
  };

  const handleRemoveOption = (cIndex: number, oIndex: number) => {
    const updated = [...additionalChoices];
    updated[cIndex].options.splice(oIndex, 1);
    setAdditionalChoices(updated);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const platterData = {
      title,
      description,
      basePrice,
      image,
      platterCategory,
      categories,
      additionalChoices,
    };

    try {
      const res = await fetch("/api/platter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(platterData),
      });

      if (res.ok) {
        toast.success("✅ Platter added successfully!");
      } else {
        toast.error("❌ Failed to add platter.");
      }
    } catch (error) {
      console.error("Error adding platter:", error);
      toast.error("⚠️ Error adding platter.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-6 space-y-6 h-[550px] overflow-y-auto"
    >
      <h2 className="text-3xl font-bold text-gray-800">Add New Platter</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Section */}
        <div className="space-y-6">
          {/* Basic Details */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow p-5 border"
          >
            <h3 className="font-semibold text-lg mb-4">Basic Details</h3>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 mb-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741052]"
              required
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 mb-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741052]"
              required
            />
            <input
              type="number"
              placeholder="Base Price (Rs)"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value))}
              className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741052]"
              required
            />
          </motion.div>

          {/* Image Upload */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow p-5 border"
          >
            <h3 className="font-semibold text-lg mb-4">Upload Image</h3>
            <label
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
            >
              <Upload className="h-8 w-8 text-gray-500 mb-2" />
              <span className="text-sm text-gray-600">Drag & drop or click to upload</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            {image && (
              <div className="mt-4">
                <img src={image} alt="Preview" className="w-40 h-40 rounded-lg object-cover" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Section */}
        <div className="space-y-6">
          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow p-5 border"
          >
            <h3 className="font-semibold text-lg mb-4">Categories</h3>
            <AnimatePresence>
              {categories.map((cat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 mb-3"
                >
                  <input
                    type="text"
                    value={cat.categoryName}
                    onChange={(e) => handleCategoryChange(index, e.target.value)}
                    placeholder="Category Name"
                    className="flex-1 p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#741052]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(index)}
                    className="p-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <button
              type="button"
              onClick={handleAddCategory}
              className="flex items-center justify-center gap-2 w-full p-3 mt-2 rounded-lg text-white bg-gradient-to-r from-[#741052] to-[#d0269b] hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </motion.div>

          {/* Additional Choices */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow p-5 border"
          >
            <h3 className="font-semibold text-lg mb-4">Additional Choices</h3>
            <AnimatePresence>
              {additionalChoices.map((choice, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="border rounded-lg p-4 mb-4 bg-gray-50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Choice Heading"
                      value={choice.heading}
                      onChange={(e) => handleChoiceHeadingChange(index, e.target.value)}
                      className="flex-1 p-3 border rounded-lg bg-white focus:ring-2 focus:ring-[#741052]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveChoice(index)}
                      className="p-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                  {choice.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-3 mb-2">
                      <input
                        type="text"
                        value={opt.name}
                        placeholder="Option Name"
                        onChange={(e) => handleOptionNameChange(index, optIndex, e.target.value)}
                        className="flex-1 p-3 border rounded-lg bg-white focus:ring-2 focus:ring-[#741052]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index, optIndex)}
                        className="p-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddOption(index)}
                    className="flex items-center justify-center gap-2 w-full p-2 mt-2 rounded-lg text-white bg-gradient-to-r from-[#741052] to-[#d0269b] hover:opacity-90 transition"
                  >
                    <Plus className="w-4 h-4" /> Add Option
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <button
              type="button"
              onClick={handleAddChoice}
              className="flex items-center justify-center gap-2 w-full p-3 mt-2 rounded-lg text-white bg-gradient-to-r from-[#741052] to-[#d0269b] hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" /> Add Choice
            </button>
          </motion.div>
        </div>

        {/* Submit Button */}
        <div className="col-span-1 md:col-span-2">
          <button
            type="submit"
            className="w-full p-4 font-semibold text-white rounded-xl bg-gradient-to-r from-[#741052] to-[#d0269b] shadow hover:opacity-90 transition"
          >
            Add Platter
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddPlatterForm;
