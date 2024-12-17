'use client';

import { useState, useEffect, useRef } from "react";
import MenuItem from "../components/MenuItem";
import Hero from "../components/Hero";
import { v4 as uuidv4 } from 'uuid';
import SkeletonLoader from "../components/SkeletonLoader";

interface MenuItemData {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  variations: Variation[];
  category: string;
}

interface Variation {
  name: string;
  price: string;
}

// Define the fixed order of categories
const orderedCategories = [
  "Sharing Platters",
  "BBQ Deals",
  "Fast Food Deals",
  "Soup",
  "Gravy",
  "Beast BBQ",
  "Rolls Royce",
  "Woodfired Pizza",
  "Burger-E-Karachi",
  "Chicken Karahis",
  "Mutton Karahis",
  "Handi and Qeema",
  "Marvellous Matka Biryani Chicken/Beef",
  "Charming Chai",
  "Paratha Performance",
  "Very Fast Food",
  "Shawarmania",
  "French Boys Fries",
  "Rice",
  "Dashing Desserts",
  "Beverages",
  "Juicy Lucy",
  "Very Extra"
];

export default function MenuPage() {
  const [menu, setMenu] = useState<{ [key: string]: MenuItemData[] }>({}); // Object to store menu items by category
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<{ [key: string]: number }>({});  // Track the current page for each category
  const [hasMore, setHasMore] = useState<{ [key: string]: boolean }>({}); // Track if more items exist for each category

  const observer = useRef<IntersectionObserver | null>(null); // Ref for the IntersectionObserver

  useEffect(() => {
    const fetchMenu = async (category: string) => {
      setLoading(true);
      const currentPage = page[category] || 1;
      const hasMoreItems = hasMore[category] ?? true;

      if (!hasMoreItems) return;

      try {
        const response = await fetch(`/api/getitems?page=${currentPage}&limit=10&category=${category}`);
        if (!response.ok) {
          throw new Error("Failed to fetch menu items");
        }
        const data: MenuItemData[] = await response.json();

        setMenu((prevMenu) => ({
          ...prevMenu,
          [category]: [...(prevMenu[category] || []), ...data], // Append new items to existing ones for the category
        }));

        setPage((prevPage) => ({
          ...prevPage,
          [category]: currentPage + 1, // Increment page for the category
        }));

        // Check if there are more items to load
        setHasMore((prevHasMore) => ({
          ...prevHasMore,
          [category]: data.length === 10, // If we received less than 10, there are no more items
        }));
      } catch (err) {
        console.error("Error fetching menu items:", err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch menu for each category on initial render
    orderedCategories.forEach((category) => {
      fetchMenu(category);
    });
  }, []);  // Only run once when component mounts

  const lastMenuItemRef = (category: string, node: HTMLDivElement | null) => {
    if (loading || !hasMore[category]) return; // Prevent loading if already loading or no more items
    if (observer.current) observer.current.disconnect(); // Disconnect the previous observer
  
    // Add null check before observing the node
    if (node) {
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => ( {
            ...prevPage,
            [category]: (prevPage[category] || 1) + 1, // Increment page when last item is in view
          }));
        }
      });
  
      observer.current.observe(node); // Start observing the last item in the list
    }
  };

  return (
    <div className="bg-white text-black">
      {/* Hero component */}
      <Hero />

      {/* Menu items with loading state */}
      <div>
        {orderedCategories.map((category) => {
          const filteredItems = menu[category] || [];

          return (
            <div key={category} className="mt-8">
              <div className="w-full flex justify-center mb-4">
                <h1 className="text-3xl font-semibold text-white bg-[#741052] py-3 px-6 rounded-lg shadow-md text-center">
                  {category}
                </h1>
              </div>
              <div className="grid grid-cols-2 gap-4 pr-6 pl-1 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
  {/* Display skeleton loaders if the menu is still loading */}
  {loading && filteredItems.length === 0 ? (
    [...Array(4)].map((_, i) => (
      <SkeletonLoader key={i} />
    ))
  ) : (
    filteredItems.map((item, index) => (
      <div
        ref={index === filteredItems.length - 1 ? (node) => lastMenuItemRef(category, node) : null}
        key={uuidv4()}
      >
        <MenuItem item={item} />
      </div>
    ))
  )}
</div>

            </div>
          );
        })}
      </div>

      {/* Skeleton Loader */}
      {loading && (
        <div>
          {orderedCategories.map((category, index) => (
            <div key={index} className="mt-8">
              <div className="w-full flex justify-center mb-4">
                <div className="bg-gray-300 w-1/2 h-10 rounded-lg animate-pulse"></div> {/* Skeleton heading */}
              </div>
              <div className="grid grid-cols-2 gap-4 w-11/12 mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
                {[...Array(4)].map((_, i) => (
                  <SkeletonLoader key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error handling */}
      {menu && Object.keys(menu).length === 0 && !loading && <div className="text-red-500">No menu items found.</div>}
    </div>
  );
}
