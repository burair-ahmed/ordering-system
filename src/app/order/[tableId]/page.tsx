// src/app/order/[tableId]/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'; // Import from next/navigation
import MenuPage from '../page';

const TableMenuPage = () => {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId'); // Access query parameter using get()

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
