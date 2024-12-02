'use client'

import { useSearchParams } from 'next/navigation'; // Import from next/navigation
import MenuPage from '../page';

const TableMenuPage = () => {
  const searchParams = useSearchParams();
  
  // Check if searchParams is null or if tableId is not available
  const tableId = searchParams ? searchParams.get('tableId') : null; // Access query parameter safely

  // If tableId is not available, you can render a fallback UI or return null
  if (!tableId) {
    return <div>Loading table menu...</div>;
  }

  return (
    <div>
      <h2>Table {tableId} Menu</h2>
      <MenuPage /> {/* Table-specific menu display */}
    </div>
  );
};

export default TableMenuPage;
