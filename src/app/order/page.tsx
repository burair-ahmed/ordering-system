/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect, useRef } from "react";
import MenuItem from "../components/MenuItem";
import PlatterItem from "../components/PlatterItem";  // Assuming you have a PlatterItem component
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
  status: "in stock" | "out of stock";
}

interface Variation {
  name: string;
  price: string;
}

interface Platter {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  image: string;
  platterCategory: string;  // New field for platter category
  status: "in stock" | "out of stock";
  categories: Category[];
  additionalChoices: AdditionalChoice[];
}

interface CategoryOption {
  uuid: string;
  name: string;
  title: string;
  price: number;
}

interface Category {
  categoryName: string;
  options: CategoryOption[];
}
interface AdditionalChoice {
  heading: string;
  options: CategoryOption[];
}

const defaultPlatterCategoryOrder = [
  "Sharing Platters","BBQ Deals","Fast Food Deals",
  
];


const icecreamgola = "Ice Cream and Gola";
const defaultMenuCategoryOrder = [
  "Pulao.com", "Soup","Chinese","Beast BBQ","Rolls Royce","Flavoured Feast","Burger-E-Karachi", icecreamgola,"Waffles","Mini Pancakes","Chicken Karahis","Mutton Karahis","Handi and Qeema","Marvellous Matka Biryani Chicken/Beef","Charming Chai","Paratha Performance","Very Fast Food","Shawarmania","French Boys Fries","Rice","Dashing Desserts","Beverages","Juicy Lucy","Roti Shoti","Very Extra"
];

export default function MenuPage() {
  const [menu, setMenu] = useState<{ [key: string]: MenuItemData[] }>({});
  const [platters, setPlatters] = useState<{ [key: string]: Platter[] }>({});  
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<{ [key: string]: number }>({});
  const [hasMore, setHasMore] = useState<{ [key: string]: boolean }>({});

  // Separate category orders for menu items and platters
  const [platterCategoryOrder] = useState<string[]>(defaultPlatterCategoryOrder);
  const [menuCategoryOrder] = useState<string[]>(defaultMenuCategoryOrder);

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const fetchPlatters = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/platter");
        if (!response.ok) {
          throw new Error("Failed to fetch platters");
        }
        const data: Platter[] = await response.json();
  
        // Group platters by their platterCategory
        const groupedPlatters: { [key: string]: Platter[] } = data.reduce((acc, platter) => {
          const category = platter.platterCategory;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(platter);
          return acc;
        }, {} as { [key: string]: Platter[] });
  
        setPlatters(groupedPlatters);
      } catch (err) {
        console.error("Error fetching platters:", err);
      } finally {
        setLoading(false);
      }
    };
  
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
          [category]: [...(prevMenu[category] || []), ...data],
        }));
  
        setPage((prevPage) => ({
          ...prevPage,
          [category]: currentPage + 1,
        }));
  
        setHasMore((prevHasMore) => ({
          ...prevHasMore,
          [category]: data.length === 10,
        }));
      } catch (err) {
        console.error("Error fetching menu items:", err);
      } finally {
        setLoading(false);
      }
    };
  
    const fetchData = async () => {
      await fetchPlatters(); 
  
      // Then fetch menu items by category
      for (const category of menuCategoryOrder) {
        await fetchMenu(category);
      }
    };
  
    fetchData(); 
  }, [menuCategoryOrder, platterCategoryOrder]);
  

  const lastMenuItemRef = (category: string, node: HTMLDivElement | null) => {
    if (loading || !hasMore[category]) return;
    if (observer.current) observer.current.disconnect();

    if (node) {
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => ({
            ...prevPage,
            [category]: (prevPage[category] || 1) + 1,
          }));
        }
      });

      observer.current.observe(node);
    }
  };
  return (
    <div className="bg-white text-black">
      <Hero />
      <div className="flex justify-center mt-4 gap-4">
      </div>

      {/* Platters First */}
      <div>
        {platterCategoryOrder.map((category) => {
          const filteredPlatters = platters[category] || [];
          return (
            <div key={category} className="mt-8">
              <div className="w-full flex justify-center mb-4">
                <h1 className="text-3xl font-semibold text-white bg-gradient-to-r from-[#741052] to-[#d0269b] shadow-lg hover:shadow-pink-500/40 py-3 px-6 rounded-lg shadow-md text-center">
                  {category}
                </h1>
              </div>
              <div className="grid grid-cols-2 gap-4 pr-6 pl-1 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
                {loading && filteredPlatters.length === 0 ? (
                  [...Array(4)].map((_, i) => <SkeletonLoader key={i} />)
                ) : (
                  filteredPlatters.map((platter) => (
                    <div key={uuidv4()}>
                      <PlatterItem platter={platter} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Menu Items Below Platters */}
      <div>
        {menuCategoryOrder.map((category) => {
          const filteredItems = menu[category] || [];
          return (
            <div key={category} className="mt-8">
              <div className="w-full flex justify-center mb-4">
                <h1 className="text-3xl font-semibold text-white bg-[#741052] py-3 px-6 rounded-lg shadow-md text-center">
                  {category}
                </h1>
              </div>
              <div className="grid grid-cols-2 gap-4 pr-6 pl-1 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
                {loading && filteredItems.length === 0 ? (
                  [...Array(4)].map((_, i) => <SkeletonLoader key={i} />)
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
    </div>
  );
}
