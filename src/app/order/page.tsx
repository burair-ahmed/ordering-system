'use client';

import { useState, useEffect } from "react";
import MenuItem from "../components/MenuItem";
import Hero from "../components/Hero";
import { v4 as uuidv4 } from 'uuid';

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

const prioritizedCategories = [
  "Sharing Platter",
  "BBQ Deals",
  "Fast Food Deals",
  "Fast Food Platter",
  "Dawat Deal",
  "Dhamaka Discount Platter",
  "Beast BBQ",
  "Rolls Royce",
  "WoodFired Pizza",
  "Burger-e-karachi"
];

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch("/api/getitems");
        if (!response.ok) {
          throw new Error("Failed to fetch menu items");
        }
        const data: MenuItemData[] = await response.json();
        setMenu(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError("Error fetching menu items: " + err.message);
        } else {
          setError("Unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  // Dynamically get remaining categories
  const allCategories = Array.from(new Set(menu.map(item => item.category)));
  const randomCategories = allCategories.filter(
    category => !prioritizedCategories.includes(category)
  );

  // Shuffle random categories
  randomCategories.sort(() => Math.random() - 0.5);

  // Combine prioritized and random categories
  const combinedCategories = [...prioritizedCategories, ...randomCategories];

  // Function to render sections for each category
  const renderCategorySection = (category: string) => {
    const filteredItems = menu.filter(item => item.category === category);

    return (
      <div key={category} className="mt-8">
        <div className="w-full flex justify-center mb-4">
          <h1 className="text-3xl font-semibold text-white bg-[#741052] py-3 px-6 rounded-lg shadow-md text-center">
            {category}
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-4 w-11/12 mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
          {filteredItems.length === 0 ? (
            <div className="text-black">No items found for {category}</div>
          ) : (
            filteredItems.map((item) => (
              <MenuItem key={uuidv4()} item={item} />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white text-black">
      <Hero />
      <div>
        {combinedCategories.map(category => renderCategorySection(category))}
      </div>
    </div>
  );
}
