'use client';

import { useMemo } from 'react';

// Curated high-impact fallback dishes reflecting authentic CLK menu specialties
const FALLBACK_DISHES: string[] = [
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

const MAX_DISH_NAME_LENGTH = 28;
const MAX_ROTATING_ITEMS = 12;
const CACHE_STORAGE_KEY = 'clk_rotating_placeholder_dishes';

// Module-level in-memory cache to prevent duplicate computation across re-renders
let inMemoryCachedDishes: string[] | null = null;

export interface CatalogItemLike {
  id?: string | number;
  title?: string;
  name?: string;
  category?: string;
  platterCategory?: string;
  status?: string;
  isPlatter?: boolean;
  discountValue?: number;
}

/**
 * Extracts and caches a varied, representative list of 8-12 dish names for the animated search placeholder.
 * Prioritizes popular/discounted dishes and ensures 1 representative item per visible category.
 */
export function useRotatingPlaceholderDishes(
  menuItems?: CatalogItemLike[],
  platters?: CatalogItemLike[]
): string[] {
  return useMemo(() => {
    // 1. If we have in-memory cached results and no new items passed, return cache
    if (inMemoryCachedDishes && inMemoryCachedDishes.length > 0 && (!menuItems || menuItems.length === 0)) {
      return inMemoryCachedDishes;
    }

    // 2. Try reading from sessionStorage if in browser
    if (typeof window !== 'undefined' && (!menuItems || menuItems.length === 0)) {
      try {
        const stored = sessionStorage.getItem(CACHE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length >= 4) {
            inMemoryCachedDishes = parsed;
            return parsed;
          }
        }
      } catch {
        // Ignore session storage errors
      }
    }

    const allItems: CatalogItemLike[] = [
      ...(menuItems || []),
      ...(platters || []),
    ];

    if (allItems.length === 0) {
      return inMemoryCachedDishes || FALLBACK_DISHES;
    }

    // 3. Filter valid candidate items
    const validCandidates = allItems.filter((item) => {
      const name = (item.title || item.name || '').trim();
      if (!name) return false;
      if (name.length > MAX_DISH_NAME_LENGTH) return false;
      if (item.status === 'out of stock') return false;
      return true;
    });

    if (validCandidates.length === 0) {
      return inMemoryCachedDishes || FALLBACK_DISHES;
    }

    const selectedDishes: string[] = [];
    const usedNames = new Set<string>();

    // 4. Priority 1: Pick items with active discounts or marked popular
    const highPriorityItems = validCandidates.filter(
      (item) => (item.discountValue && item.discountValue > 0)
    );

    for (const item of highPriorityItems) {
      const name = (item.title || item.name || '').trim();
      if (!usedNames.has(name.toLowerCase()) && selectedDishes.length < 4) {
        selectedDishes.push(name);
        usedNames.add(name.toLowerCase());
      }
    }

    // 5. Priority 2: One representative dish per category to ensure wide menu variety
    const itemsByCategory = new Map<string, CatalogItemLike[]>();
    validCandidates.forEach((item) => {
      const cat = (item.category || item.platterCategory || 'General').trim();
      if (!itemsByCategory.has(cat)) {
        itemsByCategory.set(cat, []);
      }
      itemsByCategory.get(cat)!.push(item);
    });

    itemsByCategory.forEach((items) => {
      if (selectedDishes.length >= MAX_ROTATING_ITEMS) return;
      for (const item of items) {
        const name = (item.title || item.name || '').trim();
        if (!usedNames.has(name.toLowerCase())) {
          selectedDishes.push(name);
          usedNames.add(name.toLowerCase());
          break;
        }
      }
    });

    // 6. If we have fewer than 8 items, fill in remaining valid candidate items
    if (selectedDishes.length < 8) {
      for (const item of validCandidates) {
        if (selectedDishes.length >= MAX_ROTATING_ITEMS) break;
        const name = (item.title || item.name || '').trim();
        if (!usedNames.has(name.toLowerCase())) {
          selectedDishes.push(name);
          usedNames.add(name.toLowerCase());
        }
      }
    }

    // 7. If still empty, fall back to default curated list
    const finalList = selectedDishes.length >= 4 ? selectedDishes : FALLBACK_DISHES;

    // Cache the resolved list
    inMemoryCachedDishes = finalList;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(finalList));
      } catch {
        // Ignore session storage errors
      }
    }

    return finalList;
  }, [menuItems, platters]);
}
