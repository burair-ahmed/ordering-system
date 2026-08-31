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
  Loader2,
  Laptop,
  Smartphone
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

// --- Select Input and Section Themes Helper ---
const SelectInput = ({ value, onChange, children, className = "" }: {
  value: any;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        className={`w-full h-9 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#741052]/20 focus:border-[#741052] dark:focus:ring-fuchsia-500/20 dark:focus:border-fuchsia-500 cursor-pointer appearance-none pr-8 transition-all ${className}`}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-neutral-400 dark:text-neutral-500">
        <ChevronDown size={14} />
      </div>
    </div>
  );
};

const getSectionTheme = (type: string) => {
  switch (type) {
    case 'hero': return { border: 'border-l-4 border-pink-500', bg: 'bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400', label: 'Hero Banner' };
    case 'banner': return { border: 'border-l-4 border-fuchsia-500', bg: 'bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400', label: 'Promo Banner' };
    case 'rich-content': return { border: 'border-l-4 border-indigo-500', bg: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400', label: 'Story Row' };
    case 'testimonials': return { border: 'border-l-4 border-amber-500', bg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400', label: 'Reviews' };
    case 'divider': return { border: 'border-l-4 border-slate-400', bg: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400', label: 'Spacer Divider' };
    case 'slider': return { border: 'border-l-4 border-violet-500', bg: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400', label: 'Category Slider' };
    case 'grid': return { border: 'border-l-4 border-purple-500', bg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400', label: 'Product Grid' };
    default: return { border: 'border-l-4 border-neutral-400', bg: 'bg-neutral-500/10 text-neutral-600 dark:bg-neutral-500/20 dark:text-neutral-400', label: 'Section' };
  }
};

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

  // Top-level tab states to satisfy React Hook rules
  const [heroTab, setHeroTab] = useState<'images' | 'text' | 'cta'>('images');
  const [gridTab, setGridTab] = useState<'source' | 'layout' | 'theme'>('source');
  const [bannerTab, setBannerTab] = useState<'design' | 'timer'>('design');

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'backgroundImage' | 'mobileBackgroundImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'backgroundImage') {
      setUploadingPc(true);
    } else {
      setUploadingMobile(true);
    }

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(file);
      const base64String = await base64Promise;

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

  const theme = getSectionTheme(section.type);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl shadow-sm mb-4 overflow-hidden transition-all duration-200 hover:shadow-md ${theme.border}`}
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
            <Badge variant="secondary" className={`text-[10px] sm:text-xs uppercase border border-[#741052]/10 ${theme.bg}`}>
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
            className={`h-8 w-8 rounded-lg ${section.isVisible ? 'text-neutral-650 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-600'}`}
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
          
          {/* 1. HERO SECTION CONFIG */}
          {section.type === 'hero' && (
            <div className="space-y-4">
              {/* Tab selector */}
              <div className="flex border-b border-neutral-200 dark:border-neutral-800 pb-px gap-1">
                {(['images', 'text', 'cta'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setHeroTab(tab)}
                    className={`px-3 py-2 text-xs font-bold capitalize transition-all duration-250 border-b-2 -mb-px ${
                      heroTab === tab 
                        ? 'border-[#741052] text-[#741052] dark:border-fuchsia-500 dark:text-fuchsia-400' 
                        : 'border-transparent text-neutral-400 hover:text-neutral-650 dark:hover:text-neutral-355'
                    }`}
                  >
                    {tab === 'images' ? 'Banner Images' : tab === 'text' ? 'Overlay Text & Styles' : 'Call to Action (CTA)'}
                  </button>
                ))}
              </div>

              {/* HERO Tab 1: Images */}
              {heroTab === 'images' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Display Mode</Label>
                      <SelectInput 
                        value={section.props.displayMode || "overlay"}
                        onChange={(e) => updateProps({ displayMode: e.target.value })}
                      >
                        <option value="overlay">Overlay text on image</option>
                        <option value="direct">Direct raw banner image</option>
                      </SelectInput>
                    </div>
                    <div>
                      <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Banner Size (Height)</Label>
                      <SelectInput 
                        value={section.props.bannerSize || "large"}
                        onChange={(e) => updateProps({ bannerSize: e.target.value })}
                      >
                        <option value="small">Small Height (Compact)</option>
                        <option value="medium">Medium Height</option>
                        <option value="large">Large Height (Default)</option>
                        <option value="freesize">Free Size (Full natural size)</option>
                      </SelectInput>
                    </div>
                  </div>

                  {/* Device mockups uploader rows */}
                  <div className="grid gap-6 md:grid-cols-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
                    {/* PC Banner Frame */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                          <Laptop size={14} className="text-neutral-400" /> Desktop / PC Banner
                        </Label>
                        {section.props.backgroundImage && (
                          <button 
                            onClick={() => updateProps({ backgroundImage: "" })}
                            className="text-[10px] text-red-500 hover:text-red-750 font-semibold flex items-center gap-0.5"
                          >
                            <X size={12} /> Clear
                          </button>
                        )}
                      </div>

                      {/* PC Browser Mockup Frame */}
                      <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm bg-neutral-100 dark:bg-neutral-950">
                        {/* Browser Header Bar */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                          </div>
                          <div className="flex-1 flex justify-center">
                            <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-md text-[9px] text-neutral-400 dark:text-neutral-500 px-4 py-0.5 truncate max-w-[140px] w-full text-center font-mono">
                              clk.com/order
                            </div>
                          </div>
                        </div>
                        {/* Preview Screen */}
                        <div className="relative aspect-[21/9] bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                          {section.props.backgroundImage ? (
                            <img 
                              src={section.props.backgroundImage} 
                              alt="PC Banner Preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <ImageIcon className="mx-auto h-7 w-7 mb-1.5 text-neutral-300 dark:text-neutral-700" />
                              <span className="text-[10px] text-neutral-400 block">No Desktop Banner</span>
                            </div>
                          )}
                          {uploadingPc && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin text-[#741052] dark:text-fuchsia-400" />
                              <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">Uploading...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Input 
                          value={section.props.backgroundImage || ""} 
                          onChange={(e) => updateProps({ backgroundImage: e.target.value })}
                          placeholder="Image URL or upload file"
                          className="h-8 rounded-lg flex-1 text-xs"
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
                            className="h-8 rounded-lg font-semibold flex items-center gap-1 text-xs px-2.5"
                          >
                            <Upload className="h-3 w-3" />
                            <span>Upload</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Banner Frame */}
                    <div className="space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                            <Smartphone size={14} className="text-neutral-400" /> Mobile Banner
                          </Label>
                          {section.props.mobileBackgroundImage && (
                            <button 
                              onClick={() => updateProps({ mobileBackgroundImage: "" })}
                              className="text-[10px] text-red-500 hover:text-red-750 font-semibold flex items-center gap-0.5"
                            >
                              <X size={12} /> Clear
                            </button>
                          )}
                        </div>

                        {/* Phone Mockup Frame */}
                        <div className="relative mx-auto w-24 border-[4px] border-neutral-800 dark:border-neutral-700 rounded-[1.5rem] overflow-hidden shadow-sm bg-neutral-100 dark:bg-neutral-950 aspect-[9/16]">
                          {/* Notch */}
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-neutral-800 dark:bg-neutral-700 rounded-full z-10" />
                          
                          {/* Screen Area */}
                          <div className="relative w-full h-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                            {section.props.mobileBackgroundImage ? (
                              <img 
                                src={section.props.mobileBackgroundImage} 
                                alt="Mobile Banner Preview" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-2">
                                <ImageIcon className="mx-auto h-5 w-5 mb-1 text-neutral-300 dark:text-neutral-700" />
                                <span className="text-[9px] leading-tight text-neutral-400 block">No Mobile Banner</span>
                              </div>
                            )}
                            {uploadingMobile && (
                              <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-[#741052] dark:text-fuchsia-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Input 
                          value={section.props.mobileBackgroundImage || ""} 
                          onChange={(e) => updateProps({ mobileBackgroundImage: e.target.value })}
                          placeholder="Image URL or upload file"
                          className="h-8 rounded-lg flex-1 text-xs"
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
                            className="h-8 rounded-lg font-semibold flex items-center gap-1 text-xs px-2.5"
                          >
                            <Upload className="h-3 w-3" />
                            <span>Upload</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HERO Tab 2: Text & Styles */}
              {heroTab === 'text' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-3 p-3 bg-neutral-50/50 dark:bg-neutral-900/40 rounded-xl border border-neutral-100 dark:border-neutral-800">
                    <Switch 
                      id={`show-text-${section.id}`}
                      checked={section.props.showText !== false}
                      onCheckedChange={(val: boolean) => updateProps({ showText: val })}
                    />
                    <Label htmlFor={`show-text-${section.id}`} className="font-bold cursor-pointer text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
                      Enable Banner Text Overlay
                    </Label>
                  </div>

                  {(section.props.showText !== false) ? (
                    <div className="grid gap-4 sm:grid-cols-2 border-t dark:border-neutral-800 pt-4">
                      <div>
                        <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Display Section Title</Label>
                        <Input 
                          value={section.title} 
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          placeholder="e.g. Delicious Platters or Feast Deals"
                          className="mt-1 h-9 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Subtitle Text</Label>
                        <Input 
                          value={section.props.subtitle || ""} 
                          onChange={(e) => updateProps({ subtitle: e.target.value })}
                          placeholder="Authentic Pakistani Cuisines & BBQ"
                          className="mt-1 h-9 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Overlay Opacity (0 to 1)</Label>
                        <Input 
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={section.props.overlayOpacity ?? 0.4} 
                          onChange={(e) => updateProps({ overlayOpacity: parseFloat(e.target.value) || 0 })}
                          className="mt-1 h-9 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Text Alignment</Label>
                        <SelectInput 
                          value={section.props.align || "center"}
                          onChange={(e) => updateProps({ align: e.target.value })}
                        >
                          <option value="left">Left Align</option>
                          <option value="center">Center Align</option>
                          <option value="right">Right Align</option>
                        </SelectInput>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Text Theme Color Palette</Label>
                        <SelectInput 
                          value={section.props.textColor || "white"}
                          onChange={(e) => updateProps({ textColor: e.target.value })}
                        >
                          <option value="white">White Theme (Good for dark banners)</option>
                          <option value="black">Black Theme (Good for light/white banners)</option>
                          <option value="fuchsia">Fuchsia Pink Theme (Brand aesthetic)</option>
                        </SelectInput>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-xl text-neutral-400 text-xs">
                      Text display has been disabled. Banners will be visual only.
                    </div>
                  )}
                </div>
              )}

              {/* HERO Tab 3: Call to Action */}
              {heroTab === 'cta' && (
                <div className="space-y-4 border-t dark:border-neutral-800 pt-4 animate-fadeIn">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Button Text (CTA)</Label>
                      <Input 
                        value={section.props.ctaText || ""} 
                        onChange={(e) => updateProps({ ctaText: e.target.value })}
                        placeholder="Order Now"
                        className="mt-1 h-9 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Button Action</Label>
                      <SelectInput 
                        value={section.props.ctaAction || "scroll"}
                        onChange={(e) => updateProps({ ctaAction: e.target.value })}
                      >
                        <option value="scroll">Scroll smoothly to menu list</option>
                        <option value="link">Redirect to external URL link</option>
                      </SelectInput>
                    </div>
                    {section.props.ctaAction === 'link' && (
                      <div className="sm:col-span-2">
                        <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Custom Redirect Link URL</Label>
                        <Input 
                          value={section.props.ctaLink || ""} 
                          onChange={(e) => updateProps({ ctaLink: e.target.value })}
                          placeholder="https://facebook.com/littlekarachi or custom path"
                          className="mt-1 h-9 rounded-lg text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. PROMO BANNER CONFIG */}
          {section.type === 'banner' && (
            <div className="space-y-4">
              <div className="flex border-b border-neutral-200 dark:border-neutral-800 pb-px gap-1">
                {(['design', 'timer'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setBannerTab(tab)}
                    className={`px-3 py-2 text-xs font-bold capitalize transition-all duration-250 border-b-2 -mb-px ${
                      bannerTab === tab 
                        ? 'border-[#741052] text-[#741052] dark:border-fuchsia-500 dark:text-fuchsia-400' 
                        : 'border-transparent text-neutral-400 hover:text-neutral-650 dark:hover:text-neutral-355'
                    }`}
                  >
                    {tab === 'design' ? 'Banner Design' : 'Timer & CTA Action'}
                  </button>
                ))}
              </div>

              {bannerTab === 'design' && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2 animate-fadeIn">
                  <div className="sm:col-span-2">
                    <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Display Section Title (Promo Headline)</Label>
                    <Input 
                      value={section.title} 
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      placeholder="e.g. Eid Deals - 20% Off!"
                      className="mt-1 h-9 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Banner Background Theme (Hex Color or CSS Gradient)</Label>
                    <Input 
                      value={section.props.bannerBg || ""} 
                      onChange={(e) => updateProps({ bannerBg: e.target.value })}
                      placeholder="linear-gradient(135deg, #741052 0%, #d0269b 100%)"
                      className="mt-1 h-9 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Text Hex Color</Label>
                    <Input 
                      value={section.props.bannerTextColor || "#ffffff"} 
                      onChange={(e) => updateProps({ bannerTextColor: e.target.value })}
                      placeholder="#ffffff"
                      className="mt-1 h-9 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {bannerTab === 'timer' && (
                <div className="space-y-4 pt-2 animate-fadeIn">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="font-semibold text-neutral-600 dark:text-neutral-400">CTA Button Text</Label>
                      <Input 
                        value={section.props.ctaText || ""} 
                        onChange={(e) => updateProps({ ctaText: e.target.value })}
                        placeholder="Claim Deal"
                        className="mt-1 h-9 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Button URL Path</Label>
                      <Input 
                        value={section.props.ctaLink || ""} 
                        onChange={(e) => updateProps({ ctaLink: e.target.value })}
                        placeholder="/order#specials"
                        className="mt-1 h-9 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-neutral-50/50 dark:bg-neutral-900/40 rounded-xl border border-neutral-100 dark:border-neutral-800">
                    <Switch 
                      id={`countdown-${section.id}`}
                      checked={section.props.hasCountdown || false}
                      onCheckedChange={(val: boolean) => updateProps({ hasCountdown: val })}
                    />
                    <Label htmlFor={`countdown-${section.id}`} className="font-bold cursor-pointer text-xs text-neutral-800 dark:text-neutral-200">
                      Enable Limited-Time Countdown Expiration Timer
                    </Label>
                  </div>

                  {section.props.hasCountdown && (
                    <div className="p-3 border rounded-xl bg-amber-500/[0.03] border-amber-500/20 animate-fadeIn">
                      <Label className="font-semibold text-amber-700 dark:text-amber-300">Countdown Expiration Date & Time</Label>
                      <Input 
                        type="datetime-local"
                        value={section.props.countdownEnd || ""}
                        onChange={(e) => updateProps({ countdownEnd: e.target.value })}
                        className="mt-1 h-9 rounded-lg w-fit text-xs"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. RICH CONTENT CONFIG */}
          {section.type === 'rich-content' && (
            <div className="space-y-4">
              <h4 className="font-bold text-neutral-700 dark:text-neutral-300">Rich Description & Media</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Display Section Title</Label>
                  <Input 
                    value={section.title} 
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    placeholder="e.g. Our Culinary Journey"
                    className="mt-1 h-9 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Image Asset Path / URL</Label>
                  <Input 
                    value={section.props.image || ""} 
                    onChange={(e) => updateProps({ image: e.target.value })}
                    placeholder="/cafe-banner.webp"
                    className="mt-1 h-9 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Media/Image Alignment</Label>
                  <SelectInput 
                    value={section.props.mediaAlign || "right"}
                    onChange={(e) => updateProps({ mediaAlign: e.target.value })}
                  >
                    <option value="left">Image Left / Text Right</option>
                    <option value="right">Image Right / Text Left</option>
                  </SelectInput>
                </div>
                <div>
                  <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Background Theme Style</Label>
                  <SelectInput 
                    value={section.props.bgColor || "default"}
                    onChange={(e) => updateProps({ bgColor: e.target.value })}
                  >
                    <option value="default">Default Transparent</option>
                    <option value="white">Solid Card White</option>
                    <option value="light-fuchsia">Soft Light Fuchsia Brand</option>
                    <option value="dark-fuchsia">Luxury Dark Fuchsia (#741052)</option>
                  </SelectInput>
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Section Description / Article Content</Label>
                  <textarea 
                    rows={4}
                    value={section.props.description || ""} 
                    onChange={(e) => updateProps({ description: e.target.value })}
                    placeholder="Enter visual HTML content or text description..."
                    className="mt-1 w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-[#741052]/20 focus:border-[#741052] dark:focus:ring-fuchsia-500/20 dark:focus:border-fuchsia-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. SPACER DIVIDER CONFIG */}
          {section.type === 'divider' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Display Section Title (Internal Only)</Label>
                  <Input 
                    value={section.title} 
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    placeholder="Spacer Divider"
                    className="mt-1 h-9 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Height Spacing</Label>
                  <SelectInput 
                    value={section.props.dividerHeight || "medium"}
                    onChange={(e) => updateProps({ dividerHeight: e.target.value })}
                  >
                    <option value="small">Small Spacer (20px)</option>
                    <option value="medium">Medium Spacer (45px)</option>
                    <option value="large">Large Spacer (80px)</option>
                  </SelectInput>
                </div>
                <div className="sm:col-span-2">
                  <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Visual Line Style</Label>
                  <SelectInput 
                    value={section.props.dividerStyle || "fuchsia-line"}
                    onChange={(e) => updateProps({ dividerStyle: e.target.value })}
                  >
                    <option value="none">No Visible Line (Blank Spacer Padding)</option>
                    <option value="solid">Thin Grey Border Line</option>
                    <option value="dashed">Dashed Grey Divider Line</option>
                    <option value="fuchsia-line">Elegant Fuchsia Brand Line</option>
                    <option value="gold-border">Luxury Gold Trim Bar</option>
                  </SelectInput>
                </div>
              </div>
            </div>
          )}

          {/* 5. TESTIMONIALS CONFIG */}
          {section.type === 'testimonials' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Display Title</Label>
                  <Input 
                    value={section.title} 
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    placeholder="Guest Reviews"
                    className="mt-1 h-8 text-xs rounded-lg"
                  />
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-[#741052] text-[#741052] hover:bg-[#741052]/5 dark:border-fuchsia-500 dark:text-fuchsia-400 transition-colors h-8 font-bold" 
                  onClick={addTestimonial}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Review
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {(section.props.testimonials || []).map((t) => (
                  <div key={t.id} className="p-4 border dark:border-neutral-800/80 rounded-2xl relative space-y-3 bg-neutral-50/50 dark:bg-neutral-900/40 hover:shadow-sm transition-all duration-200">
                    <button 
                      onClick={() => removeTestimonial(t.id)} 
                      className="absolute top-3 right-3 text-neutral-400 hover:text-red-500 transition-colors"
                      title="Remove review"
                    >
                      <Trash size={14} />
                    </button>
                    
                    <div className="space-y-2.5">
                      <div>
                        <Label className="text-[11px] font-semibold text-neutral-500">Reviewer Name</Label>
                        <Input 
                          value={t.name}
                          onChange={(e) => updateTestimonialItem(t.id, { name: e.target.value })}
                          className="h-8 text-xs mt-0.5 rounded-lg"
                        />
                      </div>
                      
                      {/* Interactive click stars rating */}
                      <div>
                        <Label className="text-[11px] font-semibold text-neutral-500 block">Diner Rating</Label>
                        <div className="flex items-center gap-1 mt-1 bg-white dark:bg-neutral-950 border dark:border-neutral-800 rounded-lg px-2.5 h-8 w-fit select-none shadow-sm">
                          {[1, 2, 3, 4, 5].map((starNum) => (
                            <button
                              key={starNum}
                              type="button"
                              onClick={() => updateTestimonialItem(t.id, { rating: starNum })}
                              className="text-neutral-300 hover:text-amber-400 dark:text-neutral-700 dark:hover:text-amber-500 transition-colors"
                            >
                              <Star 
                                size={14} 
                                className={`${
                                  starNum <= t.rating 
                                    ? 'fill-amber-400 text-amber-400 dark:fill-amber-500 dark:text-amber-500' 
                                    : 'text-neutral-300 dark:text-neutral-700'
                                }`} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-[11px] font-semibold text-neutral-500">Avatar / Emoji Icon</Label>
                        <Input 
                          value={t.avatar || ""}
                          onChange={(e) => updateTestimonialItem(t.id, { avatar: e.target.value })}
                          className="h-8 text-xs mt-0.5 rounded-lg"
                          placeholder="🍛 or 🔥"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-neutral-500">Diner Quote / Comment</Label>
                      <textarea 
                        rows={2}
                        value={t.comment}
                        onChange={(e) => updateTestimonialItem(t.id, { comment: e.target.value })}
                        className="w-full mt-0.5 p-2 rounded-lg border bg-white dark:bg-neutral-950 dark:border-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#741052]/20 focus:border-[#741052] dark:focus:ring-fuchsia-500/20 dark:focus:border-fuchsia-500 transition-all"
                      />
                    </div>
                  </div>
                ))}
                {(section.props.testimonials || []).length === 0 && (
                  <p className="col-span-2 text-center text-neutral-400 py-6 border border-dashed rounded-2xl bg-neutral-50/20 dark:bg-neutral-900/10">No diner reviews added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* 6 & 7. GRID & SLIDER PRODUCT SECTIONS */}
          {['grid', 'slider'].includes(section.type) && (
            <div className="space-y-4">
              <div className="flex border-b border-neutral-200 dark:border-neutral-800 pb-px gap-1">
                {(['source', 'layout', 'theme'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setGridTab(tab)}
                    className={`px-3 py-2 text-xs font-bold capitalize transition-all duration-250 border-b-2 -mb-px ${
                      gridTab === tab 
                        ? 'border-[#741052] text-[#741052] dark:border-fuchsia-500 dark:text-fuchsia-400' 
                        : 'border-transparent text-neutral-400 hover:text-neutral-650 dark:hover:text-neutral-355'
                    }`}
                  >
                    {tab === 'source' ? 'Data Source' : tab === 'layout' ? 'Visual Layout' : 'Theme Style'}
                  </button>
                ))}
              </div>

              {/* GRID Tab 1: Source */}
              {gridTab === 'source' && (
                <div className="space-y-4 pt-2 animate-fadeIn">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Display Section Title</Label>
                      <Input 
                        value={section.title} 
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder="e.g. Spicy Curries or Breads"
                        className="mt-1 h-9 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Source Type</Label>
                      <SelectInput 
                        value={sourceType}
                        onChange={(e) => updateProps({ sourceType: e.target.value as any })}
                      >
                        <option value="category">Category-driven</option>
                        <option value="manual">Manual Selection</option>
                      </SelectInput>
                    </div>

                    <div>
                      <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Item Type</Label>
                      <SelectInput 
                        value={itemType}
                        onChange={(e) => updateProps({ itemType: e.target.value as any, categoryId: "" })}
                      >
                        <option value="menu">Standard Menu Items</option>
                        <option value="platter">Gourmet Platters</option>
                      </SelectInput>
                    </div>

                    {sourceType === 'category' && (
                      <div>
                        <Label className="font-semibold text-neutral-650 dark:text-neutral-400">Select Category</Label>
                        <SelectInput 
                          value={section.props.categoryId || ""}
                          onChange={(e) => updateProps({ categoryId: e.target.value })}
                        >
                          <option value="">Choose category...</option>
                          {itemType === 'platter' ? (
                            platterCategories.map(cat => (
                              <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))
                          ) : (
                            categories.map(cat => (
                              <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))
                          )}
                        </SelectInput>
                      </div>
                    )}
                  </div>

                  {/* Manual Selection search and visual pills */}
                  {sourceType === 'manual' && (
                    <div className="space-y-3 pt-2 border-t dark:border-neutral-850 animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-neutral-700 dark:text-neutral-300">Select Products Manually</Label>
                        <Badge variant="secondary" className="bg-[#741052]/10 text-[#741052] dark:bg-fuchsia-500/10 dark:text-fuchsia-400 border-none font-bold">
                          {section.props.itemIds?.length || 0} selected
                        </Badge>
                      </div>

                      {/* Selected Items Flex Pills */}
                      {(() => {
                        const selectedIds = section.props.itemIds || [];
                        const selectedItems = items.filter(i => selectedIds.includes(i._id));
                        if (selectedItems.length === 0) return null;
                        return (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">Selected Items:</span>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-50 dark:bg-neutral-950/40 border dark:border-neutral-800/80 rounded-xl max-h-[100px] overflow-y-auto">
                              {selectedItems.map(item => (
                                <span 
                                  key={item._id} 
                                  className="inline-flex items-center gap-1 bg-[#741052]/10 dark:bg-fuchsia-500/10 text-[#741052] dark:text-fuchsia-400 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm"
                                >
                                  {item.title}
                                  <button 
                                    type="button"
                                    onClick={() => toggleItemId(item._id)}
                                    className="hover:bg-[#741052]/20 dark:hover:bg-fuchsia-500/20 rounded-full p-0.5 transition-colors"
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Filter Search Checklist */}
                      <div className="border dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/20 shadow-inner">
                        <div className="p-2 border-b dark:border-neutral-850">
                          <Input 
                            placeholder="Filter items by name..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>
                        <div className="max-h-[180px] overflow-y-auto p-2 space-y-1">
                          {filteredItems.slice(0, 40).map(item => {
                            const isSelected = section.props.itemIds?.includes(item._id);
                            return (
                              <div 
                                key={item._id}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all duration-200 border ${
                                  isSelected 
                                    ? "bg-fuchsia-500/[0.04] border-fuchsia-200 dark:border-fuchsia-950 text-[#741052] dark:text-fuchsia-400 font-bold" 
                                    : "border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-850/50 text-neutral-750 dark:text-neutral-300"
                                }`}
                                onClick={() => toggleItemId(item._id)}
                              >
                                <span>{item.title}</span>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                  isSelected 
                                    ? "bg-[#741052] border-[#741052] dark:bg-fuchsia-500 dark:border-fuchsia-500 text-white" 
                                    : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                                }`}>
                                  {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                </div>
                              </div>
                            );
                          })}
                          {filteredItems.length === 0 && (
                            <p className="text-center text-neutral-400 p-2 text-xs">No items found.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GRID Tab 2: Layout */}
              {gridTab === 'layout' && (
                <div className="grid gap-4 sm:grid-cols-3 pt-2 animate-fadeIn">
                  {section.type === 'grid' && (
                    <div>
                      <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Grid Columns</Label>
                      <SelectInput 
                        value={section.props.columns || 4}
                        onChange={(e) => updateProps({ columns: parseInt(e.target.value) || 4 })}
                      >
                        <option value="2">2 Columns (Compact Grid)</option>
                        <option value="3">3 Columns (Mid-Size)</option>
                        <option value="4">4 Columns (Standard)</option>
                      </SelectInput>
                    </div>
                  )}

                  <div>
                    <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Card Visual Style</Label>
                    <SelectInput 
                      value={section.props.cardStyle || "gourmet"}
                      onChange={(e) => updateProps({ cardStyle: e.target.value as any })}
                    >
                      <option value="gourmet">Gourmet (Premium Large)</option>
                      <option value="compact">Compact (Dense Grid)</option>
                      <option value="minimal">Minimalist (List-like Card)</option>
                      <option value="list">Full Row List View</option>
                    </SelectInput>
                  </div>

                  <div>
                    <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Vertical Spacing (Padding)</Label>
                    <SelectInput 
                      value={section.props.spacingY || "medium"}
                      onChange={(e) => updateProps({ spacingY: e.target.value as any })}
                    >
                      <option value="small">Small Padding</option>
                      <option value="medium">Medium Padding</option>
                      <option value="large">Large Padding</option>
                    </SelectInput>
                  </div>
                </div>
              )}

              {/* GRID Tab 3: Theme */}
              {gridTab === 'theme' && (
                <div className="pt-2 animate-fadeIn">
                  <div className="max-w-md">
                    <Label className="font-semibold text-neutral-600 dark:text-neutral-400">Section Background Theme</Label>
                    <SelectInput 
                      value={section.props.bgColor || "default"}
                      onChange={(e) => updateProps({ bgColor: e.target.value as any })}
                    >
                      <option value="default">Default Page Background</option>
                      <option value="white">Solid Pure White</option>
                      <option value="grey">Subtle Light Grey</option>
                      <option value="light-fuchsia">Soft Light Fuchsia Tint</option>
                      <option value="dark-fuchsia">Luxury Dark Fuchsia (#741052)</option>
                    </SelectInput>
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
          <CardContent className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
            {[
              {
                name: "Header & Banners",
                types: ["hero", "banner"],
                icon: <ImageIcon size={14} className="text-pink-500" />,
                bg: "bg-pink-500/[0.04] dark:bg-pink-500/[0.02]"
              },
              {
                name: "Products & Lists",
                types: ["grid", "slider"],
                icon: <Grid size={14} className="text-violet-500" />,
                bg: "bg-violet-500/[0.04] dark:bg-violet-500/[0.02]"
              },
              {
                name: "Content & Reviews",
                types: ["rich-content", "testimonials"],
                icon: <Compass size={14} className="text-indigo-500" />,
                bg: "bg-indigo-500/[0.04] dark:bg-indigo-500/[0.02]"
              },
              {
                name: "Structure",
                types: ["divider"],
                icon: <Sliders size={14} className="text-slate-500" />,
                bg: "bg-slate-500/[0.04] dark:bg-slate-500/[0.02]"
              }
            ].map(cat => {
              const catPresets = SECTION_PRESETS.filter(p => cat.types.includes(p.type));
              return (
                <div key={cat.name} className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1 py-0.5">
                    {cat.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {cat.name}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {catPresets.map(preset => (
                      <div 
                        key={preset.type} 
                        className="group p-3 border border-neutral-100 dark:border-neutral-800/85 rounded-2xl hover:bg-fuchsia-500/[0.03] dark:hover:bg-fuchsia-500/[0.01] hover:border-[#741052]/30 dark:hover:border-fuchsia-500/20 cursor-pointer transition-all duration-200 active:scale-98 shadow-sm hover:shadow" 
                        onClick={() => addSection(preset)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-805 dark:text-neutral-200 text-xs group-hover:text-[#741052] dark:group-hover:text-fuchsia-400 transition-colors">
                            {preset.label}
                          </span>
                          <div className="h-5 w-5 rounded-full bg-neutral-50 dark:bg-neutral-900 group-hover:bg-[#741052]/10 flex items-center justify-center transition-colors">
                            <Plus size={12} className="text-neutral-450 group-hover:text-[#741052] dark:group-hover:text-fuchsia-400 transition-colors" />
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 leading-relaxed">
                          {preset.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        
        <div className="shrink-0 mt-auto">
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-[#741052] to-[#b11f7c] hover:from-[#5c0b40] hover:to-[#911664] text-white rounded-2xl font-bold uppercase tracking-wider text-xs h-12 shadow-md shadow-fuchsia-900/10 transition-all duration-350 active:scale-98" 
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
                                    <SelectInput 
                                      value={heroSec.props.displayMode || "overlay"}
                                      onChange={(e) => updateHeroProps({ displayMode: e.target.value })}
                                    >
                                      <option value="overlay">Overlay text on image</option>
                                      <option value="direct">Direct raw banner image</option>
                                    </SelectInput>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Banner Size (Height)</Label>
                                    <SelectInput 
                                      value={heroSec.props.bannerSize || "large"}
                                      onChange={(e) => updateHeroProps({ bannerSize: e.target.value })}
                                    >
                                      <option value="small">Small Height (Compact)</option>
                                      <option value="medium">Medium Height</option>
                                      <option value="large">Large Height (Default)</option>
                                      <option value="freesize">Free Size (Full natural size)</option>
                                    </SelectInput>
                                  </div>
                                  {(heroSec.props.displayMode || "overlay") === "overlay" && (
                                    <div className="flex flex-col justify-end pb-1.5">
                                      <div className="flex items-center gap-2 p-1.5 border dark:border-neutral-800 rounded-lg bg-neutral-50/30 dark:bg-neutral-900/10 h-9">
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
                                      <Label className="text-xs font-semibold text-neutral-655 dark:text-neutral-400">Banner Subtitle</Label>
                                      <Input 
                                        value={heroSec.props.subtitle || ""}
                                        onChange={(e) => updateHeroProps({ subtitle: e.target.value })}
                                        placeholder="Authentic Pakistani & Karachi Cuisines"
                                        className="mt-1 h-9 rounded-lg text-xs"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="grid gap-6 md:grid-cols-2 p-4 rounded-xl border border-neutral-150 dark:border-neutral-800/60 bg-neutral-50/30 dark:bg-neutral-900/10">
                                  {/* PC Upload */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs font-bold text-neutral-700 dark:text-neutral-355 flex items-center gap-1">
                                        <Laptop size={12} className="text-neutral-405" /> Desktop / PC Banner
                                      </Label>
                                      {heroSec.props.backgroundImage && (
                                        <button 
                                          onClick={() => updateHeroProps({ backgroundImage: "" })}
                                          className="text-[10px] text-red-500 hover:text-red-750 flex items-center gap-0.5 font-medium"
                                        >
                                          <X size={10} /> Clear
                                        </button>
                                      )}
                                    </div>

                                    {/* Browser Frame */}
                                    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm bg-neutral-100 dark:bg-neutral-950">
                                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-1 shrink-0">
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                        </div>
                                        <div className="flex-1 flex justify-center">
                                          <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded text-[8px] text-neutral-450 px-2 py-0.2 truncate max-w-[80px] w-full text-center font-mono">
                                            clk.com
                                          </div>
                                        </div>
                                      </div>
                                      <div className="relative aspect-[21/9] bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                                        {heroSec.props.backgroundImage ? (
                                          <img src={heroSec.props.backgroundImage} className="w-full h-full object-cover" alt="PC Banner" />
                                        ) : (
                                          <div className="text-center p-2">
                                            <ImageIcon className="mx-auto h-5 w-5 mb-0.5 text-neutral-300 dark:text-neutral-700" />
                                            <span className="text-[9px] text-neutral-400 block">No Desktop Banner</span>
                                          </div>
                                        )}
                                        {classicUploadingPc && (
                                          <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                            <Loader2 className="h-4 w-4 animate-spin text-[#741052] dark:text-fuchsia-400" />
                                          </div>
                                        )}
                                      </div>
                                    </div>

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
                                        className="h-8 text-xs font-semibold px-2"
                                        disabled={classicUploadingPc}
                                        onClick={() => document.getElementById('classic-pc-file')?.click()}
                                      >
                                        <Upload size={12} />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Mobile Upload */}
                                  <div className="space-y-2 flex flex-col justify-between">
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <Label className="text-xs font-bold text-neutral-700 dark:text-neutral-355 flex items-center gap-1">
                                          <Smartphone size={12} className="text-neutral-405" /> Mobile Banner
                                        </Label>
                                        {heroSec.props.mobileBackgroundImage && (
                                          <button 
                                            onClick={() => updateHeroProps({ mobileBackgroundImage: "" })}
                                            className="text-[10px] text-red-500 hover:text-red-750 flex items-center gap-0.5 font-medium"
                                          >
                                            <X size={10} /> Clear
                                          </button>
                                        )}
                                      </div>

                                      {/* Smartphone Frame */}
                                      <div className="relative mx-auto w-14 border-[3px] border-neutral-800 dark:border-neutral-700 rounded-[1rem] overflow-hidden shadow-sm bg-neutral-100 dark:bg-neutral-950 aspect-[9/16]">
                                        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-4 h-1 bg-neutral-800 dark:bg-neutral-700 rounded-full z-10" />
                                        <div className="relative w-full h-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                                          {heroSec.props.mobileBackgroundImage ? (
                                            <img src={heroSec.props.mobileBackgroundImage} className="w-full h-full object-cover" alt="Mobile Banner" />
                                          ) : (
                                            <div className="text-center p-0.5 mt-2">
                                              <ImageIcon className="mx-auto h-3 w-3 text-neutral-355 dark:text-neutral-700" />
                                            </div>
                                          )}
                                          {classicUploadingMobile && (
                                            <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                              <Loader2 className="h-4 w-4 animate-spin text-[#741052] dark:text-fuchsia-400" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex gap-2 mt-auto">
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
                                        className="h-8 text-xs font-semibold px-2"
                                        disabled={classicUploadingMobile}
                                        onClick={() => document.getElementById('classic-mobile-file')?.click()}
                                      >
                                        <Upload size={12} />
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
