'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import SearchBar from './SearchBar';

const DEFAULT_DISHES = [
  'Chicken White Biryani',
  'Beef White Biryani',
  'Special Chicken Karahi',
  'Beef Bihari Boti',
  'Gourmet Sharing Platter',
  'Chicken Tikka Pizza',
  'Crispy Zinger Burger',
  'Karak Chai',
  'Hotpot Chinese Chowmein',
  'Chicken Malai Boti Roll',
  'Chapli Kebab',
  'Fresh Gulab Jamun',
];

export default function SearchBarManagement() {
  const { toast } = useToast();
  const [dishes, setDishes] = useState<string[]>(DEFAULT_DISHES);
  const [newDishInput, setNewDishInput] = useState<string>('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<string>('');
  const [catalogItems, setCatalogItems] = useState<{ id: string; title: string; category: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Load current PageConfig and catalog items on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [configRes, itemsRes, plattersRes] = await Promise.all([
          fetch('/api/page-config'),
          fetch('/api/getitemsadmin'),
          fetch('/api/platteradmin'),
        ]);

        if (configRes.ok) {
          const configData = await configRes.json();
          if (
            configData.searchPlaceholderDishes &&
            Array.isArray(configData.searchPlaceholderDishes) &&
            configData.searchPlaceholderDishes.length > 0
          ) {
            setDishes(configData.searchPlaceholderDishes);
          }
        }

        const itemsList: { id: string; title: string; category: string }[] = [];
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          if (Array.isArray(itemsData)) {
            itemsData.forEach((item: any) => {
              if (item.title) {
                itemsList.push({
                  id: item._id || item.id,
                  title: item.title,
                  category: item.category || 'Menu Item',
                });
              }
            });
          }
        }

        if (plattersRes.ok) {
          const plattersData = await plattersRes.json();
          if (Array.isArray(plattersData)) {
            plattersData.forEach((platter: any) => {
              if (platter.title) {
                itemsList.push({
                  id: platter._id || platter.id,
                  title: platter.title,
                  category: platter.platterCategory || 'Platter',
                });
              }
            });
          }
        }

        setCatalogItems(itemsList);
      } catch (error) {
        console.error('Failed to load search bar configuration:', error);
        toast({
          title: 'Error',
          description: 'Failed to load search bar settings.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handle adding custom phrase
  const handleAddCustomDish = () => {
    const trimmed = newDishInput.trim();
    if (!trimmed) return;

    if (dishes.includes(trimmed)) {
      toast({
        title: 'Already added',
        description: `"${trimmed}" is already in the rotating list.`,
        variant: 'destructive',
      });
      return;
    }

    setDishes((prev) => [...prev, trimmed]);
    setNewDishInput('');
    setHasUnsavedChanges(true);
    toast({
      title: 'Item added',
      description: `Added "${trimmed}" to rotating placeholder list.`,
    });
  };

  // Handle adding from catalog dropdown
  const handleAddFromCatalog = () => {
    if (!selectedCatalogItem) return;

    if (dishes.includes(selectedCatalogItem)) {
      toast({
        title: 'Already added',
        description: `"${selectedCatalogItem}" is already in the rotating list.`,
        variant: 'destructive',
      });
      return;
    }

    setDishes((prev) => [...prev, selectedCatalogItem]);
    setSelectedCatalogItem('');
    setHasUnsavedChanges(true);
    toast({
      title: 'Item added',
      description: `Added "${selectedCatalogItem}" to rotating placeholder list.`,
    });
  };

  // Delete dish from list
  const handleDeleteDish = (index: number) => {
    const deletedName = dishes[index];
    setDishes((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
    toast({
      title: 'Item removed',
      description: `Removed "${deletedName}".`,
    });
  };

  // Move dish up or down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === dishes.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newDishes = [...dishes];
    const temp = newDishes[index];
    newDishes[index] = newDishes[targetIndex];
    newDishes[targetIndex] = temp;

    setDishes(newDishes);
    setHasUnsavedChanges(true);
  };

  // Inline edit
  const handleEditDish = (index: number, newValue: string) => {
    const newDishes = [...dishes];
    newDishes[index] = newValue;
    setDishes(newDishes);
    setHasUnsavedChanges(true);
  };

  // Reset to default
  const handleResetToDefaults = () => {
    setDishes(DEFAULT_DISHES);
    setHasUnsavedChanges(true);
    toast({
      title: 'Reset to defaults',
      description: 'Search placeholder list reset to 12 curated dishes.',
    });
  };

  // Auto-populate from catalog
  const handleAutoPopulateFromCatalog = () => {
    if (catalogItems.length === 0) {
      toast({
        title: 'No catalog items',
        description: 'No catalog items found to populate.',
        variant: 'destructive',
      });
      return;
    }

    const categoriesMap = new Map<string, string[]>();
    catalogItems.forEach((item) => {
      if (!categoriesMap.has(item.category)) {
        categoriesMap.set(item.category, []);
      }
      categoriesMap.get(item.category)!.push(item.title);
    });

    const populated: string[] = [];
    categoriesMap.forEach((titles) => {
      if (titles.length > 0 && populated.length < 12) {
        populated.push(titles[0]);
      }
    });

    if (populated.length > 0) {
      setDishes(populated);
      setHasUnsavedChanges(true);
      toast({
        title: 'Populated from catalog',
        description: `Loaded ${populated.length} varied dish names from your menu categories.`,
      });
    }
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const filtered = dishes.map((d) => d.trim()).filter(Boolean);
      if (filtered.length === 0) {
        toast({
          title: 'List cannot be empty',
          description: 'Please add at least 1 dish name before saving.',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      const res = await fetch('/api/page-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchPlaceholderDishes: filtered }),
      });

      if (!res.ok) throw new Error('Failed to save');

      setDishes(filtered);
      setHasUnsavedChanges(false);
      toast({
        title: 'Saved successfully',
        description: 'Customer search bar rotating items have been updated.',
      });
    } catch (error) {
      console.error('Failed to save search bar items:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to update search bar configuration.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#741052] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-neutral-500">Loading Search Bar Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#5c0d40] to-[#741052] text-white p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Search Bar Rotating Items</h1>
          </div>
          <p className="text-sm text-white/80 mt-1.5 max-w-2xl">
            Configure the rotating dish names that appear dynamically in the search bar placeholder
            when customers browse the menu.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleSaveChanges}
            disabled={saving || !hasUnsavedChanges}
            className={`font-semibold shadow-md ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </div>

      {/* Live Storefront Simulation */}
      <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#741052] dark:text-[#d0269b]" />
                <span>Live Customer Simulation</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time preview of how the rotating placeholder looks on your storefront.
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#741052]/10 text-[#741052] dark:bg-[#d0269b]/20 dark:text-[#d0269b]">
              {dishes.length} active phrases
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-8 flex flex-col items-center justify-center bg-white dark:bg-neutral-950">
          <div className="w-full max-w-xl">
            <SearchBar value="" onChange={() => {}} dishesList={dishes} />
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            Click inside the search bar above to test the smooth focus expansion and placeholder pause.
          </p>
        </CardContent>
      </Card>

      {/* Add Items Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Add from Catalog */}
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-[#741052] dark:text-[#d0269b]" />
              <span>Add from Menu Catalog</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Select existing dishes or platters directly from your menu database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <select
                value={selectedCatalogItem}
                onChange={(e) => setSelectedCatalogItem(e.target.value)}
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none text-neutral-900 dark:text-neutral-100"
              >
                <option value="">-- Choose Menu Item or Platter --</option>
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.title}>
                    [{item.category}] {item.title}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                onClick={handleAddFromCatalog}
                disabled={!selectedCatalogItem}
                className="bg-[#741052] hover:bg-[#5c0d40] text-white text-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Custom Phrase */}
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#741052] dark:text-[#d0269b]" />
              <span>Add Custom Phrase</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Type custom dish names, combos, or keywords (e.g. &ldquo;Special White Biryani&rdquo;).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter custom dish name..."
                value={newDishInput}
                onChange={(e) => setNewDishInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomDish();
                  }
                }}
                maxLength={30}
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
              />
              <Button
                type="button"
                onClick={handleAddCustomDish}
                disabled={!newDishInput.trim()}
                className="bg-[#741052] hover:bg-[#5c0d40] text-white text-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Phrases List & Reordering */}
      <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold">Active Rotating Phrases ({dishes.length})</CardTitle>
              <CardDescription className="text-xs">
                Items cycle continuously in this sequence. You can reorder, edit, or delete items.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoPopulateFromCatalog}
                className="text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-[#741052] dark:text-[#d0269b]" />
                Auto-Populate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToDefaults}
                className="text-xs text-neutral-600 dark:text-neutral-400"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset Defaults
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dishes.map((dish, index) => (
              <div
                key={`dish-${index}`}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:border-[#741052]/30 transition-colors"
              >
                {/* Index Pill */}
                <span className="w-6 h-6 rounded-lg bg-[#741052]/10 text-[#741052] dark:bg-[#d0269b]/20 dark:text-[#d0269b] font-bold text-xs flex items-center justify-center shrink-0">
                  {index + 1}
                </span>

                {/* Editable Dish Input */}
                <input
                  type="text"
                  value={dish}
                  onChange={(e) => handleEditDish(index, e.target.value)}
                  className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 outline-none border-b border-transparent focus:border-[#741052] px-1"
                />

                {/* Quick Move Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-25 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === dishes.length - 1}
                    className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-25 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteDish(index)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-400 hover:text-red-600 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Save Bar */}
          {hasUnsavedChanges && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  You have unsaved changes in your search bar rotating list.
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleSaveChanges}
                disabled={saving}
                className="bg-[#741052] hover:bg-[#5c0d40] text-white text-xs shrink-0"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                {saving ? 'Saving...' : 'Save Now'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
