'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowUpDown,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Save,
  RotateCcw,
  Layers,
  Utensils,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  _id: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  status: 'in stock' | 'out of stock';
  sortOrder?: number;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed';
}

interface PlatterItem {
  _id: string;
  id?: string;
  title: string;
  description: string;
  basePrice: number;
  platterCategory: string;
  image: string;
  status: 'in stock' | 'out of stock';
  sortOrder?: number;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed';
}

interface ItemOrderSortingProps {
  menuItems: MenuItem[];
  platterItems: PlatterItem[];
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

interface SortableProductItemProps {
  id: string;
  index: number;
  title: string;
  image: string;
  price: number;
  status: string;
  discountValue?: number;
  discountType?: string;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToTop: () => void;
  onMoveToBottom: () => void;
}

const SortableProductItem = ({
  id,
  index,
  title,
  image,
  price,
  status,
  discountValue,
  discountType,
  totalCount,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom,
}: SortableProductItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-all duration-200 ${
        isDragging
          ? 'bg-fuchsia-50/90 dark:bg-neutral-800 border-[#741052] dark:border-fuchsia-500 shadow-2xl scale-[1.02] opacity-95'
          : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="touch-none flex items-center justify-center p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-grab active:cursor-grabbing transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Position Rank Badge */}
      <div
        className={`flex items-center justify-center h-8 w-8 rounded-xl font-mono text-xs font-black shrink-0 transition-colors ${
          index === 0
            ? 'bg-gradient-to-br from-[#741052] to-[#d0269b] text-white shadow-md shadow-fuchsia-500/20'
            : index === 1
            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800'
            : index === 2
            ? 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 font-bold border border-pink-200 dark:border-pink-800'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold border border-neutral-200 dark:border-neutral-700'
        }`}
      >
        #{index + 1}
      </div>

      {/* Thumbnail */}
      <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800">
        <Image
          src={image || '/placeholder.png'}
          alt={title}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      {/* Title & Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate">
            {title}
          </h4>
          {status === 'out of stock' && (
            <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30">
              Out of Stock
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs sm:text-sm font-bold text-[#741052] dark:text-fuchsia-400">
            Rs. {price.toFixed(2)}
          </span>
          {discountValue && discountValue > 0 ? (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 border-none font-bold">
              -{discountValue}{discountType === 'percentage' ? '%' : ' Rs'}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Quick Move Button Cluster */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMoveToTop}
          disabled={isFirst}
          className="h-8 w-8 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
          title="Move to First (#1)"
        >
          <ChevronsUp className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMoveUp}
          disabled={isFirst}
          className="h-8 w-8 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
          title="Move Up"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMoveDown}
          disabled={isLast}
          className="h-8 w-8 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
          title="Move Down"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMoveToBottom}
          disabled={isLast}
          className="h-8 w-8 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
          title="Move to Last"
        >
          <ChevronsDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function ItemOrderSorting({
  menuItems,
  platterItems,
  refreshData,
  isLoading,
}: ItemOrderSortingProps) {
  const { toast } = useToast();

  const [activeMode, setActiveMode] = useState<'menu' | 'platter'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentItems, setCurrentItems] = useState<(MenuItem | PlatterItem)[]>([]);
  const [initialSequence, setInitialSequence] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Group Menu Items by Category
  const menuCategories = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    menuItems.forEach((item) => {
      const cat = item.category || (item as any).platterCategory || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    // Sort items within each category by sortOrder if present, else original index
    map.forEach((items, cat) => {
      items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [menuItems]);

  // Group Platter Items by Category
  const platterCategories = useMemo(() => {
    const map = new Map<string, PlatterItem[]>();
    platterItems.forEach((item) => {
      const cat = item.platterCategory || (item as any).category || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    map.forEach((items, cat) => {
      items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [platterItems]);

  const activeCategoryList = useMemo(() => {
    return activeMode === 'menu' ? menuCategories : platterCategories;
  }, [activeMode, menuCategories, platterCategories]);

  // Auto-select first category when mode changes or on load
  useEffect(() => {
    if (activeCategoryList.length > 0) {
      const exists = activeCategoryList.some(([cat]) => cat === selectedCategory);
      if (!exists) {
        setSelectedCategory(activeCategoryList[0][0]);
      }
    } else {
      setSelectedCategory('');
    }
  }, [activeMode, activeCategoryList, selectedCategory]);

  // Sync current items when category selection or data changes
  useEffect(() => {
    if (!selectedCategory) {
      setCurrentItems([]);
      setInitialSequence([]);
      return;
    }

    const match = activeCategoryList.find(([cat]) => cat === selectedCategory);
    if (match) {
      const sorted = [...match[1]].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setCurrentItems(sorted);
      setInitialSequence(sorted.map((i) => i._id));
    } else {
      setCurrentItems([]);
      setInitialSequence([]);
    }
  }, [selectedCategory, activeCategoryList]);

  // Check if current category has unsaved order changes
  const hasUnsavedChanges = useMemo(() => {
    if (currentItems.length !== initialSequence.length) return false;
    return currentItems.some((item, index) => item._id !== initialSequence[index]);
  }, [currentItems, initialSequence]);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCurrentItems((items) => {
        const oldIndex = items.findIndex((i) => i._id === active.id);
        const newIndex = items.findIndex((i) => i._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMove = (index: number, targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= currentItems.length || index === targetIndex) return;
    setCurrentItems((prev) => arrayMove(prev, index, targetIndex));
  };

  const handleReset = () => {
    const match = activeCategoryList.find(([cat]) => cat === selectedCategory);
    if (match) {
      const sorted = [...match[1]].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setCurrentItems(sorted);
      toast({ title: 'Order Reset', description: 'Reverted to the last saved sorting order.' });
    }
  };

  const handleSaveOrder = async () => {
    if (currentItems.length === 0) return;

    setIsSaving(true);
    try {
      const payload = {
        type: activeMode,
        items: currentItems.map((item, index) => ({
          id: item._id,
          sortOrder: index,
        })),
      };

      const res = await fetch('/api/updateProductSortOrder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: 'Sort Order Saved!',
          description: `Successfully updated the product order for "${selectedCategory}".`,
        });
        setInitialSequence(currentItems.map((i) => i._id));
        await refreshData();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save product sort order');
      }
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Could not update sort order',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#741052] to-[#d0269b] flex items-center justify-center text-white shadow-md shadow-fuchsia-500/20">
              <ArrowUpDown className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Item Order Sorting
            </h2>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 pl-11">
            Manually arrange the display sequence of products (1st, 2nd, 3rd, etc.) under each category.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={isLoading || isRefreshing}
            className="h-10 px-4 gap-2 rounded-xl border-neutral-200 dark:border-neutral-800"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
            Sync
          </Button>

          <Button
            onClick={handleSaveOrder}
            disabled={!hasUnsavedChanges || isSaving}
            className={`h-10 px-5 rounded-xl font-bold transition-all shadow-md ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-[#741052] to-[#d0269b] text-white hover:opacity-90 shadow-fuchsia-500/20 animate-pulse'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Sequence
          </Button>
        </div>
      </div>

      {/* MODE SELECTOR (MENU ITEMS vs PLATTERS) */}
      <div className="flex items-center justify-between p-2 bg-neutral-100/80 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges) {
                if (!confirm('You have unsaved changes in this category. Switch mode anyway?')) return;
              }
              setActiveMode('menu');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeMode === 'menu'
                ? 'bg-white dark:bg-neutral-800 text-[#741052] dark:text-fuchsia-300 shadow-sm border border-neutral-200/60 dark:border-neutral-700'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Utensils className="h-4 w-4" />
            Menu Dishes ({menuItems.length})
          </button>

          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges) {
                if (!confirm('You have unsaved changes in this category. Switch mode anyway?')) return;
              }
              setActiveMode('platter');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeMode === 'platter'
                ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-300 shadow-sm border border-neutral-200/60 dark:border-neutral-700'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Layers className="h-4 w-4" />
            Gourmet Combo Platters ({platterItems.length})
          </button>
        </div>

        {hasUnsavedChanges && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg text-xs font-bold animate-pulse">
            <AlertCircle className="h-3.5 w-3.5" />
            Unsaved sequence changes in "{selectedCategory}"
          </div>
        )}
      </div>

      {/* TWO COLUMN WORKSPACE: CATEGORIES SIDEBAR + SORTING CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Category List Sidebar */}
        <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-full">
          <CardHeader className="bg-neutral-50/60 dark:bg-neutral-900/40 border-b pb-3 shrink-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
              <span>Categories ({activeCategoryList.length})</span>
              <Badge variant="secondary" className="text-[10px] font-bold">
                {activeMode === 'menu' ? 'Dishes' : 'Platters'}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-3 space-y-1.5 overflow-y-auto max-h-[600px]">
            {activeCategoryList.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                No categories found.
              </div>
            ) : (
              activeCategoryList.map(([catName, items]) => {
                const isSelected = selectedCategory === catName;
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => {
                      if (hasUnsavedChanges && selectedCategory !== catName) {
                        if (!confirm(`You have unsaved changes in "${selectedCategory}". Switch category anyway?`)) {
                          return;
                        }
                      }
                      setSelectedCategory(catName);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                      isSelected
                        ? 'bg-fuchsia-50/90 dark:bg-neutral-800 text-[#741052] dark:text-fuchsia-300 font-bold border border-fuchsia-200/70 dark:border-neutral-700 shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/40 font-medium'
                    }`}
                  >
                    <span className="truncate text-xs sm:text-sm">{catName}</span>
                    <Badge
                      variant={isSelected ? 'default' : 'secondary'}
                      className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                        isSelected
                          ? 'bg-[#741052] text-white dark:bg-fuchsia-600'
                          : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {items.length}
                    </Badge>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Sorting Canvas */}
        <Card className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col bg-neutral-50/20 dark:bg-neutral-900/10">
          <CardHeader className="bg-white dark:bg-neutral-950 border-b p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-neutral-900 dark:text-white">
                  {selectedCategory || 'Select a Category'}
                </CardTitle>
                {selectedCategory && (
                  <Badge variant="outline" className="text-xs font-bold text-[#741052] dark:text-fuchsia-300 border-[#741052]/30">
                    {currentItems.length} Products
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-0.5">
                Drag using the handle or use arrow buttons to arrange products in order.
              </CardDescription>
            </div>

            {hasUnsavedChanges && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="h-9 rounded-xl text-xs gap-1.5 border-neutral-200 dark:border-neutral-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveOrder}
                  disabled={isSaving}
                  className="h-9 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#741052] to-[#d0269b] text-white hover:opacity-90 shadow-md shadow-fuchsia-500/20"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-4 sm:p-6 overflow-y-auto max-h-[700px]">
            {currentItems.length === 0 ? (
              <div className="p-16 text-center text-neutral-400 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
                <Tag className="h-10 w-10 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
                <p className="font-bold text-sm text-neutral-600 dark:text-neutral-400">
                  No products in this category
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Add items to this category in the Menu or Platter management tabs.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={currentItems.map((item) => item._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {currentItems.map((item, index) => {
                      const price = 'price' in item ? item.price : (item as PlatterItem).basePrice;
                      return (
                        <SortableProductItem
                          key={item._id}
                          id={item._id}
                          index={index}
                          title={item.title}
                          image={item.image}
                          price={price}
                          status={item.status}
                          discountValue={item.discountValue}
                          discountType={item.discountType}
                          totalCount={currentItems.length}
                          onMoveUp={() => handleMove(index, index - 1)}
                          onMoveDown={() => handleMove(index, index + 1)}
                          onMoveToTop={() => handleMove(index, 0)}
                          onMoveToBottom={() => handleMove(index, currentItems.length - 1)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
