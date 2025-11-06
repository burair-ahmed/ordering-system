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
  "CLK Deals","Sharing Platters","BBQ Deals","Fast Food Deals",
];


const defaultMenuCategoryOrder = [
  "Chinese","Beast BBQ","Rolls Royce","Flavoured Feast","Burger-E-Karachi", "Chicken Karahis","Mutton Karahis","Handi and Qeema","Marvellous Matka Biryani Chicken/Beef","Charming Chai","Paratha Performance","Very Fast Food","Shawarmania","French Boys Fries","Rice","Beverages","Juicy Lucy","Roti Shoti","Very Extra"
];

export default function MenuPage() {
  const [menu, setMenu] = useState<{ [key: string]: MenuItemData[] }>({});
  const [platters, setPlatters] = useState<{ [key: string]: Platter[] }>({});  
const [menuLoading, setMenuLoading] = useState<{ [key: string]: boolean }>({});
const [platterLoading, setPlatterLoading] = useState<boolean>(true);
  const [page, setPage] = useState<{ [key: string]: number }>({});
  const [hasMore, setHasMore] = useState<{ [key: string]: boolean }>({});

  // Separate category orders for menu items and platters
  const [platterCategoryOrder] = useState<string[]>(defaultPlatterCategoryOrder);
  const [menuCategoryOrder] = useState<string[]>(defaultMenuCategoryOrder);

const observers = useRef<{[key: string]: IntersectionObserver}>({});

useEffect(() => {
  const fetchPlatters = async () => {
    setPlatterLoading(true);
    try {
      const res = await fetch("/api/platter");
      const data: Platter[] = await res.json();
      const grouped: { [key: string]: Platter[] } = {};

      data.forEach((p) => {
        if (!grouped[p.platterCategory]) grouped[p.platterCategory] = [];
        grouped[p.platterCategory].push(p);
      });

      setPlatters(grouped);
    } finally {
      setPlatterLoading(false);
    }
  };

  const fetchMenuCategory = async (category: string) => {
    setMenuLoading((prev) => ({ ...prev, [category]: true }));
    try {
      const res = await fetch(`/api/getitems?page=1&limit=10&category=${category}`);
      const data = await res.json();
      setMenu((prev) => ({ ...prev, [category]: data }));
      setPage((prev) => ({ ...prev, [category]: 2 }));
      setHasMore((prev) => ({ ...prev, [category]: data.length === 10 }));
    } finally {
      setMenuLoading((prev) => ({ ...prev, [category]: false }));
    }
  };

  fetchPlatters();
  menuCategoryOrder.forEach(fetchMenuCategory);
}, []);

  

  const lastMenuItemRef = (category: string, node: HTMLDivElement | null) => {
  if (menuLoading[category] || !hasMore[category]) return;

  if (!observers.current[category]) {
    observers.current[category] = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage((prev) => ({
          ...prev,
          [category]: (prev[category] || 1) + 1,
        }));
      }
    });
  }

  if (node) observers.current[category].observe(node);
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
                {platterLoading && filteredPlatters.length === 0 ? (
                  [...Array(4)].map((_, i) => <SkeletonLoader key={i} />)
                ) : (
                  filteredPlatters.map((platter) => (
                    <div key={platter.id}>
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
                <h1 className="text-3xl font-semibold text-white bg-gradient-to-r from-[#741052] to-[#d0269b] py-3 px-6 rounded-lg shadow-md text-center">
                  {category}
                </h1>
              </div>
              <div className="grid grid-cols-2 gap-4 pr-6 pl-1 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
                {menuLoading[category] && filteredItems.length === 0 ? (
                  [...Array(4)].map((_, i) => <SkeletonLoader key={i} />)
                ) : (
                  filteredItems.map((item, index) => (
                    <div
                      ref={index === filteredItems.length - 1 ? (node) => lastMenuItemRef(category, node) : null}
                      key={item.id}
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
