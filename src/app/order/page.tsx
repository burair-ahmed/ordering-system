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
}

interface Variation {
  name: string;
  price: string;
}


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
      }
       finally {
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

  return (
    <div>
      <Hero />
      <div className="grid grid-cols-1 gap-4 w-11/12 mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {menu.map((item) => (
  <MenuItem key={uuidv4()} item={item} />
          ))}
      </div>
    </div>
  );
}
