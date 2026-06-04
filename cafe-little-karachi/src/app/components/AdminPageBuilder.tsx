"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  Star, 
  User, 
  Grid, 
  Sliders, 
  Image as ImageIcon,
  Compass,
  FileText,
  Minimize2,
  Trash,
  Upload,
  X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// --- Types ---
interface MenuItem {
  _id: string;
  title: string;
}

interface CategoryItem {
  _id: string;
  name: string;
}

interface PlatterCategoryItem {
  _id: string;
  name: string;
}

interface PageSection {
  id: string;
  type: 'hero' | 'banner' | 'rich-content' | 'divider' | 'testimonials' | 'slider' | 'grid';
  title: string;
  isVisible: boolean;
  props: {
    sourceType?: 'category' | 'manual';
    itemType?: 'menu' | 'platter';
    categoryId?: string;
    itemIds?: string[];
    
    // Grid/Slider specific
    columns?: 2 | 3 | 4;
    cardStyle?: 'minimal' | 'compact' | 'gourmet' | 'list';
    bgColor?: 'default' | 'grey' | 'light-fuchsia' | 'dark-fuchsia';
    spacingY?: 'small' | 'medium' | 'large';

    // Hero specific
    subtitle?: string;
    backgroundImage?: string;
    mobileBackgroundImage?: string;
    overlayOpacity?: number;
    ctaText?: string;
    ctaAction?: 'scroll' | 'link';
    ctaLink?: string;
    align?: 'left' | 'center' | 'right';
    textColor?: 'white' | 'black' | 'fuchsia';
    displayMode?: 'overlay' | 'direct';
    bannerSize?: 'small' | 'medium' | 'large' | 'freesize';
    showText?: boolean;

    // Promo banner specific
    bannerBg?: string; // hex or gradient class
    bannerTextColor?: string;
    hasCountdown?: boolean;
    countdownEnd?: string;

    // Rich content specific
    description?: string;
    image?: string;
    mediaAlign?: 'left' | 'right';

    // Divider specific
    dividerHeight?: 'small' | 'medium' | 'large';
    dividerStyle?: 'none' | 'solid' | 'dashed' | 'gold-border' | 'fuchsia-line';

    // Testimonials specific
    testimonials?: Array<{
      id: string;
      name: string;
      rating: number;
      comment: string;
      avatar?: string;
    }>;
  };
}

const SECTION_PRESETS = [
  { 
    type: 'hero', 
    label: 'Hero Banner', 
    desc: 'Main header section with custom text, background image, and CTA.',
    defaultProps: {
      subtitle: "Authentic Pakistani & Karachi Cuisines",
      backgroundImage: "/bg-hero.webp",
      mobileBackgroundImage: "/bg-hero.webp",
      overlayOpacity: 0.4,
      ctaText: "Order Now",
      ctaAction: "scroll",
      ctaLink: "",
      align: "center",
      textColor: "white",
      displayMode: "overlay",
      bannerSize: "large",
      showText: true
    }
  },
  { 
    type: 'banner', 
    label: 'Promo Banner', 
    desc: 'Gradient banner with a call to action and optional countdown timer.',
    defaultProps: {
      subtitle: "Limited time offer! Use code CLK20 at checkout.",
      bannerBg: "linear-gradient(135deg, #741052 0%, #d0269b 100%)",
      bannerTextColor: "#ffffff",
      ctaText: "Claim Deal",
      ctaLink: "#",
      hasCountdown: false,
      countdownEnd: ""
    }
  },
  { 
    type: 'rich-content', 
    label: 'Story Row', 
    desc: 'A side-by-side block of text and image for storytelling or specials.',
    defaultProps: {
      description: "Crafted with love and original spices imported straight from Karachi. Little Karachi Express brings you the ultimate food experience in every bite.",
      image: "/cafe-banner.webp",
      mediaAlign: "right",
      bgColor: "default"
    }
  },
  { 
    type: 'divider', 
    label: 'Spacer Divider', 
    desc: 'Add elegant borders or padding to separate sections visually.',
    defaultProps: {
      dividerHeight: "medium",
      dividerStyle: "fuchsia-line"
    }
  },
  { 
    type: 'testimonials', 
    label: 'Customer Feedback', 
    desc: 'Horizontal scroll of five-star customer testimonials.',
    defaultProps: {
      testimonials: [
        { id: "1", name: "Farhan A.", rating: 5, comment: "The Biryani tasted exactly like Karachi! Truly authentic flavor.", avatar: "🍛" },
        { id: "2", name: "Ayesha K.", rating: 5, comment: "Amazing BBQ platters. The seekh kebabs were incredibly juicy.", avatar: "🔥" }
      ]
    }
  },
  { 
    type: 'slider', 
    label: 'Category Slider', 
    desc: 'Horizontal swipeable item slider for a chosen category.',
    defaultProps: {
      sourceType: "category",
      itemType: "menu",
      categoryId: "",
      itemIds: [],
      cardStyle: "gourmet",
      bgColor: "default",
      spacingY: "medium"
    }
  },
  { 
    type: 'grid', 
    label: 'Product Grid', 
    desc: 'Standard multi-column grid layout for products.',
    defaultProps: {
      sourceType: "category",
      itemType: "menu",
      categoryId: "",
      itemIds: [],
      columns: 4,
      cardStyle: "gourmet",
      bgColor: "default",
      spacingY: "medium"
    }
  }
];

// --- Sortable Section Component ---
function SortableSection({ section, index, updateSection, removeSection, items, categories, platterCategories }: {
  section: PageSection;
  index: number;
  updateSection: (id: string, updates: Partial<PageSection>) => void;
  removeSection: (id: string) => void;
  items: MenuItem[];
  categories: CategoryItem[];
  platterCategories: PlatterCategoryItem[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingPc, setUploadingPc] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'backgroundImage' | 'mobileBackgroundImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'backgroundImage') {
      setUploadingPc(true);
    } else {
      setUploadingMobile(true);
    }

    try {
      // Read file as base64 data URL
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(file);
      const base64String = await base64Promise;

      // Upload to Cloudinary upload API
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64String }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await res.json();
      updateProps({ [field]: data.url });
      toast.success(`${field === 'backgroundImage' ? 'PC' : 'Mobile'} banner uploaded successfully!`);
    } catch (error: any) {
      console.error(error);
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      if (field === 'backgroundImage') {
        setUploadingPc(false);
      } else {
        setUploadingMobile(false);
      }
    }
  };

  const sourceType = section.props.sourceType || 'category';
  const itemType = section.props.itemType || 'menu';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const updateProps = (updates: any) => {
    updateSection(section.id, { props: { ...section.props, ...updates } });
  };

  const toggleItemId = (itemId: string) => {
    const currentIds = section.props.itemIds || [];
    const newIds = currentIds.includes(itemId)
      ? currentIds.filter(id => id !== itemId)
      : [...currentIds, itemId];
    updateProps({ itemIds: newIds });
  };

  const filteredItems = items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Testimonials Helpers
  const addTestimonial = () => {
    const currentList = section.props.testimonials || [];
    const newItem = {
      id: uuidv4(),
      name: "Guest Diner",
      rating: 5,
      comment: "Delicious food! Fast service.",
      avatar: "🍽️"
    };
    updateProps({ testimonials: [...currentList, newItem] });
  };

  const removeTestimonial = (tid: string) => {
    const currentList = section.props.testimonials || [];
    updateProps({ testimonials: currentList.filter(t => t.id !== tid) });
  };

  const updateTestimonialItem = (tid: string, fields: any) => {
    const currentList = section.props.testimonials || [];
    const updated = currentList.map(t => t.id === tid ? { ...t, ...fields } : t);
    updateProps({ testimonials: updated });
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl shadow-sm mb-4 overflow-hidden transition-shadow duration-200 hover:shadow-md"
    >
      {/* Header Bar */}
      <div className="flex items-center gap-3 p-4 bg-neutral-50/50 dark:bg-neutral-950/20 border-b border-neutral-100 dark:border-neutral-800/40">
        <div {...attributes} {...listeners} className="cursor-grab text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
          <GripVertical size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate text-sm sm:text-base">
              {section.title || "Untitled Section"}
            </span>
            <Badge variant="secondary" className="text-[10px] sm:text-xs uppercase bg-[#741052]/10 text-[#741052] border border-[#741052]/10 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:border-fuchsia-500/10">
              {section.type}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Visibility toggle icon */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => updateSection(section.id, { isVisible: !section.isVisible })}
            className={`h-8 w-8 rounded-lg ${section.isVisible ? 'text-neutral-600 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-600'}`}
          >
            {section.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </Button>

          {/* Expand/Collapse */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>

          {/* Delete Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" 
            onClick={() => removeSection(section.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      {expanded && (
        <div className="p-5 space-y-5 border-t border-neutral-100 dark:border-neutral-800/40 text-xs sm:text-sm">
          {/* Main Title Input */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Display Section Title</Label>
              <Input 
                value={section.title} 
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                placeholder="e.g. Delicious Platters or Feast Deals"
                className="mt-1 h-9 rounded-lg"
              />
            </div>
            
            {/* HERO SECTION CONFIG */}
            {section.type === 'hero' && (
              <div>
                <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Subtitle</Label>
                <Input 
                  value={section.props.subtitle || ""} 
                  onChange={(e) => updateProps({ subtitle: e.target.value })}
                  placeholder="Pakistani Cuisines & BBQ"
                  className="mt-1 h-9 rounded-lg"
                />
              </div>
            )}
            
            {/* RICH CONTENT CONFIG */}
            {section.type === 'rich-content' && (
              <div>
                <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Media Align</Label>
                <select 
                  className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3"
                  value={section.props.mediaAlign || "right"}
                  onChange={(e) => updateProps({ mediaAlign: e.target.value })}
                >
                  <option value="left">Image Left / Text Right</option>
                  <option value="right">Image Right / Text Left</option>
                </select>
              </div>
            )}
          </div>

          {/* Custom Settings per Section Type */}

          {/* 1. HERO SECTION CONFIG */}
          {section.type === 'hero' && (
            <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800/40 space-y-4">
              <h4 className="font-bold text-neutral-700 dark:text-neutral-300">Hero Customizations</h4>

              {/* Layout and Sizing Controls */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Display Mode</Label>
                  <select 
                    className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900"
                    value={section.props.displayMode || "overlay"}
                    onChange={(e) => updateProps({ displayMode: e.target.value })}
                  >
                    <option value="overlay" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Overlay text on image</option>
                    <option value="direct" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Direct raw banner image</option>
                  </select>
                </div>
                <div>
                  <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Banner Size (Height)</Label>
                  <select 
                    className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900"
                    value={section.props.bannerSize || "large"}
                    onChange={(e) => updateProps({ bannerSize: e.target.value })}
                  >
                    <option value="small" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Small Height (Compact)</option>
                    <option value="medium" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Medium Height</option>
                    <option value="large" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Large Height (Default)</option>
                    <option value="freesize" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Free Size (Full natural size)</option>
                  </select>
                </div>
                {(section.props.displayMode || "overlay") === "overlay" && (
                  <div className="flex flex-col justify-end pb-1.5">
                    <div className="flex items-center gap-2">
                      <Switch 
                        id={`show-text-${section.id}`}
                        checked={section.props.showText !== false}
                        onCheckedChange={(val: boolean) => updateProps({ showText: val })}
                      />
                      <Label htmlFor={`show-text-${section.id}`} className="font-semibold cursor-pointer">Show Banner Text Overlay</Label>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image Upload Row */}
              <div className="grid gap-6 md:grid-cols-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
                {/* PC Banner */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="font-semibold text-neutral-850 dark:text-neutral-200">Desktop / PC Banner</Label>
                    {section.props.backgroundImage && (
                      <button 
                        onClick={() => updateProps({ backgroundImage: "" })}
                        className="text-[11px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <X size={12} /> Clear
                      </button>
                    )}
                  </div>
                  {section.props.backgroundImage ? (
                    <div className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 aspect-[21/9]">
                      <img 
                        src={section.props.backgroundImage} 
                        alt="PC Banner Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center border-2 border-dashed border-neutral-350 dark:border-neutral-700 rounded-lg aspect-[21/9] bg-white dark:bg-neutral-950 text-neutral-400">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 mb-1.5 opacity-60" />
                        <span className="text-xs">No PC Banner Uploaded</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input 
                      value={section.props.backgroundImage || ""} 
                      onChange={(e) => updateProps({ backgroundImage: e.target.value })}
                      placeholder="Image URL or upload file"
                      className="h-9 rounded-lg flex-1 text-xs"
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        id={`upload-pc-${section.id}`}
                        className="hidden" 
                        onChange={(e) => handleBannerUpload(e, 'backgroundImage')}
                        disabled={uploadingPc}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingPc}
                        onClick={() => document.getElementById(`upload-pc-${section.id}`)?.click()}
                        className="h-9 rounded-lg font-semibold flex items-center gap-1.5 text-xs"
                      >
                        {uploadingPc ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mobile Banner */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="font-semibold text-neutral-850 dark:text-neutral-200">Mobile Banner</Label>
                    {section.props.mobileBackgroundImage && (
                      <button 
                        onClick={() => updateProps({ mobileBackgroundImage: "" })}
                        className="text-[11px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <X size={12} /> Clear
                      </button>
                    )}
                  </div>
                  {section.props.mobileBackgroundImage ? (
                    <div className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 aspect-[9/16] w-24 mx-auto">
                      <img 
                        src={section.props.mobileBackgroundImage} 
                        alt="Mobile Banner Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center border-2 border-dashed border-neutral-350 dark:border-neutral-700 rounded-lg aspect-[9/16] w-24 mx-auto bg-white dark:bg-neutral-950 text-neutral-400">
                      <div className="text-center p-2">
                        <ImageIcon className="mx-auto h-6 w-6 mb-1 opacity-60" />
                        <span className="text-[10px] block leading-tight">No Mobile Banner</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input 
                      value={section.props.mobileBackgroundImage || ""} 
                      onChange={(e) => updateProps({ mobileBackgroundImage: e.target.value })}
                      placeholder="Image URL or upload file"
                      className="h-9 rounded-lg flex-1 text-xs"
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        id={`upload-mobile-${section.id}`}
                        className="hidden" 
                        onChange={(e) => handleBannerUpload(e, 'mobileBackgroundImage')}
                        disabled={uploadingMobile}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingMobile}
                        onClick={() => document.getElementById(`upload-mobile-${section.id}`)?.click()}
                        className="h-9 rounded-lg font-semibold flex items-center gap-1.5 text-xs"
                      >
                        {uploadingMobile ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text configurations, visible only when in overlay mode with text toggle enabled */}
              {(section.props.displayMode || "overlay") === "overlay" && section.props.showText !== false && (
                <div className="grid gap-4 sm:grid-cols-3 border-t border-neutral-100 dark:border-neutral-800/40 pt-4">
                  <div>
                    <Label className="font-semibold">Overlay Opacity (0 to 1)</Label>
                    <Input 
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={section.props.overlayOpacity ?? 0.4} 
                      onChange={(e) => updateProps({ overlayOpacity: parseFloat(e.target.value) || 0 })}
                      className="mt-1 h-9 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">Text Alignment</Label>
                    <select 
                      className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900"
                      value={section.props.align || "center"}
                      onChange={(e) => updateProps({ align: e.target.value })}
                    >
                      <option value="left" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Left</option>
                      <option value="center" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Center</option>
                      <option value="right" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Right</option>
                    </select>
                  </div>
                  <div>
                    <Label className="font-semibold">Text Theme Color</Label>
                    <select 
                      className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900"
                      value={section.props.textColor || "white"}
                      onChange={(e) => updateProps({ textColor: e.target.value })}
                    >
                      <option value="white" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">White Theme (Dark Hero bg)</option>
                      <option value="black" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Black Theme (Light Hero bg)</option>
                      <option value="fuchsia" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Fuchsia Brand Theme</option>
                    </select>
                  </div>
                  <div>
                    <Label className="font-semibold">Button Text (CTA)</Label>
                    <Input 
                      value={section.props.ctaText || ""} 
                      onChange={(e) => updateProps({ ctaText: e.target.value })}
                      placeholder="Order Now"
                      className="mt-1 h-9 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">Button Action</Label>
                    <select 
                      className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900"
                      value={section.props.ctaAction || "scroll"}
                      onChange={(e) => updateProps({ ctaAction: e.target.value })}
                    >
                      <option value="scroll" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Scroll to Menu</option>
                      <option value="link" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Custom URL Link</option>
                    </select>
                  </div>
                  {section.props.ctaAction === 'link' && (
                    <div>
                      <Label className="font-semibold">Custom Link URL</Label>
                      <Input 
                        value={section.props.ctaLink || ""} 
                        onChange={(e) => updateProps({ ctaLink: e.target.value })}
                        placeholder="https://..."
                        className="mt-1 h-9 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. PROMO BANNER CONFIG */}
          {section.type === 'banner' && (
            <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800/40 space-y-4">
              <h4 className="font-bold text-neutral-700 dark:text-neutral-300">Banner Configurations</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="font-semibold">Banner Background (Solid Color / CSS Gradient)</Label>
                  <Input 
                    value={section.props.bannerBg || ""} 
                    onChange={(e) => updateProps({ bannerBg: e.target.value })}
                    placeholder="linear-gradient(135deg, #741052 0%, #d0269b 100%)"
                    className="mt-1 h-9 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Text Color</Label>
                  <Input 
                    value={section.props.bannerTextColor || "#ffffff"} 
                    onChange={(e) => updateProps({ bannerTextColor: e.target.value })}
                    placeholder="#ffffff"
                    className="mt-1 h-9 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Button (CTA) Text</Label>
                  <Input 
                    value={section.props.ctaText || ""} 
                    onChange={(e) => updateProps({ ctaText: e.target.value })}
                    placeholder="Claim Deal"
                    className="mt-1 h-9 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Button URL Link</Label>
                  <Input 
                    value={section.props.ctaLink || ""} 
                    onChange={(e) => updateProps({ ctaLink: e.target.value })}
                    placeholder="/order#specials"
                    className="mt-1 h-9 rounded-lg"
                  />
                </div>
              </div>

              {/* Countdown section */}
              <div className="flex items-center gap-4 mt-2">
                <Switch 
                  id={`countdown-${section.id}`}
                  checked={section.props.hasCountdown || false}
                  onCheckedChange={(val: boolean) => updateProps({ hasCountdown: val })}
                />
                <Label htmlFor={`countdown-${section.id}`} className="font-semibold cursor-pointer">Enable Limited-Time Countdown Timer</Label>
              </div>

              {section.props.hasCountdown && (
                <div>
                  <Label className="font-semibold">Timer Expiration Date & Time</Label>
                  <Input 
                    type="datetime-local"
                    value={section.props.countdownEnd || ""}
                    onChange={(e) => updateProps({ countdownEnd: e.target.value })}
                    className="mt-1 h-9 rounded-lg w-fit"
                  />
                </div>
              )}
            </div>
          )}

          {/* 3. RICH CONTENT CONFIG */}
          {section.type === 'rich-content' && (
            <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800/40 space-y-4">
              <h4 className="font-bold text-neutral-700 dark:text-neutral-300">Rich Description & Media</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="font-semibold">Image path / URL</Label>
                  <Input 
                    value={section.props.image || ""} 
                    onChange={(e) => updateProps({ image: e.target.value })}
                    placeholder="/cafe-banner.webp"
                    className="mt-1 h-9 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Background Theme</Label>
                  <select 
                    className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3"
                    value={section.props.bgColor || "default"}
                    onChange={(e) => updateProps({ bgColor: e.target.value })}
                  >
                    <option value="default">Default Transparent</option>
                    <option value="white">Solid White</option>
                    <option value="light-fuchsia">Soft Light Fuchsia</option>
                    <option value="dark-fuchsia">Dark Fuchsia (#741052)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold">Description Text</Label>
                  <textarea 
                    rows={4}
                    value={section.props.description || ""} 
                    onChange={(e) => updateProps({ description: e.target.value })}
                    placeholder="Enter visual HTML content or text description..."
                    className="mt-1 w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. SPACER DIVIDER CONFIG */}
          {section.type === 'divider' && (
            <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800/40 space-y-4">
              <h4 className="font-bold text-neutral-700 dark:text-neutral-300">Divider Properties</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="font-semibold">Height spacing</Label>
                  <select 
                    className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3"
                    value={section.props.dividerHeight || "medium"}
                    onChange={(e) => updateProps({ dividerHeight: e.target.value })}
                  >
                    <option value="small">Small Spacer (20px)</option>
                    <option value="medium">Medium Spacer (45px)</option>
                    <option value="large">Large Spacer (80px)</option>
                  </select>
                </div>
                <div>
                  <Label className="font-semibold">Line style</Label>
                  <select 
                    className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3"
                    value={section.props.dividerStyle || "fuchsia-line"}
                    onChange={(e) => updateProps({ dividerStyle: e.target.value })}
                  >
                    <option value="none">No Visible Line (Spacer Only)</option>
                    <option value="solid">Thin Grey Line</option>
                    <option value="dashed">Dashed Grey Line</option>
                    <option value="fuchsia-line">Elegant Fuchsia Line</option>
                    <option value="gold-border">Luxury Gold Trim Bar</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. TESTIMONIALS CONFIG */}
          {section.type === 'testimonials' && (
            <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800/40 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-neutral-700 dark:text-neutral-300">Diner Reviews</h4>
                <Button size="sm" variant="outline" className="border-[#741052] text-[#741052] hover:bg-[#741052]/5" onClick={addTestimonial}>
                  <Plus className="mr-1 h-3 w-3" /> Add Review
                </Button>
              </div>

              <div className="space-y-4">
                {(section.props.testimonials || []).map((t, index) => (
                  <div key={t.id} className="p-3 border rounded-xl relative space-y-3 bg-neutral-50/50 dark:bg-neutral-900/40">
                    <button 
                      onClick={() => removeTestimonial(t.id)} 
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <Trash size={14} />
                    </button>
                    
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label>Reviewer Name</Label>
                        <Input 
                          value={t.name}
                          onChange={(e) => updateTestimonialItem(t.id, { name: e.target.value })}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label>Rating Stars</Label>
                        <select 
                          className="w-full mt-1 h-8 rounded-lg border bg-transparent px-2 text-xs"
                          value={t.rating}
                          onChange={(e) => updateTestimonialItem(t.id, { rating: parseInt(e.target.value) || 5 })}
                        >
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="3">3 Stars</option>
                        </select>
                      </div>
                      <div>
                        <Label>Avatar / Emoji Icon</Label>
                        <Input 
                          value={t.avatar || ""}
                          onChange={(e) => updateTestimonialItem(t.id, { avatar: e.target.value })}
                          className="h-8 text-xs mt-1"
                          placeholder="🍛 or custom text"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Diner Quote Comment</Label>
                      <textarea 
                        rows={2}
                        value={t.comment}
                        onChange={(e) => updateTestimonialItem(t.id, { comment: e.target.value })}
                        className="w-full mt-1 p-2 rounded-lg border bg-transparent text-xs"
                      />
                    </div>
                  </div>
                ))}
                {(section.props.testimonials || []).length === 0 && (
                  <p className="text-center text-neutral-400 py-2">No testimonials added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* 6 & 7. GRID & SLIDER PRODUCT SECTIONS */}
          {['grid', 'slider'].includes(section.type) && (
            <div className="border-t pt-4 border-neutral-100 dark:border-neutral-800/40 space-y-4">
              <h4 className="font-bold text-neutral-700 dark:text-neutral-300">Data Source & Layout Presets</h4>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="font-semibold">Source Type</Label>
                  <select 
                    className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200"
                    value={sourceType}
                    onChange={(e) => updateProps({ sourceType: e.target.value as any })}
                  >
                    <option value="category" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Category-driven</option>
                    <option value="manual" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Manual Selection</option>
                  </select>
                </div>

                <div>
                  <Label className="font-semibold">Item Type</Label>
                  <select 
                    className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200"
                    value={itemType}
                    onChange={(e) => updateProps({ itemType: e.target.value as any, categoryId: "" })}
                  >
                    <option value="menu" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Standard Menu Items</option>
                    <option value="platter" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Gourmet Platters</option>
                  </select>
                </div>

                {sourceType === 'category' && (
                  <div>
                    <Label className="font-semibold">Select Category</Label>
                    <select 
                      className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200"
                      value={section.props.categoryId || ""}
                      onChange={(e) => updateProps({ categoryId: e.target.value })}
                    >
                      <option value="" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Choose category...</option>
                      {itemType === 'platter' ? (
                        platterCategories.map(cat => (
                          <option key={cat._id} value={cat.name} className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">{cat.name}</option>
                        ))
                      ) : (
                        categories.map(cat => (
                          <option key={cat._id} value={cat.name} className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">{cat.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {section.type === 'grid' && (
                  <div>
                    <Label className="font-semibold">Grid Columns</Label>
                    <select 
                      className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200"
                      value={section.props.columns || 4}
                      onChange={(e) => updateProps({ columns: parseInt(e.target.value) || 4 })}
                    >
                      <option value="2" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">2 Columns (Compact Grid)</option>
                      <option value="3" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">3 Columns (Mid-Size)</option>
                      <option value="4" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">4 Columns (Standard)</option>
                    </select>
                  </div>
                )}

                <div>
                  <Label className="font-semibold">Card Visual Style</Label>
                  <select 
                    className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200"
                    value={section.props.cardStyle || "gourmet"}
                    onChange={(e) => updateProps({ cardStyle: e.target.value as any })}
                  >
                    <option value="gourmet" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Gourmet (Premium Large)</option>
                    <option value="compact" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Compact (Dense Grid)</option>
                    <option value="minimal" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Minimalist (List-like Card)</option>
                    <option value="list" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Full Row List View</option>
                  </select>
                </div>

                <div>
                  <Label className="font-semibold">Section Background Theme</Label>
                  <select 
                    className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200"
                    value={section.props.bgColor || "default"}
                    onChange={(e) => updateProps({ bgColor: e.target.value as any })}
                  >
                    <option value="default" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Default Page Background</option>
                    <option value="white" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Solid Pure White</option>
                    <option value="grey" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Subtle Light Grey</option>
                    <option value="light-fuchsia" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Soft Light Fuchsia Tint</option>
                    <option value="dark-fuchsia" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Luxury Dark Fuchsia (#741052)</option>
                  </select>
                </div>

                <div>
                  <Label className="font-semibold">Vertical Spacing (Padding)</Label>
                  <select 
                    className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-neutral-800 dark:text-neutral-200"
                    value={section.props.spacingY || "medium"}
                    onChange={(e) => updateProps({ spacingY: e.target.value as any })}
                  >
                    <option value="small" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Small Padding</option>
                    <option value="medium" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Medium Padding</option>
                    <option value="large" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Large Padding</option>
                  </select>
                </div>
              </div>

              {/* Manual Selection Search lists */}
              {sourceType === 'manual' && (
                <div className="space-y-2 mt-2">
                  <Label className="font-semibold">Select Products Manually</Label>
                  <div className="border dark:border-neutral-800 rounded-xl mt-1 overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/20">
                    <div className="p-2 border-b dark:border-neutral-800">
                      <Input 
                        placeholder="Filter items..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="max-h-[180px] overflow-y-auto p-2 space-y-1">
                      {filteredItems.slice(0, 40).map(item => {
                        const isSelected = section.props.itemIds?.includes(item._id);
                        return (
                          <div 
                            key={item._id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                              isSelected 
                                ? "bg-fuchsia-50 border border-fuchsia-200 text-[#741052] dark:bg-fuchsia-950/20 dark:border-fuchsia-900/60" 
                                : "hover:bg-neutral-100 dark:hover:bg-neutral-850"
                            }`}
                            onClick={() => toggleItemId(item._id)}
                          >
                            <span>{item.title}</span>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#741052] dark:bg-fuchsia-400" />}
                          </div>
                        )
                      })}
                      {filteredItems.length === 0 && (
                        <p className="text-center text-neutral-400 p-2 text-xs">No items found.</p>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    {section.props.itemIds?.length || 0} products selected manually
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main Layout Builder View ---
export default function AdminPageBuilder() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [platterCategories, setPlatterCategories] = useState<PlatterCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [useCmsLayout, setUseCmsLayout] = useState(true);
  const [classicUploadingPc, setClassicUploadingPc] = useState(false);
  const [classicUploadingMobile, setClassicUploadingMobile] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configRes, menuRes, platterRes, categoriesRes, platterCatsRes] = await Promise.all([
        fetch("/api/page-config").then(r => r.json()),
        fetch("/api/getitemsadmin").then(r => r.json()),
        fetch("/api/platteradmin").then(r => r.json()),
        fetch("/api/categories").then(r => r.json()),
        fetch("/api/platter-categories").then(r => r.json())
      ]);
      
      setCategories(categoriesRes || []);
      setPlatterCategories(platterCatsRes || []);
      
      const combinedItems = [
        ...(menuRes || []),
        ...(platterRes || [])
      ].map((i: any) => ({ _id: i._id, title: i.title }));
      
      setItems(combinedItems);
      
      if (configRes) {
        if (configRes.sections) {
          setSections(configRes.sections);
        }
        if (configRes.useCmsLayout !== undefined) {
          setUseCmsLayout(configRes.useCmsLayout);
        }
      }
    } catch (e) {
      console.error("Failed to load page builder resources:", e);
      toast.error("Resource fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const addSection = (preset: typeof SECTION_PRESETS[0]) => {
    const defaultCategoryId = preset.type === 'slider' || preset.type === 'grid'
      ? (categories.length > 0 ? categories[0].name : "")
      : "";

    const newSection: PageSection = {
      id: uuidv4(),
      type: preset.type as any,
      title: preset.label,
      isVisible: true,
      props: {
        ...(preset.defaultProps as any),
        categoryId: defaultCategoryId,
        itemIds: []
      }
    };
    setSections([...sections, newSection]);
    toast.success(`${preset.label} section added to end of page layout`);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
    toast.success("Section removed from layout template");
  };

  const updateSection = (id: string, updates: Partial<PageSection>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleClassicUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'backgroundImage' | 'mobileBackgroundImage', heroId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (field === 'backgroundImage') setClassicUploadingPc(true);
    else setClassicUploadingMobile(true);
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(file);
      const base64String = await base64Promise;
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64String }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await res.json();
      setSections(prev => prev.map(s => s.id === heroId ? { ...s, props: { ...s.props, [field]: data.url } } : s));
      toast.success(`${field === 'backgroundImage' ? 'PC' : 'Mobile'} banner uploaded!`);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      if (field === 'backgroundImage') setClassicUploadingPc(false);
      else setClassicUploadingMobile(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/page-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections, useCmsLayout })
      });
      if (response.ok) {
        toast.success("Order page layout configuration updated successfully.");
      } else {
        toast.error("Failed to save layout.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#741052] border-t-transparent"></div>
          <p className="text-sm font-semibold text-neutral-500">Loading Order Page Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] h-[calc(100vh-170px)]">
      {/* Sidebar Tool selection */}
      <div className="flex flex-col gap-4 h-full shrink-0">
        <Card className="rounded-3xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/40 border-b pb-3 shrink-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#741052] dark:text-fuchsia-300">Layout Sections</CardTitle>
            <CardDescription className="text-[10px]">Click any section below to append it to your ordering page layout.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 overflow-y-auto flex-1 min-h-0">
            {SECTION_PRESETS.map(preset => (
              <div 
                key={preset.type} 
                className="p-3 border border-neutral-100 dark:border-neutral-800 rounded-2xl hover:bg-fuchsia-50/20 dark:hover:bg-neutral-800/40 hover:border-[#741052]/30 dark:hover:border-fuchsia-500/20 cursor-pointer transition-all duration-200" 
                onClick={() => addSection(preset)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm">{preset.label}</span>
                  <Plus size={14} className="text-[#741052] dark:text-fuchsia-400" />
                </div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 leading-relaxed">{preset.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <div className="shrink-0 mt-auto">
          <Button 
            size="lg" 
            className="w-full bg-[#741052] hover:bg-[#590b3e] text-white rounded-2xl font-bold uppercase tracking-wider text-xs h-12 shadow-md shadow-fuchsia-900/10" 
            onClick={saveConfig} 
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving Changes..." : "Save Layout Settings"}
          </Button>
        </div>
      </div>

      {/* Reordering canvas */}
      <Card className="flex flex-col border border-neutral-200/50 dark:border-neutral-800 shadow-sm rounded-3xl overflow-hidden bg-neutral-50/20 dark:bg-neutral-900/10">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-neutral-800 dark:text-white">Active Order Page Layout</h3>
            <p className="text-[10px] text-neutral-400">Rearrange visual blocks or click expand to change items and settings.</p>
          </div>
          <div className="flex items-center gap-3 sm:border-l sm:border-neutral-200 sm:dark:border-neutral-800 sm:pl-4">
            <div className="flex flex-col text-right">
              <Label htmlFor="cms-layout-mode" className="font-bold text-xs cursor-pointer text-[#741052] dark:text-fuchsia-400">
                {useCmsLayout ? "Advanced CMS Layout Mode" : "Classic Normal Layout Mode"}
              </Label>
              <span className="text-[9px] text-neutral-400">
                {useCmsLayout ? "Live customization builder active" : "Classic side-by-side categories live"}
              </span>
            </div>
            <Switch 
              id="cms-layout-mode"
              checked={useCmsLayout}
              onCheckedChange={(val: boolean) => {
                setUseCmsLayout(val);
                toast.info(val ? "Switched to Advanced CMS Layout Builder" : "Switched to Classic Normal Layout (categories list)");
              }}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={sections.map(s => s.id)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="max-w-2xl mx-auto pb-20">
                {!useCmsLayout && (
                  <div className="space-y-6 mb-6">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex flex-col gap-1.5 shadow-sm">
                      <span className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                        ⚠️ Classic Normal Layout is Active
                      </span>
                      <p className="leading-relaxed">
                        The dynamic CMS sections built below are currently bypassed. Customers visiting the <span className="font-semibold">/order</span> page will see the original menu layout (grouped side-by-side categories list with standard infinite scroll). To activate this custom CMS design, toggle <strong>Advanced CMS Layout Mode</strong> above and click save.
                      </p>
                    </div>

                    {/* Classic Mode Header Banner Editor */}
                    <Card className="rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden bg-white dark:bg-neutral-950">
                      <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/40 border-b pb-3">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#741052] dark:text-fuchsia-300 flex items-center gap-2">
                          <ImageIcon size={16} />
                          Classic Mode Header Banner
                        </CardTitle>
                        <CardDescription className="text-[11px]">Configure the header title, subtitle, and responsive background banners shown to users in Classic layout mode.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        {sections.some(s => s.type === 'hero') ? (
                          (() => {
                            const heroSec = sections.find(s => s.type === 'hero')!;
                            const updateHeroProps = (propUpdates: any) => {
                              updateSection(heroSec.id, { props: { ...heroSec.props, ...propUpdates } });
                            };
                            
                            return (
                              <div className="space-y-4">
                                {/* Layout & Sizing Controls */}
                                <div className="grid gap-4 sm:grid-cols-3">
                                  <div>
                                    <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Display Mode</Label>
                                    <select 
                                      className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-xs text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900"
                                      value={heroSec.props.displayMode || "overlay"}
                                      onChange={(e) => updateHeroProps({ displayMode: e.target.value })}
                                    >
                                      <option value="overlay" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Overlay text on image</option>
                                      <option value="direct" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Direct raw banner image</option>
                                    </select>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Banner Size (Height)</Label>
                                    <select 
                                      className="w-full mt-1 h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 text-xs text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900"
                                      value={heroSec.props.bannerSize || "large"}
                                      onChange={(e) => updateHeroProps({ bannerSize: e.target.value })}
                                    >
                                      <option value="small" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Small Height (Compact)</option>
                                      <option value="medium" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Medium Height</option>
                                      <option value="large" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Large Height (Default)</option>
                                      <option value="freesize" className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">Free Size (Full natural size)</option>
                                    </select>
                                  </div>
                                  {(heroSec.props.displayMode || "overlay") === "overlay" && (
                                    <div className="flex flex-col justify-end pb-1.5">
                                      <div className="flex items-center gap-2">
                                        <Switch 
                                          id={`classic-show-text-${heroSec.id}`}
                                          checked={heroSec.props.showText !== false}
                                          onCheckedChange={(val: boolean) => updateHeroProps({ showText: val })}
                                        />
                                        <Label htmlFor={`classic-show-text-${heroSec.id}`} className="text-xs font-semibold cursor-pointer">Show Banner Text</Label>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {(heroSec.props.displayMode || "overlay") === "overlay" && heroSec.props.showText !== false && (
                                  <div className="grid gap-4 sm:grid-cols-2 border-t border-neutral-100 dark:border-neutral-800/40 pt-3">
                                    <div>
                                      <Label className="text-xs font-semibold text-neutral-650 dark:text-neutral-400">Banner Title</Label>
                                      <Input 
                                        value={heroSec.title || ""}
                                        onChange={(e) => updateSection(heroSec.id, { title: e.target.value })}
                                        placeholder="Little Karachi Express"
                                        className="mt-1 h-9 rounded-lg text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-semibold text-neutral-650 dark:text-neutral-400">Banner Subtitle</Label>
                                      <Input 
                                        value={heroSec.props.subtitle || ""}
                                        onChange={(e) => updateHeroProps({ subtitle: e.target.value })}
                                        placeholder="Authentic Pakistani & Karachi Cuisines"
                                        className="mt-1 h-9 rounded-lg text-xs"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="grid gap-6 md:grid-cols-2 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10">
                                  {/* PC Upload */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs font-semibold">Desktop / PC Banner</Label>
                                      {heroSec.props.backgroundImage && (
                                        <button 
                                          onClick={() => updateHeroProps({ backgroundImage: "" })}
                                          className="text-[10px] text-red-500 hover:text-red-750 flex items-center gap-0.5 font-medium"
                                        >
                                          <X size={10} /> Clear
                                        </button>
                                      )}
                                    </div>
                                    {heroSec.props.backgroundImage ? (
                                      <div className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 aspect-[21/9] bg-neutral-100 dark:bg-neutral-900">
                                        <img src={heroSec.props.backgroundImage} className="w-full h-full object-cover" alt="PC Banner" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center border border-dashed rounded-lg aspect-[21/9] text-neutral-400 bg-white dark:bg-neutral-950 text-xs">
                                        No Desktop Banner
                                      </div>
                                    )}
                                    <div className="flex gap-2">
                                      <Input 
                                        value={heroSec.props.backgroundImage || ""}
                                        onChange={(e) => updateHeroProps({ backgroundImage: e.target.value })}
                                        placeholder="URL or file upload"
                                        className="h-8 rounded-lg flex-1 text-xs"
                                      />
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="classic-pc-file" 
                                        className="hidden" 
                                        onChange={(e) => handleClassicUpload(e, 'backgroundImage', heroSec.id)} 
                                      />
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 text-xs font-semibold"
                                        disabled={classicUploadingPc}
                                        onClick={() => document.getElementById('classic-pc-file')?.click()}
                                      >
                                        {classicUploadingPc ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Mobile Upload */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs font-semibold">Mobile Banner</Label>
                                      {heroSec.props.mobileBackgroundImage && (
                                        <button 
                                          onClick={() => updateHeroProps({ mobileBackgroundImage: "" })}
                                          className="text-[10px] text-red-500 hover:text-red-750 flex items-center gap-0.5 font-medium"
                                        >
                                          <X size={10} /> Clear
                                        </button>
                                      )}
                                    </div>
                                    {heroSec.props.mobileBackgroundImage ? (
                                      <div className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 aspect-[9/16] w-16 mx-auto bg-neutral-100 dark:bg-neutral-900">
                                        <img src={heroSec.props.mobileBackgroundImage} className="w-full h-full object-cover" alt="Mobile Banner" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center border border-dashed rounded-lg aspect-[9/16] w-16 mx-auto text-neutral-400 bg-white dark:bg-neutral-950 text-[10px]">
                                        No Mobile Banner
                                      </div>
                                    )}
                                    <div className="flex gap-2">
                                      <Input 
                                        value={heroSec.props.mobileBackgroundImage || ""}
                                        onChange={(e) => updateHeroProps({ mobileBackgroundImage: e.target.value })}
                                        placeholder="URL or file upload"
                                        className="h-8 rounded-lg flex-1 text-xs"
                                      />
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="classic-mobile-file" 
                                        className="hidden" 
                                        onChange={(e) => handleClassicUpload(e, 'mobileBackgroundImage', heroSec.id)} 
                                      />
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 text-xs font-semibold"
                                        disabled={classicUploadingMobile}
                                        onClick={() => document.getElementById('classic-mobile-file')?.click()}
                                      >
                                        {classicUploadingMobile ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-xs text-neutral-400 mb-3">No header banner is configured for the Classic layout. Create one to customize titles and images.</p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-[#741052] text-[#741052] hover:bg-[#741052]/5 text-xs font-semibold"
                              onClick={() => {
                                const newSec: PageSection = {
                                  id: uuidv4(),
                                  type: 'hero',
                                  title: 'Little Karachi Express',
                                  isVisible: true,
                                  props: {
                                    subtitle: "Authentic Pakistani & Karachi Cuisines",
                                    backgroundImage: "/bg-hero.webp",
                                    mobileBackgroundImage: "/bg-hero.webp",
                                    overlayOpacity: 0.4,
                                    ctaText: "Order Now",
                                    ctaAction: "scroll",
                                    ctaLink: "",
                                    align: "center",
                                    textColor: "white"
                                  }
                                };
                                setSections([newSec, ...sections]);
                                toast.success("Classic Mode Header Banner created!");
                              }}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" /> Initialize Header Banner
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
                {sections.map((section, index) => (
                  <SortableSection 
                    key={section.id} 
                    section={section} 
                    index={index}
                    updateSection={updateSection}
                    removeSection={removeSection}
                    items={items}
                    categories={categories}
                    platterCategories={platterCategories}
                  />
                ))}
                {sections.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 bg-white dark:bg-neutral-900/50">
                    <Compass className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mb-2.5" />
                    <p className="font-bold text-neutral-600 dark:text-neutral-400">Empty Page Layout</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm">No visual sections added yet. Click items in the left panel to begin designing your customer menu layout.</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </Card>
    </div>
  );
}
