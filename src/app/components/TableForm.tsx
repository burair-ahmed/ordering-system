'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";


export default function TableForm() {
  const [tableNumber, setTableNumber] = useState<string>("");
  const router = useRouter();

  // Generate tables from 1 to 30 and OT-1 to OT-30
  const generateTableOptions = () => {
    const tables: string[] = [];
    for (let i = 1; i <= 30; i++) {
      tables.push(`${i}`); // Table 1-30
      tables.push(`OT-${i}`); // OT-1 to OT-30
    }
    return tables;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/order?tableId=${tableNumber}`);
  };

  return (
    <div className="p-4 flex items-center mx-auto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center w-full space-y-4 border-2 border-[#741052] md:w-4/12 mx-auto py-8 rounded-[10px] bg-[#f7f7ff]"
      >
        <label htmlFor="tableNumber" className="text-lg font-bold">
          Select Table Number:
        </label>
        <select
          id="tableNumber"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-64 text-center"
          required
        >
          <option value="" disabled>
            Choose a table
          </option>
          {generateTableOptions().map((table, index) => (
            <option key={index} value={table}>
              {table}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-[#741052] text-white px-4 py-2 rounded-lg hover:bg-[#5a0c3b] transition duration-300"
        >
          Select Table
        </button>
      </form>
    </div>
  );
}
