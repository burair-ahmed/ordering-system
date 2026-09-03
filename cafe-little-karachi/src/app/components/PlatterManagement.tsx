'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Eye, 
  EyeOff, 
  CheckSquare, 
  Square, 
  Tag, 
  Loader2, 
  Edit3, 
  Plus,
  Layers,
  Sparkles,
  UtensilsCrossed,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Option {
  name: string;
  uuid: string;
}

interface AdditionalChoice {
  heading: string;
  options: Option[];
}

interface CategoryOptions {
  _id: string;
  categoryName: string;
  options: Option[];
}

interface PlatterItem {
  _id: string;
  title: string;
  description: string;
  basePrice: number;
  platterCategory: string;
  image: string;
  status: 'in stock' | 'out of stock';
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  isVisible?: boolean;
  additionalChoices: AdditionalChoice[];
  categories: CategoryOptions[];
}

interface PlatterManagementProps {
  platterItems: PlatterItem[];
  loading: boolean;
  refreshData: () => Promise<void>;
  onEditItem: (item: PlatterItem) => void;
}

export default function PlatterManagement({ platterItems, loading, refreshData, onEditItem }: PlatterManagementProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatterIds, setSelectedPlatterIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Dynamic statistics
  const stats = useMemo(() => {
    const total = platterItems.length;
    const active = platterItems.filter((p) => p.status === 'in stock').length;
    const visible = platterItems.filter((p) => p.isVisible !== false).length;
    const discounted = platterItems.filter((p) => p.discountValue !== undefined && p.discountValue > 0).length;
    return { total, active, visible, discounted };
  }, [platterItems]);

  // Filter platters based on query
  const filteredPlatters = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return platterItems.filter((p) => {
      const matchesQuery =
        p.title.toLowerCase().includes(q) ||
        (p.platterCategory && p.platterCategory.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

      return matchesQuery;
    });
  }, [platterItems, searchQuery]);

  // Toggle Single Platter Visibility
  const toggleVisibility = async (item: PlatterItem) => {
    setTogglingId(item._id);
    try {
      const res = await fetch('/api/updatePlatter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          id: item._id,
          isVisible: !item.isVisible,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Visibility Updated',
          description: `Platter "${item.title}" is now ${!item.isVisible ? 'visible' : 'hidden'} on the customer menu.`,
        });
        await refreshData();
      } else {
        throw new Error('Failed to update visibility');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle platter visibility.',
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Bulk Visibility Update
  const handleBulkVisibility = async (isVisible: boolean) => {
    if (selectedPlatterIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch('/api/bulkUpdatePlatters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedPlatterIds),
          isVisible,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Bulk Update Success',
          description: `Updated ${selectedPlatterIds.size} platters to ${isVisible ? 'visible' : 'hidden'}.`,
        });
        setSelectedPlatterIds(new Set());
        await refreshData();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Bulk request failed');
      }
    } catch (error: any) {
      toast({
        title: 'Bulk Update Failed',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Toggle Selection
  const toggleSelect = (id: string) => {
    setSelectedPlatterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPlatterIds.size === filteredPlatters.length) {
      setSelectedPlatterIds(new Set());
    } else {
      setSelectedPlatterIds(new Set(filteredPlatters.map((p) => p._id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Platter Combinations</h2>
          <p className="text-sm text-neutral-500">Create, edit, filter, and adjust visibility options for gourmet combo platters.</p>
        </div>
        
        <div className="relative w-full sm:w-64 md:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by platter title, category..."
            className="h-10 pl-10 pr-4 rounded-xl border-neutral-200 focus-visible:ring-fuchsia-500"
          />
        </div>
      </div>

      {/* Modern Dashboard Mini-Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border border-neutral-100 dark:border-neutral-800/80 bg-gradient-to-br from-white via-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-950/60 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Platters</span>
            <UtensilsCrossed className="h-4 w-4 text-fuchsia-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] text-neutral-500 mt-0.5">Custom configurations</p>
          </CardContent>
        </Card>

        <Card className="border border-neutral-100 dark:border-neutral-800/80 bg-gradient-to-br from-white via-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-950/60 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Available</span>
            <Layers className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</div>
            <p className="text-[10px] text-neutral-500 mt-0.5">Instock deal sets</p>
          </CardContent>
        </Card>

        <Card className="border border-neutral-100 dark:border-neutral-800/80 bg-gradient-to-br from-white via-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-950/60 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Visible</span>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.visible}</div>
            <p className="text-[10px] text-neutral-500 mt-0.5">Shown to customers</p>
          </CardContent>
        </Card>

        <Card className="border border-neutral-100 dark:border-neutral-800/80 bg-gradient-to-br from-white via-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-950/60 shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Deals</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.discounted}</div>
            <p className="text-[10px] text-neutral-500 mt-0.5">Discount values applied</p>
          </CardContent>
        </Card>
      </div>

      {/* Select All Actions Bar */}
      <div className="flex items-center justify-between px-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSelectAll}
          className="text-xs text-neutral-500 hover:text-neutral-900 gap-2 px-3 rounded-lg"
        >
          {selectedPlatterIds.size === filteredPlatters.length && filteredPlatters.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-fuchsia-600 animate-in zoom-in-50" />
          ) : (
            <Square className="h-4 w-4 text-neutral-400" />
          )}
          {selectedPlatterIds.size === filteredPlatters.length && filteredPlatters.length > 0 ? 'Deselect All Platters' : `Select All (${filteredPlatters.length})`}
        </Button>
      </div>

      {/* Platters Card Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-neutral-150 shadow-sm">
              <Skeleton className="h-44 w-full" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </Card>
          ))
        ) : filteredPlatters.length > 0 ? (
          filteredPlatters.map((item) => {
            const isSelected = selectedPlatterIds.has(item._id);
            return (
              <motion.div
                key={item._id}
                layoutId={`platter-card-${item._id}`}
                className="group relative"
              >
                <Card 
                  className={`overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm ${
                    isSelected 
                      ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/10 dark:ring-fuchsia-500/20 shadow-md scale-[1.01]' 
                      : 'border-neutral-100 hover:border-fuchsia-200 hover:shadow-md dark:border-neutral-800'
                  }`}
                >
                  {/* Selection Overlay Checkbox */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(item._id);
                    }}
                    className={`absolute top-3 right-3 z-30 h-7 w-7 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-fuchsia-600 text-white scale-100' 
                        : 'bg-black/40 text-white/70 hover:bg-black/60 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="h-4.5 w-4.5" /> : <Square className="h-4.5 w-4.5" />}
                  </div>

                  {/* Thumbnail Wrap */}
                  <div className="flex h-44 items-center justify-center bg-neutral-100 dark:bg-neutral-900 relative overflow-hidden">
                    {/* Discount Badge */}
                    {item.discountValue !== undefined && item.discountValue > 0 && (
                      <div className="absolute top-3 left-3 bg-[#741052] text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10 shadow-sm">
                        {item.discountType === 'percentage' ? `-${item.discountValue}%` : `-Rs ${item.discountValue}`}
                      </div>
                    )}

                    {/* Hidden Backdrop Indicator */}
                    {item.isVisible === false && (
                      <div className="absolute inset-0 bg-neutral-900/60 dark:bg-neutral-950/75 flex items-center justify-center z-20 backdrop-blur-[1px]">
                        <span className="text-xs text-white font-semibold bg-neutral-900/80 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                          <EyeOff className="h-3.5 w-3.5 text-rose-400" /> Hidden from Menu
                        </span>
                      </div>
                    )}

                    <Image
                      src={item.image}
                      alt={item.title}
                      width={160}
                      height={160}
                      className={`h-32 w-32 rounded-2xl object-cover transition-all duration-500 group-hover:scale-105 ${
                        item.isVisible === false ? 'opacity-30 blur-[1px]' : ''
                      }`}
                    />
                  </div>

                  {/* Card Actions Content */}
                  <CardContent className="space-y-3 p-5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="text-xs text-neutral-400 font-semibold tracking-wider uppercase truncate max-w-[120px]">
                          {item.platterCategory || 'Combo Platter'}
                        </span>
                        <Badge 
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-none ${
                            item.status === 'in stock'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      
                      <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors truncate">
                        {item.title}
                      </h3>
                      
                      <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                        {item.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-dashed border-neutral-100 dark:border-neutral-800 mt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">Base Price</span>
                        <span className="text-sm font-bold font-mono text-neutral-800 dark:text-neutral-100">
                          Rs. {item.basePrice}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={togglingId === item._id}
                          onClick={() => toggleVisibility(item)}
                          className={
                            "text-neutral-600 dark:text-neutral-300 h-8 w-8 rounded-lg shrink-0 " +
                            "hover:text-fuchsia-600 hover:bg-fuchsia-500/10"
                          }
                          title={item.isVisible !== false ? 'Hide from Menu' : 'Show on Menu'}
                        >
                          {togglingId === item._id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-fuchsia-600" />
                          ) : item.isVisible !== false ? (
                            <Eye className="h-4.5 w-4.5 text-neutral-500" />
                          ) : (
                            <EyeOff className="h-4.5 w-4.5 text-rose-500" />
                          )}
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => onEditItem(item)}
                          className="h-8 gap-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-fuchsia-50 hover:text-fuchsia-700 dark:hover:bg-neutral-800"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-neutral-500 bg-white dark:bg-neutral-900 border rounded-3xl">
            <Search className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">No platters found</p>
            <p className="text-xs text-neutral-400 mt-1">Try refining your search text query.</p>
          </div>
        )}
      </div>

      {/* Floating Modern Bulk Action Bar */}
      <AnimatePresence>
        {selectedPlatterIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4"
          >
            <div className="flex items-center justify-between bg-neutral-900/90 dark:bg-black/90 backdrop-blur-xl border border-white/10 text-white p-3.5 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-3 pl-2">
                <div className="h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse" />
                <span className="text-sm font-semibold tracking-wide">
                  {selectedPlatterIds.size} Selected
                </span>
                <span className="text-neutral-500">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlatterIds(new Set())}
                  className="text-neutral-400 hover:text-white hover:bg-white/10 h-8 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isBulkUpdating}
                  onClick={() => handleBulkVisibility(true)}
                  className="h-9 px-3 gap-1.5 hover:bg-white/10 text-xs font-semibold text-white shrink-0"
                >
                  <Eye className="h-4 w-4 text-emerald-400" />
                  Make Visible
                </Button>
                <Button
                  size="sm"
                  disabled={isBulkUpdating}
                  onClick={() => handleBulkVisibility(false)}
                  className="h-9 px-3 gap-1.5 bg-[#741052] hover:bg-[#741052]/90 text-white text-xs font-semibold shrink-0 rounded-xl"
                >
                  {isBulkUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-rose-300" />
                  )}
                  Hide Selected
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
