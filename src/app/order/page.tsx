'use client';

import { useState, useEffect } from "react";
import MenuItem from "../components/MenuItem";

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
      <h1>Restaurant Menu</h1>
      <div className="grid grid-cols-4 gap-2 w-4/5 mx-auto">
  {menu.map((item) => (
    <MenuItem key={item.id} item={item} />
  ))}
</div>



    </div>
  );
}
