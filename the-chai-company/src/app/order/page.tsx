
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hero from "../components/Hero";
import BestSeller from "../components/BestSeller";
import FeaturedSlider from "../components/FeaturedSlider";
import CategorySection from "../components/CategorySection";
import SkeletonLoader from "../components/SkeletonLoader";

// Interfaces
interface MenuItemData {
  id: number;
  _id?: string;
  title: string;
  description: string;
  price: number;
  image: string;
  variations: any[];
  category: string;
  status: "in stock" | "out of stock";
}

interface Platter {
  id: string;
  _id?: string;
  title: string;
  description: string;
  basePrice: number;
  image: string;
  platterCategory: string;
  status: "in stock" | "out of stock";
  categories: any[];
  additionalChoices: any[];
}

interface PageSection {
  id: string;
  type: 'best-seller' | 'featured' | 'slider' | 'grid';
  title: string;
  isVisible: boolean;
  props: {
    sourceType?: 'category' | 'manual'; 
    categoryId?: string; 
    itemIds?: string[];
  };
}

export default function MenuPage() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Data Stores
  const [itemsByCat, setItemsByCat] = useState<{ [key: string]: any[] }>({});
  const [itemsById, setItemsById] = useState<{ [key: string]: any }>({});
  
  // Loading States
  const [loadingCats, setLoadingCats] = useState<{ [key: string]: boolean }>({});
  const [hasMoreCats, setHasMoreCats] = useState<{ [key: string]: boolean }>({});
  const [pageCats, setPageCats] = useState<{ [key: string]: number }>({});

  // Fetch Config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/page-config");
        const data = await res.json();
        console.log("PageConfig Loaded:", data); // DEBUG LOG
        
        if (data && data.sections) {
          setSections(data.sections);
          
          // Pre-fetch manual items
          const manualIds = new Set<string>();
          data.sections.forEach((s: PageSection) => {
             if (s.props.itemIds) s.props.itemIds.forEach(id => manualIds.add(id));
          });
          
          if (manualIds.size > 0) {
              fetchManualItems(Array.from(manualIds));
          }
        }
      } catch (e) {
        console.error("Config fetch error", e);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const fetchManualItems = async (ids: string[]) => {
      try {
        const res = await fetch("/api/get-items-by-ids", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ids })
        });
        const items = await res.json();
        const itemMap: any = {};
        items.forEach((i: any) => itemMap[i._id] = i);
        setItemsById(prev => ({ ...prev, ...itemMap }));
      } catch (e) {
          console.error("Failed to fetch manual items", e);
      }
  };


  const [allPlattersFetched, setAllPlattersFetched] = useState(false);

  // Constants
  const PLATTER_CATEGORIES = ["CLK Deals","Meal Boxes","Sharing Platters","BBQ Deals","Fast Food Deals"];

  // Category Loader
  const loadCategory = async (category: string) => {
      // Check if it's a platter category
      const isPlatterCat = PLATTER_CATEGORIES.includes(category);

      if (isPlatterCat) {
          if (allPlattersFetched) return; // Already have them
          // Fetch ALL platters once
          setLoadingCats(prev => ({ ...prev, [category]: true }));
          try {
              const res = await fetch("/api/platter");
              const data: Platter[] = await res.json();
              
              // Group by category and update state
              const grouped: {[key: string]: Platter[]} = {};
              PLATTER_CATEGORIES.forEach(c => grouped[c] = []); // Init
              
              data.forEach(p => {
                  if (grouped[p.platterCategory]) {
                      grouped[p.platterCategory].push(p);
                  }
              });

              setItemsByCat(prev => ({ ...prev, ...grouped }));
              setAllPlattersFetched(true);
          } catch(e) {
              console.error("Platter fetch error", e);
          } finally {
              // Clear loading for ALL platter categories since we tried fetching them
              const updates: any = {};
              PLATTER_CATEGORIES.forEach(c => updates[c] = false);
              setLoadingCats(prev => ({ ...prev, ...updates }));
          }
          return;
      }

      // Standard Menu Item loading
      if (loadingCats[category]) return;
      
      setLoadingCats(prev => ({ ...prev, [category]: true }));
      try {
          const page = pageCats[category] || 1;
          const res = await fetch(`/api/getitems?page=${page}&limit=10&category=${category}`);
          const data = await res.json();
          
          if (data && data.length > 0) {
             setItemsByCat(prev => ({
                 ...prev,
                 [category]: [...(prev[category] || []), ...data]
             }));
             setPageCats(prev => ({ ...prev, [category]: page + 1 }));
             setHasMoreCats(prev => ({ ...prev, [category]: data.length === 10 }));
          } else {
             setHasMoreCats(prev => ({ ...prev, [category]: false }));
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingCats(prev => ({ ...prev, [category]: false }));
      }
  };

  // Trigger initial load for visible category sections
  useEffect(() => {
      sections.forEach(s => {
          if (s.type === 'grid' || s.type === 'slider') {
              if (s.props.sourceType === 'category' && s.props.categoryId) {
                  // If not loaded, load
                  if (!itemsByCat[s.props.categoryId]) {
                      loadCategory(s.props.categoryId);
                  }
              }
          }
      });
  }, [sections]);

  const renderSection = (section: PageSection) => {
      if (!section.isVisible) return null;

      if (section.type === 'best-seller') {
          const itemId = section.props.itemIds?.[0];
          const item = itemId ? itemsById[itemId] : null;
          if (!item && !loadingConfig) return null; // Don't show if missing
          return <BestSeller key={section.id} item={item} />;
      }

      if (section.type === 'featured') {
           const items = section.props.itemIds?.map(id => itemsById[id]).filter(Boolean) || [];
           if (items.length === 0) return null;
           return <FeaturedSlider key={section.id} items={items} />;
      }

      if (section.type === 'grid' || section.type === 'slider') {
          let items: any[] = [];
          let hasMore = false;
          let isLoading = false;
          let onLoadMore = undefined;

          if (section.props.sourceType === 'manual') {
              items = section.props.itemIds?.map(id => itemsById[id]).filter(Boolean) || [];
          } else if (section.props.sourceType === 'category' && section.props.categoryId) {
              const cat = section.props.categoryId;
              items = itemsByCat[cat] || [];
              isLoading = loadingCats[cat];
              hasMore = hasMoreCats[cat];
              onLoadMore = () => loadCategory(cat);
              
              // If empty and loading, show skeletons?
          }

          if (items.length === 0 && !isLoading) {
              return (
                  <div key={section.id} className="p-10 text-center text-gray-400">
                      <p>Section "{section.title || section.props.categoryId}" is empty.</p>
                      <p className="text-xs">Category: {section.props.categoryId} | Source: {section.props.sourceType}</p>
                  </div>
              );
          }

          return (
              <CategorySection 
                  key={section.id}
                  title={section.title || section.props.categoryId || "Untitled"}
                  items={items}
                  layout={section.type === 'slider' ? 'slider' : 'grid-4'} // Default to grid 4 for now, add variant support later
                  isLoading={isLoading}
                  hasMore={hasMore}
                  onLoadMore={onLoadMore}
                  isPlatter={PLATTER_CATEGORIES.includes(section.props.categoryId || "")}
              />
          );
      }

      return null;
  };

  return (
    <div className="bg-[#FAF3E6] min-h-screen text-[#2E1C14]">
      <Hero />
      <div className="pb-20">
          {sections.map(section => (
              <div key={section.id}>
                  {renderSection(section)}
              </div>
          ))}
          {loadingConfig && <div className="p-10 text-center">Loading Menu...</div>}
      </div>
    </div>
  );
}
