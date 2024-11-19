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
        { id: 2, name: "Burger", description: "Juicy beef burger", price: 5 },
      ];
      setMenu(data);
    };

    fetchMenu();
  }, []);

  return (
    <div>
      <h1>Restaurant Menu</h1>
      <div className="flex grid-col gap-x-4 w-4/5 mx-auto">
        {menu.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>

      <button>
        <h1>Button HEading</h1>
        <p>Button Para</p>
        
      </button>
    </div>
  );
}
