'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, ChevronDown, Percent, DollarSign, Loader2, Trash2 } from 'lucide-react';
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
  const allSameDiscount = items.every(
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
          discountType: 'percentage', // type doesn't matter when value is 0
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
             <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none px-3 py-1 text-xs">
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
                    className="flex-1 sm:flex-none h-10 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:opacity-90 shadow-sm"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Tag className="h-4 w-4 mr-2" />}
                    Apply
                  </Button>
                  
                  {currentDiscountValue && currentDiscountValue > 0 && (
                     <Button 
                       variant="outline"
                       onClick={handleRemoveDiscount} 
                       disabled={isUpdating}
                       className="h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20"
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
                            src={item.image} 
                            alt={item.title} 
                            fill 
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400">Rs {type === 'menu' ? (item as MenuItem).price : (item as PlatterItem).basePrice}</p>
                            {item.discountValue && item.discountValue > 0 ? (
                              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-none">
                                -{item.discountValue}{item.discountType === 'percentage' ? '%' : 'Rs'}
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

export default function BulkDiscountManagement({ menuItems, platterItems, refreshData, isLoading }: BulkDiscountManagementProps) {
  const [openMenuCategory, setOpenMenuCategory] = useState<string | null>(null);
  const [openPlatterCategory, setOpenPlatterCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Group Menu Items
  const menuCategories = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    menuItems.forEach((item) => {
      // Check both fields for maximum robustness
      const catName = item.category || (item as any).platterCategory || "Uncategorized";
      if (!map.has(catName)) map.set(catName, []);
      map.get(catName)!.push(item);
    });
    // Convert to array and sort
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [menuItems]);

  // Group Platter Items
  const platterCategories = useMemo(() => {
    const map = new Map<string, PlatterItem[]>();
    platterItems.forEach((item) => {
      // Check both fields for maximum robustness
      const catName = item.platterCategory || (item as any).category || "Uncategorized";
      if (!map.has(catName)) map.set(catName, []);
      map.get(catName)!.push(item);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [platterItems]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isDataLoading = isLoading || isRefreshing;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Bulk Discount Management</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Apply percentage or fixed discounts to entire categories of items.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManualRefresh}
          disabled={isDataLoading}
          className="h-10 px-4 gap-2 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <Loader2 className={`h-4 w-4 ${isDataLoading ? 'animate-spin' : ''}`} />
          {isDataLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Menu Items Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 pb-2 px-2 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">Menu Categories</h3>
            <Badge variant="secondary" className="rounded-full bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/20 dark:text-fuchsia-400 border-none font-bold">
              {menuCategories.length}
            </Badge>
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
                  onToggle={() => setOpenMenuCategory(openMenuCategory === categoryName ? null : categoryName)}
                  isLoading={isDataLoading}
                />
              ))
            ) : (
              <div className="p-12 text-center text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                <Tag className="h-8 w-8 mx-auto mb-3 text-neutral-300" />
                <p className="font-medium">No menu categories found.</p>
                <p className="text-xs text-neutral-400 mt-1 text-balance">Try refreshing or check if you have items with categories.</p>
              </div>
            )}
          </div>
        </section>

        {/* Platter Items Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 pb-2 px-2 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">Platter Categories</h3>
            <Badge variant="secondary" className="rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-none font-bold">
              {platterCategories.length}
            </Badge>
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
                  onToggle={() => setOpenPlatterCategory(openPlatterCategory === categoryName ? null : categoryName)}
                  isLoading={isDataLoading}
                />
              ))
            ) : (
              <div className="p-12 text-center text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                <Tag className="h-8 w-8 mx-auto mb-3 text-neutral-300" />
                <p className="font-medium">No platter categories found.</p>
                <p className="text-xs text-neutral-400 mt-1 text-balance">Try refreshing or check if you have platters with categories.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
