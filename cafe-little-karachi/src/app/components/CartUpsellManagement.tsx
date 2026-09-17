'use client';

import { FC, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface MenuItem {
  _id: string;
  id?: string;
  title: string;
  price: number;
  image: string;
  category: string;
  status?: string;
}

interface PlatterItem {
  _id: string;
  id?: string;
  title: string;
  basePrice: number;
  image: string;
  platterCategory: string;
  status?: string;
}

interface CartUpsellManagementProps {
  menuItems: MenuItem[];
  platterItems: PlatterItem[];
}

export default function CartUpsellManagement({
  menuItems = [],
  platterItems = [],
}: CartUpsellManagementProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [heading, setHeading] = useState<string>('Popular with your order');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Combine products for unified lookup
  const unifiedProducts = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      price: number;
      image: string;
      category: string;
      type: 'menu' | 'platter';
    }> = [];

    menuItems.forEach((m) => {
      const id = m.id || m._id;
      list.push({
        id,
        title: m.title,
        price: m.price,
        image: m.image || '/placeholder.png',
        category: m.category || 'Menu Item',
        type: 'menu',
      });
    });

    platterItems.forEach((p) => {
      const id = p.id || p._id;
      list.push({
        id,
        title: p.title,
        price: p.basePrice,
        image: p.image || '/placeholder.png',
        category: p.platterCategory || 'Platter',
        type: 'platter',
      });
    });

    return list;
  }, [menuItems, platterItems]);

  // Categories list for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    unifiedProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [unifiedProducts]);

  // Load config on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetch('/api/cart-upsells')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.config) {
          setIsEnabled(data.config.isEnabled ?? true);
          setHeading(data.config.heading || 'Popular with your order');
          setMode(data.config.mode || 'auto');
          setSelectedIds(data.config.itemIds || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load upsell config:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/cart-upsells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled,
          heading: heading.trim(),
          mode,
          itemIds: selectedIds,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      toast.success('Cart upsell carousel settings updated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Add item to curated list
  const handleAddItem = (id: string) => {
    if (!selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev, id]);
      if (mode === 'auto') setMode('manual');
    }
  };

  // Remove item from curated list
  const handleRemoveItem = (id: string) => {
    setSelectedIds((prev) => prev.filter((itId) => itId !== id));
  };

  // Move item up/down
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedIds.length) return;
    const newArr = [...selectedIds];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    setSelectedIds(newArr);
  };

  // Filtered available products for picker
  const filteredAvailableProducts = useMemo(() => {
    return unifiedProducts.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [unifiedProducts, searchQuery, selectedCategoryFilter]);

  // Curated products objects
  const curatedProducts = useMemo(() => {
    return selectedIds
      .map((id) => unifiedProducts.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [selectedIds, unifiedProducts]);

  // Preview products (either curated or auto fallback)
  const previewProducts = useMemo(() => {
    if (mode === 'manual' && curatedProducts.length > 0) {
      return curatedProducts;
    }
    return unifiedProducts.slice(0, 6);
  }, [mode, curatedProducts, unifiedProducts]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Save Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-[#741052]/10 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#741052] to-[#d0269b] flex items-center justify-center text-white shadow-md shadow-[#741052]/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                Cart Upsell & Recommendations
              </h1>
              <Badge
                className={
                  isEnabled
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20'
                }
              >
                {isEnabled ? 'Active in Cart' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Configure the &quot;Popular with your order&quot; product carousel displayed inside the cart drawer.
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-[#741052] to-[#d0269b] hover:from-[#5c0d40] hover:to-[#b81f88] text-white shadow-md flex items-center gap-2 px-6 rounded-xl font-bold"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Settings & Live Drawer Simulation (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* General Controls Card */}
          <Card className="border-[#741052]/10 dark:border-neutral-800 rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <SlidersHorizontal className="w-4 h-4 text-[#741052]" />
                Display Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Control visibility, heading text, and selection algorithm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
                <div>
                  <Label className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    Enable Carousel
                  </Label>
                  <p className="text-xs text-neutral-500">
                    Show upsell section inside the cart drawer
                  </p>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                  className="data-[state=checked]:bg-[#741052]"
                />
              </div>

              {/* Heading Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Section Header Label
                </Label>
                <Input
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="e.g. Popular with your order"
                  className="rounded-xl border-neutral-300 dark:border-neutral-700 font-medium text-sm"
                />
              </div>

              {/* Mode Selection Toggle */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Products Selection Strategy
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('auto')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mode === 'auto'
                        ? 'border-[#741052] bg-[#741052]/5 dark:bg-[#741052]/15 text-[#741052] dark:text-[#f472b6] font-bold shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto Popular
                    </div>
                    <p className="text-[11px] font-normal opacity-85 leading-snug">
                      Dynamically displays top in-stock menu items.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('manual')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mode === 'manual'
                        ? 'border-[#741052] bg-[#741052]/5 dark:bg-[#741052]/15 text-[#741052] dark:text-[#f472b6] font-bold shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      <Layers className="w-3.5 h-3.5" />
                      Curated Handpicked
                    </div>
                    <p className="text-[11px] font-normal opacity-85 leading-snug">
                      Manually select and sequence specific dishes.
                    </p>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Drawer Simulation Preview */}
          <Card className="border-[#741052]/10 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden bg-neutral-900 text-white">
            <CardHeader className="pb-3 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#f472b6]" />
                  Live Cart Drawer Simulation
                </CardTitle>
                <Badge className="bg-[#741052] text-[10px] text-white">Preview</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 bg-[#fbf9fb] dark:bg-neutral-950 text-neutral-900 dark:text-white">
              {/* Upsell Mockup Container */}
              <div className="space-y-2 bg-white dark:bg-neutral-900 p-3.5 rounded-2xl border border-[#741052]/10 dark:border-neutral-800 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-3.5 rounded-full bg-[#741052] dark:bg-[#d0269b]" />
                    <Flame className="w-4 h-4 text-[#741052] dark:text-[#d0269b]" />
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {heading || 'Popular with your order'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                      <ChevronLeft className="w-3 h-3" />
                    </div>
                    <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200">
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Horizontal Scroll Cards */}
                <div className="flex gap-2.5 overflow-x-auto py-1 scrollbar-none">
                  {previewProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex-shrink-0 w-[95px] flex flex-col group"
                    >
                      <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-800">
                        <Image
                          src={p.image}
                          alt={p.title}
                          fill
                          sizes="95px"
                          className="object-cover"
                        />
                        {/* Circular + button */}
                        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#741052] text-white flex items-center justify-center shadow-md">
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </div>
                      </div>
                      <span className="font-bold text-[11px] text-neutral-900 dark:text-neutral-100 mt-1">
                        Rs. {p.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                        {p.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Curated Sequence & Product Picker (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Curated Products Sequence Manager */}
          <Card className="border-[#741052]/10 dark:border-neutral-800 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                    <Layers className="w-4 h-4 text-[#741052]" />
                    Curated Products List ({selectedIds.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {mode === 'manual'
                      ? 'Dishes ordered here will appear in the cart carousel in this exact sequence.'
                      : 'Switch to "Curated Handpicked" mode above to enforce this custom sequence.'}
                  </CardDescription>
                </div>

                {selectedIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Clear List
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {selectedIds.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    No custom products selected yet.
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Pick dishes from the catalog below to create a tailored recommendation list.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {curatedProducts.map((prod, idx) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/60 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="w-5 text-center text-xs font-bold text-neutral-400">
                          #{idx + 1}
                        </span>
                        <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0 bg-neutral-100">
                          <Image
                            src={prod.image}
                            alt={prod.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {prod.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                            <span className="font-semibold text-[#741052] dark:text-[#f472b6]">
                              Rs. {prod.price.toLocaleString()}
                            </span>
                            <span>•</span>
                            <span className="truncate">{prod.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveItem(idx, 'up')}
                          className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 disabled:opacity-30 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition-colors"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === selectedIds.length - 1}
                          onClick={() => handleMoveItem(idx, 'down')}
                          className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 disabled:opacity-30 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition-colors"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(prod.id)}
                          className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors ml-1"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Catalog Picker */}
          <Card className="border-[#741052]/10 dark:border-neutral-800 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <Search className="w-4 h-4 text-[#741052]" />
                Select Products from Catalog
              </CardTitle>
              <CardDescription className="text-xs">
                Search or filter by category and click &quot;Add&quot; to include items in the carousel.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes, platters, categories..."
                    className="pl-9 rounded-xl border-neutral-300 dark:border-neutral-700 text-xs h-9"
                  />
                </div>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 font-medium h-9"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1 pt-1">
                {filteredAvailableProducts.map((prod) => {
                  const isSelected = selectedIds.includes(prod.id);

                  return (
                    <div
                      key={prod.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'border-[#741052]/40 bg-[#741052]/5 dark:bg-[#741052]/10'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0 bg-neutral-100">
                          <Image
                            src={prod.image}
                            alt={prod.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {prod.title}
                          </h5>
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                            <span className="font-semibold text-[#741052] dark:text-[#f472b6]">
                              Rs. {prod.price.toLocaleString()}
                            </span>
                            <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300 truncate max-w-[90px]">
                              {prod.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(prod.id)}
                          className="h-7 px-2 text-xs text-neutral-500 hover:text-red-500"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1" />
                          Added
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddItem(prod.id)}
                          className="h-7 px-2.5 text-xs bg-[#741052] hover:bg-[#5c0d40] text-white rounded-lg"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
