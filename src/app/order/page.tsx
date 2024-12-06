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
  image: string; // This should be the property expected by MenuItem
  variations: Variation[]; // This should match the expected format
  category: string; // Add the category property
}

interface Variation {
  name: string;
  price: string;
}

const categories = [
  "Charming Chai", "Paratha Performance", "Beast BBQ", "Rolls Royce",
  "Very Fast Food", "Burger-E-Karachi", "Woodfired Pizza", "Shawarmania",
  "French Boys Fries", "Dashing Desserts", "Chicken Karahis",
  "Mutton Karahis", "Handi & Qeema", "Beverages", "Juicy Lucy", "Very Extra"
];

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // To handle loading state
  const [error, setError] = useState<string | null>(null); // To handle error state

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // Fetch menu items from your API route
        const response = await fetch("/api/getitems"); // Update with your actual API route
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
    return <div>Loading...</div>; // Loading state
  }

  if (error) {
    return <div>{error}</div>; // Error state
  }

  // Function to render sections for each category
  const renderCategorySection = (category: string) => {
    const filteredItems = menu.filter(item => item.category === category);
    
    return (
      <div key={category} className="mt-8">
        {/* Heading with background color only behind the text and centered */}
        <div className="w-full flex justify-center mb-4">
          <h1 className="text-3xl font-semibold text-white bg-[#741052] py-3 px-6 rounded-lg shadow-md text-center">
            {category}
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-4 w-11/12 mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
          {filteredItems.length === 0 ? (
            <div className="text-black">No items found for {category}</div> // Message if no items are found
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

      {/* Displaying the whole menu with each category section */}
      <div>
        {/* Render all categories dynamically */}
        {categories.map(category => renderCategorySection(category))}
      </div>
    </div>
  );
}
