"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Define context type
interface TableContextType {
  tableId: string;
  setTableId: (id: string) => void;
}

// Create the context
const TableContext = createContext<TableContextType | undefined>(undefined);

// Custom hook to use the TableContext
export const useTable = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error("useTable must be used within a TableProvider");
  }
  return context;
};

// Provider component
export const TableProvider = ({ children }: { children: ReactNode }) => {
  const [tableId, setTableId] = useState<string>("1"); // Default table ID

  return (
    <TableContext.Provider value={{ tableId, setTableId }}>
      {children}
    </TableContext.Provider>
  );
};
