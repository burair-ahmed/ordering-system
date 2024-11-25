'use client';

import { useState, useEffect } from "react";
import MenuItem from "../components/MenuItem";
import CategoryBanner from "../components/CategoriesBanner";
import Hero from "../components/Hero";

interface MenuItemData {
  id: number;
  name: string;
  description: string;
  price: number;
}

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuItemData[]>([]);

  useEffect(() => {
    const fetchMenu = async () => {
      const data: MenuItemData[] = [
        { id: 1, name: "Pizza", description: "Test", price: 10 },
        { id: 2, name: "Burger", description: "Juicy beef ", price: 5 },
        { id: 3, name: "Fries", description: "Test", price: 10 },
        { id: 4, name: "Burger", description: "Juicy burger", price: 5 },
        { id: 5, name: "Pizza", description: "Test", price: 10 },
        { id: 6, name: "Burger", description: "beef burger", price: 5 },
        { id: 7, name: "Pizza", description: "Test", price: 10 },
        { id: 8, name: "Burger", description: "burger", price: 5 },
      ];
      setMenu(data);
    };

    fetchMenu();
  }, []);

  return (
    <div>
      {/* <CategoryBanner />
       */}
       <Hero/>
      <div className="grid grid-cols-1 gap-4 w-11/12 mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {menu.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
