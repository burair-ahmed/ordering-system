'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  ChevronDown,
  Percent,
  DollarSign,
  Loader2,
  Trash2,
  ShoppingCart,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
  Flame,
  ArrowRight,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Interfaces based on admin/page.tsx
interface Variation {
  name: string;
  price: number;
}

interface MenuItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  variations: Variation[];
  status: 'in stock' | 'out of stock';
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  isVisible?: boolean;
}

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

interface CheckoutDiscountConfig {
  _id?: string;
  isActive: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  label: string;
}

interface BulkDiscountManagementProps {
  menuItems: MenuItem[];
  platterItems: PlatterItem[];
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const SkeletonCategoryCard = () => (
  <Card className="mb-4 overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm">
    <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </div>
  </Card>
);

const SkeletonProductCard = () => (
  <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
    <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);

const CategoryDiscountCard = ({
  categoryName,
  items,
  type,
  refreshData,
  isOpen,
  onToggle,
  isLoading
}: {
  categoryName: string;
  items: (MenuItem | PlatterItem)[];
  type: 'menu' | 'platter';
  refreshData: () => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
  isLoading: boolean;
}) => {
  const { toast } = useToast();
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Derive current uniform discount info if any
  const firstItem = items[0];
  const allSameDiscount = items.length > 0 && items.every(
    (item) => item.discountType === firstItem.discountType && item.discountValue === firstItem.discountValue
  );
  
  const currentDiscountType = allSameDiscount ? firstItem.discountType : undefined;
  const currentDiscountValue = allSameDiscount ? firstItem.discountValue : undefined;

  const handleApplyDiscount = async () => {
    if (discountValue === '' || Number(discountValue) < 0) {
      toast({ title: 'Invalid Value', description: 'Please enter a valid discount amount.', variant: 'destructive' });
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/bulkUpdateCategoryDiscount', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryName,
          type,
          discountType,
          discountValue: Number(discountValue)
        })
      });

      if (res.ok) {
        toast({ title: 'Success', description: `Discount applied to ${categoryName} items.` });
        setDiscountValue('');
        await refreshData();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to apply discount', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveDiscount = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/bulkUpdateCategoryDiscount', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryName,
          type,
          discountType: 'percentage',
          discountValue: 0
        })
      });

      if (res.ok) {
        toast({ title: 'Success', description: `Discount removed from ${categoryName} items.` });
        await refreshData();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to remove discount');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to remove discount', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="mb-4 overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{categoryName}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {items.length} {items.length === 1 ? 'Product' : 'Products'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {currentDiscountValue && currentDiscountValue > 0 ? (
             <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-sm">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               Active: {currentDiscountValue}{currentDiscountType === 'percentage' ? '%' : ' Rs'} Off
             </Badge>
          ) : (
             <Badge variant="outline" className="text-neutral-400 border-neutral-200 dark:border-neutral-800 px-3 py-1 text-xs">
               No Discount
             </Badge>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 p-4 sm:p-6 space-y-6">
              
              {/* Discount Controls */}
              <div className="flex flex-col sm:flex-row items-end gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                <div className="flex-1 w-full space-y-2">
                  <label className="text-sm font-medium">Discount Type</label>
                  <Select value={discountType} onValueChange={(val: 'percentage' | 'fixed') => setDiscountType(val)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2"><Percent className="h-4 w-4" /> Percentage (%)</div>
                      </SelectItem>
                      <SelectItem value="fixed">
                        <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Fixed Amount (Rs)</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 w-full space-y-2">
                  <label className="text-sm font-medium">Discount Value</label>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="Enter value..."
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : '')}
                    className="h-10"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={handleApplyDiscount} 
                    disabled={isUpdating}
                    className="flex-1 sm:flex-none h-10 bg-gradient-to-r from-[#741052] to-[#d0269b] text-white hover:opacity-90 shadow-sm font-semibold"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Tag className="h-4 w-4 mr-2" />}
                    Apply to {categoryName}
                  </Button>
                  
                  {currentDiscountValue && currentDiscountValue > 0 && (
                     <Button 
                       variant="outline"
                       onClick={handleRemoveDiscount} 
                       disabled={isUpdating}
                       className="h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20"
                       title="Remove Discount"
                     >
                       {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                     </Button>
                  )}
                </div>
              </div>

              {/* Products Grid */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Products in {categoryName}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {isLoading ? (
                    Array.from({ length: Math.max(items.length, 4) }).map((_, i) => <SkeletonProductCard key={i} />)
                  ) : items.length > 0 ? (
                    items.map((item) => (
                      <div key={item._id} className="relative flex items-center gap-3 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm group hover:border-fuchsia-300 dark:hover:border-fuchsia-700/50 transition-colors">
                        <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800">
                          <Image 
                            src={item.image || "/placeholder.png"} 
                            alt={item.title} 
                            fill 
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-semibold text-[#741052] dark:text-fuchsia-400">Rs {type === 'menu' ? (item as MenuItem).price : (item as PlatterItem).basePrice}</p>
                            {item.discountValue && item.discountValue > 0 ? (
                              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-none font-bold">
                                -{item.discountValue}{item.discountType === 'percentage' ? '%' : ' Rs'}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-4 text-center text-sm text-neutral-500">No products in this category.</div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default function BulkDiscountManagement({
  menuItems,
  platterItems,
  refreshData,
  isLoading
}: BulkDiscountManagementProps) {
  const { toast } = useToast();

  // Checkout Discount State
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutDiscountConfig>({
    isActive: false,
    discountType: 'percentage',
    discountValue: 0,
    minOrderAmount: 0,
    label: 'Checkout Discount'
  });
  const [loadingCheckoutConfig, setLoadingCheckoutConfig] = useState(true);
  const [savingCheckoutConfig, setSavingCheckoutConfig] = useState(false);

  // Whole Catalog Bulk Discount State
  const [wholeDiscountType, setWholeDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [wholeDiscountValue, setWholeDiscountValue] = useState<number | ''>('');
  const [isUpdatingWhole, setIsUpdatingWhole] = useState(false);

  // Accordion Category Toggles
  const [openMenuCategory, setOpenMenuCategory] = useState<string | null>(null);
  const [openPlatterCategory, setOpenPlatterCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Checkout Discount Configuration
  const fetchCheckoutConfig = useCallback(async () => {
    try {
      setLoadingCheckoutConfig(true);
      const res = await fetch('/api/discount-config');
      if (res.ok) {
        const data = await res.json();
        setCheckoutConfig({
          _id: data._id,
          isActive: Boolean(data.isActive),
          discountType: data.discountType || 'percentage',
          discountValue: data.discountValue || 0,
          minOrderAmount: data.minOrderAmount || 0,
          label: data.label || 'Checkout Discount'
        });
      }
    } catch (err) {
      console.error('Failed to load checkout discount config:', err);
    } finally {
      setLoadingCheckoutConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckoutConfig();
  }, [fetchCheckoutConfig]);

  // Save / Update Checkout Discount
  const handleSaveCheckoutDiscount = async (overrideActive?: boolean) => {
    setSavingCheckoutConfig(true);
    const newIsActive = overrideActive !== undefined ? overrideActive : checkoutConfig.isActive;

    try {
      const res = await fetch('/api/discount-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...checkoutConfig,
          isActive: newIsActive,
          discountValue: Number(checkoutConfig.discountValue) || 0,
          minOrderAmount: Number(checkoutConfig.minOrderAmount) || 0
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCheckoutConfig((prev) => ({ ...prev, ...data.config }));
        toast({
          title: newIsActive ? 'Checkout Discount Activated' : 'Checkout Discount Updated',
          description: newIsActive
            ? `Active: ${checkoutConfig.discountValue}${checkoutConfig.discountType === 'percentage' ? '%' : ' Rs'} off at checkout.`
            : 'Checkout discount settings saved successfully.'
        });
      } else {
        throw new Error('Failed to save discount configuration');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Could not save checkout discount',
        variant: 'destructive'
      });
    } finally {
      setSavingCheckoutConfig(false);
    }
  };

  // Toggle Checkout Discount Active/Inactive
  const handleToggleCheckoutActive = async () => {
    const nextState = !checkoutConfig.isActive;
    if (nextState && (!checkoutConfig.discountValue || Number(checkoutConfig.discountValue) <= 0)) {
      toast({
        title: 'Discount Value Required',
        description: 'Please set a discount value greater than 0 before activating.',
        variant: 'destructive'
      });
      return;
    }
    setCheckoutConfig((prev) => ({ ...prev, isActive: nextState }));
    await handleSaveCheckoutDiscount(nextState);
  };

  // Apply Bulk Discount to Whole Catalog (All Menu Items & Platters)
  const handleApplyWholeCatalogDiscount = async () => {
    if (wholeDiscountValue === '' || Number(wholeDiscountValue) <= 0) {
      toast({
        title: 'Invalid Value',
        description: 'Please enter a valid discount amount for all items.',
        variant: 'destructive'
      });
      return;
    }

    setIsUpdatingWhole(true);
    try {
      const res = await fetch('/api/bulkUpdateCategoryDiscount', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'all',
          type: 'all',
          discountType: wholeDiscountType,
          discountValue: Number(wholeDiscountValue)
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: 'Storewide Discount Applied!',
          description: `Applied ${wholeDiscountValue}${wholeDiscountType === 'percentage' ? '%' : ' Rs'} discount to ${data.modifiedCount} items and platters.`
        });
        setWholeDiscountValue('');
        await refreshData();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update storewide items');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to apply storewide discount',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingWhole(false);
    }
  };

  // Remove All Item-Level & Platter Discounts Across the Entire Catalog
  const handleRemoveWholeCatalogDiscount = async () => {
    setIsUpdatingWhole(true);
    try {
      const res = await fetch('/api/bulkUpdateCategoryDiscount', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'all',
          type: 'all',
          discountType: 'percentage',
          discountValue: 0
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: 'Discounts Cleared',
          description: `Removed item-level discounts from ${data.modifiedCount} items and platters.`
        });
        await refreshData();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to clear item discounts');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove storewide discounts',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingWhole(false);
    }
  };

  // Group Menu Items
  const menuCategories = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    menuItems.forEach((item) => {
      const catName = item.category || (item as any).platterCategory || 'Uncategorized';
      if (!map.has(catName)) map.set(catName, []);
      map.get(catName)!.push(item);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [menuItems]);

  // Group Platter Items
  const platterCategories = useMemo(() => {
    const map = new Map<string, PlatterItem[]>();
    platterItems.forEach((item) => {
      const catName = item.platterCategory || (item as any).category || 'Uncategorized';
      if (!map.has(catName)) map.set(catName, []);
      map.get(catName)!.push(item);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [platterItems]);

  // Derive Statistics of Live Discounts
  const liveDiscountStats = useMemo(() => {
    const discountedMenuItems = menuItems.filter((i) => i.discountValue && i.discountValue > 0);
    const discountedPlatters = platterItems.filter((i) => i.discountValue && i.discountValue > 0);
    const totalDiscountedProducts = discountedMenuItems.length + discountedPlatters.length;
    const totalProducts = menuItems.length + platterItems.length;

    // Categories with discounts
    const discountedMenuCategories = menuCategories
      .filter(([_, items]) => items.some((i) => i.discountValue && i.discountValue > 0))
      .map(([name]) => name);

    const discountedPlatterCategories = platterCategories
      .filter(([_, items]) => items.some((i) => i.discountValue && i.discountValue > 0))
      .map(([name]) => name);

    const hasAnyLiveDiscount =
      checkoutConfig.isActive ||
      totalDiscountedProducts > 0 ||
      discountedMenuCategories.length > 0 ||
      discountedPlatterCategories.length > 0;

    return {
      totalDiscountedProducts,
      totalProducts,
      discountedMenuCategories,
      discountedPlatterCategories,
      hasAnyLiveDiscount
    };
  }, [menuItems, platterItems, menuCategories, platterCategories, checkoutConfig.isActive]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshData(), fetchCheckoutConfig()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isDataLoading = isLoading || isRefreshing;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#741052] to-[#d0269b] flex items-center justify-center text-white shadow-md shadow-fuchsia-500/20">
              <Tag className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Discount & Promotion Center
            </h2>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 pl-11">
            Control checkout discounts on whole cart orders, storewide promotions, and category-level pricing.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isDataLoading}
          className="h-10 px-4 gap-2 rounded-xl border-neutral-200 dark:border-neutral-800 self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isDataLoading ? 'animate-spin' : ''}`} />
          {isDataLoading ? 'Syncing...' : 'Sync Discounts'}
        </Button>
      </div>

      {/* 🟢 LIVE ACTIVE DISCOUNTS DASHBOARD MONITOR */}
      <Card
        className={`border-2 transition-all duration-300 rounded-3xl overflow-hidden shadow-md ${
          liveDiscountStats.hasAnyLiveDiscount
            ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-white to-fuchsia-500/5 dark:from-emerald-950/20 dark:via-neutral-900 dark:to-fuchsia-950/20'
            : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900'
        }`}
      >
        <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                  liveDiscountStats.hasAnyLiveDiscount
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                }`}
              >
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold">Live Store Discounts Monitor</CardTitle>
                  {liveDiscountStats.hasAnyLiveDiscount ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-2.5 py-0.5 animate-pulse">
                      ● LIVE DISCOUNTS ACTIVE
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-neutral-500 border-neutral-300 text-xs">
                      No Live Discounts
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  Real-time visibility of all checkout discounts, promotional deals, and category markdowns.
                </CardDescription>
              </div>
            </div>

            {liveDiscountStats.hasAnyLiveDiscount && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (confirm('Are you sure you want to clear all active discounts (checkout discount + all item discounts)?')) {
                      await handleSaveCheckoutDiscount(false);
                      await handleRemoveWholeCatalogDiscount();
                    }
                  }}
                  className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30 gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All Live Discounts
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Live Checkout Discount Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                checkoutConfig.isActive
                  ? 'bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-950/30 dark:border-emerald-700/50 shadow-sm'
                  : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Checkout / Cart Discount
                </span>
                {checkoutConfig.isActive ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-neutral-400">INACTIVE</span>
                )}
              </div>
              <div className="mt-1">
                {checkoutConfig.isActive ? (
                  <div className="space-y-1">
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                      {checkoutConfig.discountValue}
                      {checkoutConfig.discountType === 'percentage' ? '%' : ' Rs'} OFF
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                      Label: <span className="font-semibold text-neutral-900 dark:text-white">{checkoutConfig.label}</span>
                    </p>
                    {checkoutConfig.minOrderAmount > 0 ? (
                      <p className="text-[11px] text-neutral-500">
                        Min. Order: Rs. {checkoutConfig.minOrderAmount}
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        Applies to all order subtotals
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 mt-2">
                    No discount applied at checkout. Enable it below to offer whole-cart discounting.
                  </p>
                )}
              </div>
            </div>

            {/* Live Product Markdowns Card */}
            <div className="p-4 rounded-2xl border bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Discounted Catalog Items
                </span>
                {liveDiscountStats.totalDiscountedProducts > 0 ? (
                  <span className="text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/50 px-2 py-0.5 rounded-full">
                    {liveDiscountStats.totalDiscountedProducts} on sale
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-400">0 on sale</span>
                )}
              </div>
              <div className="mt-1 space-y-1">
                <p className="text-xl font-black text-neutral-900 dark:text-white">
                  {liveDiscountStats.totalDiscountedProducts}
                  <span className="text-xs font-normal text-neutral-500 ml-1.5">
                    / {liveDiscountStats.totalProducts} total items
                  </span>
                </p>
                <p className="text-xs text-neutral-500">
                  {liveDiscountStats.totalDiscountedProducts > 0
                    ? `${Math.round((liveDiscountStats.totalDiscountedProducts / (liveDiscountStats.totalProducts || 1)) * 100)}% of store menu discounted`
                    : 'Standard base pricing across all products'}
                </p>
              </div>
            </div>

            {/* Active Categories Summary Card */}
            <div className="p-4 rounded-2xl border bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  Active Category Deals
                </span>
                <span className="text-[11px] font-semibold text-neutral-500">
                  {liveDiscountStats.discountedMenuCategories.length +
                    liveDiscountStats.discountedPlatterCategories.length}{' '}
                  Categories
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                {liveDiscountStats.discountedMenuCategories.length === 0 &&
                liveDiscountStats.discountedPlatterCategories.length === 0 ? (
                  <p className="text-xs text-neutral-400 mt-1">No active category promotions.</p>
                ) : (
                  <>
                    {liveDiscountStats.discountedMenuCategories.map((c) => (
                      <Badge
                        key={`m-${c}`}
                        variant="secondary"
                        className="text-[10px] bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300"
                      >
                        {c}
                      </Badge>
                    ))}
                    {liveDiscountStats.discountedPlatterCategories.map((c) => (
                      <Badge
                        key={`p-${c}`}
                        variant="secondary"
                        className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      >
                        {c}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⚡ SECTION 1: GLOBAL CHECKOUT & CART DISCOUNT CONTROL */}
      <Card className="border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-fuchsia-50/70 via-pink-50/40 to-white dark:from-neutral-900 dark:via-neutral-900/80 dark:to-neutral-900/40 border-b border-neutral-100 dark:border-neutral-800 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#741052] to-[#d0269b] flex items-center justify-center text-white shadow-md shadow-fuchsia-500/25">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold">Checkout / Cart Discount</CardTitle>
                  <Badge
                    variant={checkoutConfig.isActive ? 'default' : 'secondary'}
                    className={
                      checkoutConfig.isActive
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs'
                        : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                    }
                  >
                    {checkoutConfig.isActive ? 'ENABLED ON CHECKOUT' : 'DISABLED'}
                  </Badge>
                </div>
                <CardDescription className="text-sm mt-0.5">
                  Applies a direct discount on the whole customer cart subtotal at the checkout page.
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleToggleCheckoutActive}
              disabled={savingCheckoutConfig || loadingCheckoutConfig}
              className={`h-11 px-5 rounded-2xl font-bold transition-all shadow-sm ${
                checkoutConfig.isActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20'
              }`}
            >
              {savingCheckoutConfig ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : checkoutConfig.isActive ? (
                <ShieldAlert className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {checkoutConfig.isActive ? 'Disable Checkout Discount' : 'Enable Checkout Discount'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Discount Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Discount Type
              </label>
              <Select
                value={checkoutConfig.discountType}
                onValueChange={(val: 'percentage' | 'fixed') =>
                  setCheckoutConfig((prev) => ({ ...prev, discountType: val }))
                }
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-fuchsia-600" /> Percentage (%)
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" /> Fixed Amount (Rs)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Value */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Discount Value {checkoutConfig.discountType === 'percentage' ? '(%)' : '(Rs)'}
              </label>
              <Input
                type="number"
                min="0"
                placeholder={checkoutConfig.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 200'}
                value={checkoutConfig.discountValue || ''}
                onChange={(e) =>
                  setCheckoutConfig((prev) => ({
                    ...prev,
                    discountValue: e.target.value ? Number(e.target.value) : 0
                  }))
                }
                className="h-11 rounded-xl"
              />
            </div>

            {/* Min Order Subtotal */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Min. Cart Subtotal (Rs)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="0 (No minimum)"
                value={checkoutConfig.minOrderAmount || ''}
                onChange={(e) =>
                  setCheckoutConfig((prev) => ({
                    ...prev,
                    minOrderAmount: e.target.value ? Number(e.target.value) : 0
                  }))
                }
                className="h-11 rounded-xl"
              />
            </div>

            {/* Campaign Label */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Display Label on Checkout
              </label>
              <Input
                type="text"
                placeholder="e.g. Special Discount"
                value={checkoutConfig.label}
                onChange={(e) =>
                  setCheckoutConfig((prev) => ({ ...prev, label: e.target.value }))
                }
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Checkout Preview & Save CTA */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shrink-0">
                <Sparkles className="h-4 w-4 text-fuchsia-600" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-neutral-900 dark:text-white">Customer Checkout Preview: </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {checkoutConfig.isActive && Number(checkoutConfig.discountValue) > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                      {checkoutConfig.label} ({checkoutConfig.discountValue}
                      {checkoutConfig.discountType === 'percentage' ? '%' : ' Rs'}) — -Rs.{' '}
                      {checkoutConfig.discountType === 'percentage'
                        ? (1000 * (checkoutConfig.discountValue / 100)).toFixed(2)
                        : Number(checkoutConfig.discountValue).toFixed(2)}{' '}
                      on Rs. 1,000 subtotal
                    </span>
                  ) : (
                    <span className="text-neutral-400 italic ml-1">
                      No discount shown on checkout (0% deduction)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => handleSaveCheckoutDiscount()}
              disabled={savingCheckoutConfig}
              className="h-10 px-6 rounded-xl bg-gradient-to-r from-[#741052] to-[#d0269b] hover:opacity-90 text-white font-bold shadow-md shadow-fuchsia-500/20"
            >
              {savingCheckoutConfig ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Save Checkout Discount Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 🏷️ SECTION 2: STOREWIDE BULK DISCOUNT (ALL PRODUCTS & PLATTERS) */}
      <Card className="border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white dark:from-neutral-900 dark:via-neutral-900/80 dark:to-neutral-900/40 border-b border-neutral-100 dark:border-neutral-800 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Storewide Catalog Bulk Discount</CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  Apply or remove promotional discounts to all menu items and platters across the entire catalog simultaneously.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-end gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Discount Type
              </label>
              <Select
                value={wholeDiscountType}
                onValueChange={(val: 'percentage' | 'fixed') => setWholeDiscountType(val)}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-fuchsia-600" /> Percentage (%)
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" /> Fixed Amount (Rs)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Discount Value
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 15"
                value={wholeDiscountValue}
                onChange={(e) =>
                  setWholeDiscountValue(e.target.value ? Number(e.target.value) : '')
                }
                className="h-11 rounded-xl"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleApplyWholeCatalogDiscount}
                disabled={isUpdatingWhole}
                className="flex-1 sm:flex-none h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20"
              >
                {isUpdatingWhole ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Apply to ALL Items ({liveDiscountStats.totalProducts})
              </Button>

              {liveDiscountStats.totalDiscountedProducts > 0 && (
                <Button
                  variant="outline"
                  onClick={handleRemoveWholeCatalogDiscount}
                  disabled={isUpdatingWhole}
                  className="h-11 px-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20 rounded-xl font-semibold"
                  title="Remove all discounts from all catalog items"
                >
                  {isUpdatingWhole ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Trash2 className="h-4 w-4" />
                      <span>Clear All Items</span>
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📂 SECTION 3: CATEGORY-BY-CATEGORY BULK DISCOUNTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Menu Items Categories */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 px-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                Menu Item Categories
              </h3>
              <Badge
                variant="secondary"
                className="rounded-full bg-fuchsia-50 text-[#741052] dark:bg-fuchsia-900/30 dark:text-fuchsia-300 font-bold"
              >
                {menuCategories.length} Categories
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {isDataLoading && menuCategories.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCategoryCard key={i} />)
            ) : menuCategories.length > 0 ? (
              menuCategories.map(([categoryName, items]) => (
                <CategoryDiscountCard
                  key={`menu-${categoryName}`}
                  categoryName={categoryName}
                  items={items}
                  type="menu"
                  refreshData={refreshData}
                  isOpen={openMenuCategory === categoryName}
                  onToggle={() =>
                    setOpenMenuCategory(openMenuCategory === categoryName ? null : categoryName)
                  }
                  isLoading={isDataLoading}
                />
              ))
            ) : (
              <div className="p-12 text-center text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                <Tag className="h-8 w-8 mx-auto mb-3 text-neutral-300" />
                <p className="font-medium">No menu categories found.</p>
                <p className="text-xs text-neutral-400 mt-1">Try syncing or check if you have items with categories.</p>
              </div>
            )}
          </div>
        </section>

        {/* Platter Items Categories */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 px-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                Platter Categories
              </h3>
              <Badge
                variant="secondary"
                className="rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold"
              >
                {platterCategories.length} Categories
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {isDataLoading && platterCategories.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCategoryCard key={i} />)
            ) : platterCategories.length > 0 ? (
              platterCategories.map(([categoryName, items]) => (
                <CategoryDiscountCard
                  key={`platter-${categoryName}`}
                  categoryName={categoryName}
                  items={items}
                  type="platter"
                  refreshData={refreshData}
                  isOpen={openPlatterCategory === categoryName}
                  onToggle={() =>
                    setOpenPlatterCategory(openPlatterCategory === categoryName ? null : categoryName)
                  }
                  isLoading={isDataLoading}
                />
              ))
            ) : (
              <div className="p-12 text-center text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                <Tag className="h-8 w-8 mx-auto mb-3 text-neutral-300" />
                <p className="font-medium">No platter categories found.</p>
                <p className="text-xs text-neutral-400 mt-1">Try syncing or check if you have platters with categories.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
